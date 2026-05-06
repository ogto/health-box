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
  createdAt?: string;
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
  updatedAt?: string;
};

export type HealthBoxSalesPolicy = {
  content?: string;
  createdAt?: string;
  deletedAt?: string;
  deletedYn?: string;
  id?: number;
  sortOrder?: number;
  status?: string;
  title?: string;
  updatedAt?: string;
};

export type HealthBoxCategory = {
  categoryCode?: string;
  createdAt?: string;
  deletedAt?: string;
  deletedYn?: string;
  id?: number;
  name?: string;
  slug?: string;
  sortOrder?: number;
  status?: string;
  updatedAt?: string;
};

export type HealthBoxProductOptionValue = {
  id?: number;
  sortOrder?: number;
  status?: string;
  valueCode?: string;
  valueName?: string;
};

export type HealthBoxProductOptionGroup = {
  groupName?: string;
  id?: number;
  requiredYn?: string;
  sortOrder?: number;
  values?: HealthBoxProductOptionValue[];
};

export type HealthBoxProductSku = {
  consumerPrice?: number;
  id?: number;
  memberPrice?: number;
  optionValueCodes?: string[];
  safetyStock?: number;
  settlementBasePrice?: number;
  skuCode?: string;
  skuName?: string;
  soldOutYn?: string;
  status?: string;
  stockQuantity?: number;
  supplyPrice?: number;
};

export type HealthBoxPageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const API_BASE_URL = process.env.HEALTH_BOX_API_BASE_URL?.trim().replace(/\/+$/, "") || "";
const PUBLIC_REVALIDATE_SECONDS = 60;

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
    method?: "DELETE" | "GET" | "POST" | "PUT";
    query?: Record<string, string | number | null | undefined>;
    body?: unknown;
    headers?: HeadersInit;
    revalidate?: number;
  },
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("HEALTH_BOX_API_BASE_URL is not configured");
  }

  const method = options?.method || "GET";
  const isRead = method === "GET" && !options?.body;
  const response = await fetch(buildUrl(path, options?.query), {
    method,
    cache: isRead && typeof options?.revalidate === "number" ? undefined : "no-store",
    next: isRead && typeof options?.revalidate === "number" ? { revalidate: options.revalidate } : undefined,
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
    method?: "DELETE" | "GET" | "POST" | "PUT";
    query?: Record<string, string | number | null | undefined>;
    body?: unknown;
    headers?: HeadersInit;
    revalidate?: number;
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
  healthBoxFetchOrNull<HealthBoxPublicSiteConfig>("/health-box/public/public-site-config", {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  }),
);

export const fetchDealerContext = cache(async (host: string) =>
  healthBoxFetchOrNull<HealthBoxDealerContextResponse>("/health-box/public/dealer-context", {
    query: { host },
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  }),
);

export const fetchDealerPublicBySlug = cache(async (slug: string) =>
  healthBoxFetchOrNull<HealthBoxDealerPublicResponse>("/health-box/public/dealer-malls/by-slug", {
    query: { slug },
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  }),
);

export const fetchDealerPublicConfig = cache(async (slug: string) =>
  healthBoxFetchOrNull<HealthBoxDealerPublicResponse>("/health-box/public/dealer-public-config", {
    query: { slug },
    revalidate: PUBLIC_REVALIDATE_SECONDS,
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

export async function fetchAdminOrder(orderId: number, options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxRecord>(`/health-box/admin/orders/${orderId}`, {
    revalidate: options?.revalidate,
  });
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
}, options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxPageResponse<HealthBoxRecord>>("/health-box/admin/products", {
    query,
    revalidate: options?.revalidate,
  });
}

export async function fetchAdminProduct(productId: number, options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxRecord>(`/health-box/admin/products/${productId}`, {
    revalidate: options?.revalidate,
  });
}

export async function fetchDealerMallProductPage(
  dealerSlug: string,
  query?: {
    q?: string;
    category?: string;
    page?: number;
    size?: number;
  },
) {
  return healthBoxFetchOrNull<HealthBoxPageResponse<HealthBoxRecord>>(
    `/health-box/dealer-malls/${encodeURIComponent(dealerSlug)}/products`,
    {
      query,
      revalidate: PUBLIC_REVALIDATE_SECONDS,
    },
  );
}

export async function fetchDealerMallProduct(dealerSlug: string, productSlug: string) {
  return healthBoxFetchOrNull<HealthBoxRecord>(
    `/health-box/dealer-malls/${encodeURIComponent(dealerSlug)}/products/${encodeURIComponent(productSlug)}`,
    {
      revalidate: PUBLIC_REVALIDATE_SECONDS,
    },
  );
}

export async function fetchAdminCategories(options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxCategory[]>("/health-box/admin/categories", {
    revalidate: options?.revalidate,
  });
}

export async function fetchAdminProductSkus(productId: number, options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxProductSku[]>(`/health-box/admin/products/${productId}/skus`, {
    revalidate: options?.revalidate,
  });
}

export async function fetchAdminSalesPolicies(options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxSalesPolicy[]>("/health-box/admin/sales-policies", {
    revalidate: options?.revalidate,
  });
}

export async function fetchAdminDeliveryPolicies(options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxSalesPolicy[]>("/health-box/admin/delivery-policies", {
    revalidate: options?.revalidate,
  });
}

export async function fetchAdminNotices() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/notices");
}

export async function fetchStorefrontProductPage(query?: {
  q?: string;
  category?: string;
  status?: string;
  page?: number;
  size?: number;
}) {
  return fetchAdminProducts(query, { revalidate: PUBLIC_REVALIDATE_SECONDS });
}

export async function fetchStorefrontNotices() {
  return healthBoxFetchOrNull<HealthBoxRecord[]>("/health-box/admin/notices", {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
  });
}

export async function fetchAdminNotice(noticeId: number, options?: { revalidate?: number }) {
  return healthBoxFetchOrNull<HealthBoxRecord>(`/health-box/admin/notices/${noticeId}`, {
    revalidate: options?.revalidate,
  });
}

export async function fetchStorefrontProduct(productId: number) {
  return fetchAdminProduct(productId, { revalidate: PUBLIC_REVALIDATE_SECONDS });
}

export async function fetchStorefrontNotice(noticeId: number) {
  return fetchAdminNotice(noticeId, { revalidate: PUBLIC_REVALIDATE_SECONDS });
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
  if (/(CANCELED|반품|취소|차감)/.test(status)) {
    return "rose" as const;
  }

  if (/(PREPARING|상품 준비중|상품준비)/.test(status)) {
    return "gold" as const;
  }

  if (/(PENDING|ORDERED|주문 접수|주문완료)/.test(status)) {
    return "cyan" as const;
  }

  if (/(승인 대기|검수중|재고 주의|송장 입력 대기)/.test(status)) {
    return "gold" as const;
  }

  if (/(배송 준비|게시 전|정산 예정|결제 완료)/.test(status)) {
    return "blue" as const;
  }

  if (/(운영중|활성|게시중|출고 완료|확정|정상 판매)/.test(status)) {
    return "green" as const;
  }

  return "cyan" as const;
}
