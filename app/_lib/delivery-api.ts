import type { HealthBoxRecord } from "./health-box-api";

export type DeliveryTrackingEvent = {
  at: unknown;
  location: string;
  status: string;
};

export type DeliveryTrackingResult = {
  courierName: string;
  trackingNumber: string;
  statusText: string;
  isDelivered: boolean;
  events: DeliveryTrackingEvent[];
  errorMessage?: string;
};

type DeliveryApiProgress = {
  dateTime?: string;
  time?: string;
  location?: string;
  currentLocation?: string;
  status?: string;
  statusText?: string;
  description?: string;
  details?: string;
};

type DeliveryApiTraceResult = {
  success?: boolean;
  data?: {
    courierName?: string;
    trackingNumber?: string;
    deliveryStatus?: string;
    deliveryStatusText?: string;
    isDelivered?: boolean;
    progresses?: DeliveryApiProgress[];
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type DeliveryApiTraceResponse = {
  isSuccess?: boolean;
  data?: {
    results?: DeliveryApiTraceResult[];
  };
  results?: DeliveryApiTraceResult[];
  message?: string;
};

const COURIER_CODE_ALIASES: Array<[RegExp, string]> = [
  [/cj|대한통운|씨제이/i, "cj"],
  [/lotte|롯데/i, "lotte"],
  [/hanjin|한진/i, "hanjin"],
  [/우체국|우정|post|korea\s*post/i, "post"],
  [/경동|kyungdong/i, "kyungdong"],
  [/대신|daesin/i, "daesin"],
  [/로젠|logen/i, "logen"],
  [/합동|hapdong/i, "hapdong"],
  [/쿠팡|coupang/i, "coupang"],
  [/우리|woori/i, "woori"],
];

function deliveryApiCredentials() {
  const apiKey = process.env.HEALTH_BOX_DELIVERY_API_KEY?.trim() || "";
  const secretKey = process.env.HEALTH_BOX_DELIVERY_API_SECRET_KEY?.trim() || "";
  return { apiKey, secretKey };
}

function normalizeTrackingNumber(value: unknown) {
  return String(value || "").replace(/[\s-]/g, "").trim();
}

function resolveCourierCode(value: unknown) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  const lower = text.toLowerCase();
  if (/^[a-z0-9_-]+$/.test(lower)) {
    const directCodes = new Set([
      "cj",
      "lotte",
      "hanjin",
      "post",
      "kyungdong",
      "daesin",
      "logen",
      "hapdong",
      "coupang",
      "woori",
    ]);
    if (directCodes.has(lower)) {
      return lower;
    }
  }

  return COURIER_CODE_ALIASES.find(([pattern]) => pattern.test(text))?.[1] || "";
}

function deliveryStatusText(value: unknown) {
  const status = String(value || "").toUpperCase();
  const labels: Record<string, string> = {
    AT_PICKUP: "집화",
    DELIVERED: "배송완료",
    IN_TRANSIT: "배송중",
    OUT_FOR_DELIVERY: "배송출발",
    PICKED_UP: "집화",
    PREPARING: "상품 준비중",
    READY: "상품 준비중",
    SHIPPED: "배송중",
  };
  return labels[status] || String(value || "배송중");
}

function normalizeProgress(progress: DeliveryApiProgress): DeliveryTrackingEvent {
  return {
    at: progress.dateTime || progress.time || "",
    location: progress.location || progress.currentLocation || "-",
    status: progress.statusText || progress.description || progress.details || deliveryStatusText(progress.status),
  };
}

function normalizeTraceResult(result: DeliveryApiTraceResult | undefined): DeliveryTrackingResult | null {
  if (!result) {
    return null;
  }

  if (result.success === false || result.error) {
    return {
      courierName: "",
      trackingNumber: "",
      statusText: "",
      isDelivered: false,
      events: [],
      errorMessage: result.error?.message || result.error?.code || "배송조회 결과를 가져오지 못했습니다.",
    };
  }

  const data = result.data;
  if (!data) {
    return null;
  }

  const events = Array.isArray(data.progresses)
    ? data.progresses.map(normalizeProgress).filter((event) => event.status || event.location || event.at)
    : [];

  return {
    courierName: data.courierName || "",
    trackingNumber: data.trackingNumber || "",
    statusText: data.deliveryStatusText || deliveryStatusText(data.deliveryStatus),
    isDelivered: Boolean(data.isDelivered || String(data.deliveryStatus || "").toUpperCase() === "DELIVERED"),
    events,
  };
}

export async function fetchDeliveryApiTracking(order: HealthBoxRecord): Promise<DeliveryTrackingResult | null> {
  const { apiKey, secretKey } = deliveryApiCredentials();
  const courierCode = resolveCourierCode(order.courierCompany);
  const trackingNumber = normalizeTrackingNumber(order.trackingNo);

  if (!apiKey || !secretKey || !courierCode || !trackingNumber) {
    return null;
  }

  try {
    const response = await fetch("https://api.deliveryapi.co.kr/v1/tracking/trace", {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiKey}:${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            clientId: String(order.orderNo || order.id || "health-box-order"),
            courierCode,
            trackingNumber,
          },
        ],
        includeProgresses: true,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as DeliveryApiTraceResponse;
    if (!response.ok) {
      console.error("[delivery-api] trace failed", response.status, payload);
      return null;
    }

    const firstResult = payload.data?.results?.[0] || payload.results?.[0];
    const normalized = normalizeTraceResult(firstResult);
    if (normalized?.errorMessage) {
      console.warn("[delivery-api] trace result error", normalized.errorMessage);
      return null;
    }

    return normalized;
  } catch (error) {
    console.error("[delivery-api] trace error", error);
    return null;
  }
}
