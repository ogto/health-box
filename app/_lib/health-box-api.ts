import { cache } from "react";

export type HealthBoxRecord = Record<string, unknown>;

export type HealthBoxDealerContextResponse = {
  valid: boolean;
  reason?: string;
  appType?: string;
  host?: string;
  slug?: string;
  dealerMallId?: number;
  mallName?: string;
  displayName?: string;
  supportEmail?: string;
  supportPhone?: string;
};

export type HealthBoxDealerPublicResponse = {
  dealerMallId?: number;
  slug?: string;
  mallName?: string;
  displayName?: string;
  supportEmail?: string;
  supportPhone?: string;
};

export type HealthBoxPublicSiteConfig = {
  id?: number;
  logoUrl?: string;
  faviconUrl?: string;
  mainVisualUrl?: string;
  middleBannerUrl?: string;
  shareThumbnailUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  searchPlaceholder?: string;
  policyText?: string;
  customerCenterText?: string;
};

export type HealthBoxPageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const API_BASE_URL = process.env.HEALTH_BOX_API_BASE_URL?.trim().replace(/\/+$/, "") || "";

function buildUrl(path: string, query?: Record<string, string | number | null | undefined>) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function unwrapApiResponse<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if ("data" in record) {
      return record.data as T;
    }

    if ("result" in record) {
      return record.result as T;
    }

    if ("payload" in record) {
      return record.payload as T;
    }
  }

  return payload as T;
}

export function hasHealthBoxApi() {
  return Boolean(API_BASE_URL);
}

export async function healthBoxFetch<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT";
    query?: Record<string, string | number | null | undefined>;
    body?: unknown;
    headers?: HeadersInit;
  },
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("HEALTH_BOX_API_BASE_URL is not configured");
  }

  const response = await fetch(buildUrl(path, options?.query), {
    method: options?.method || "GET",
    cache: "no-store",
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`HealthBox API ${response.status}: ${message || response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as unknown;
  return unwrapApiResponse<T>(payload);
}

export async function healthBoxFetchOrNull<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT";
    query?: Record<string, string | number | null | undefined>;
    body?: unknown;
    headers?: HeadersInit;
  },
) {
  try {
    return await healthBoxFetch<T>(path, options);
  } catch (error) {
    console.error(`[health-box-api] ${path}`, error);
    return null;
  }
}

export const fetchPublicSiteConfig = cache(async () =>
  healthBoxFetchOrNull<HealthBoxPublicSiteConfig>("/health-box/public/public-site-config"),
);

export const fetchDealerContext = cache(async (host: string) =>
  healthBoxFetchOrNull<HealthBoxDealerContextResponse>("/health-box/public/dealer-context", {
    query: { host },
  }),
);

export const fetchDealerPublicBySlug = cache(async (slug: string) =>
  healthBoxFetchOrNull<HealthBoxDealerPublicResponse>("/health-box/public/dealer-malls/by-slug", {
    query: { slug },
  }),
);

export const fetchDealerPublicConfig = cache(async (slug: string) =>
  healthBoxFetchOrNull<HealthBoxDealerPublicResponse>("/health-box/public/dealer-public-config", {
    query: { slug },
  }),
);

export async function fetchAdminDealerMalls() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/dealer-malls");
}

export async function fetchAdminDealerApplications() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/dealer-applications");
}

export async function fetchAdminBuyerSignupApplications() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/buyer-signup-applications");
}

export async function fetchAdminMembers() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/members");
}

export async function fetchAdminDealerMallMembers(dealerMallId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord[]>(`/health-box/admin/dealer-malls/${dealerMallId}/members`);
}

export async function fetchAdminOrders() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/orders");
}

export async function fetchAdminDealerMallOrders(dealerMallId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord[]>(`/health-box/admin/dealer-malls/${dealerMallId}/orders`);
}

export async function fetchAdminDealerMallPublicConfig(dealerMallId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord>(`/health-box/admin/dealer-malls/${dealerMallId}/public-config`);
}

export async function fetchAdminPublicSiteConfig() {
  return healthBoxFetchOrNull<HealthBoxPublicSiteConfig>("/health-box/admin/public-site-config");
}

export async function fetchAdminProducts(query?: {
  q?: string;
  category?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return healthBoxFetchOrNull<HealthBoxPageResponse<HealthBoxRecord>>("/health-box/admin/products", {
    query,
  });
}

export async function fetchAdminProduct(productId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord>(`/health-box/admin/products/${productId}`);
}

export async function fetchAdminNotices() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/notices");
}

export async function fetchAdminNotice(noticeId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord>(`/health-box/admin/notices/${noticeId}`);
}

export async function fetchAdminMonthlySales(dealerMallId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord[]>(`/health-box/admin/dealer-malls/${dealerMallId}/monthly-sales`);
}

export async function fetchAdminMonthlySettlements(dealerMallId: number) {
  return healthBoxFetchOrNull<HealthBoxRecord[]>(
    `/health-box/admin/dealer-malls/${dealerMallId}/monthly-settlements`,
  );
}

export function stringValue(record: HealthBoxRecord | null | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function formatDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateArray(value: unknown) {
  if (!Array.isArray(value) || value.length < 3) {
    return "";
  }

  const [year, month, day, hour, minute] = value;
  if (
    typeof year !== "number" ||
    !Number.isFinite(year) ||
    typeof month !== "number" ||
    !Number.isFinite(month) ||
    typeof day !== "number" ||
    !Number.isFinite(day)
  ) {
    return "";
  }

  const date = `${year}.${formatDatePart(month)}.${formatDatePart(day)}`;

  if (
    typeof hour === "number" &&
    Number.isFinite(hour) &&
    typeof minute === "number" &&
    Number.isFinite(minute)
  ) {
    return `${date} ${formatDatePart(hour)}:${formatDatePart(minute)}`;
  }

  return date;
}

export function dateTimeValue(record: HealthBoxRecord | null | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    const formatted = formatDateArray(value);
    if (formatted) {
      return formatted;
    }
  }

  return "";
}

export function numberValue(record: HealthBoxRecord | null | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function idValue(record: HealthBoxRecord | null | undefined, ...keys: string[]) {
  const number = numberValue(record, ...keys);
  return number === null ? null : number;
}

export function textOrFallback(value: string, fallback: string) {
  return value || fallback;
}

export function formatWon(value: number | string | null | undefined) {
  if (typeof value === "string" && value.trim().endsWith("원")) {
    return value.trim();
  }

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/[^0-9.-]/g, ""))
        : NaN;

  if (!Number.isFinite(numeric)) {
    return "0원";
  }

  return `${numeric.toLocaleString("ko-KR")}원`;
}

export function toneFromStatus(status: string) {
  if (/(승인 대기|검수중|재고 주의|송장 입력 대기)/.test(status)) {
    return "gold" as const;
  }

  if (/(반품|취소|차감)/.test(status)) {
    return "rose" as const;
  }

  if (/(배송 준비|게시 전|정산 예정|결제 완료)/.test(status)) {
    return "blue" as const;
  }

  if (/(운영중|활성|게시중|출고 완료|확정|정상 판매)/.test(status)) {
    return "green" as const;
  }

  return "cyan" as const;
}
