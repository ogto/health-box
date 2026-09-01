"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import {
  fetchAdminDealerMalls,
  hasHealthBoxApi,
  healthBoxFetch,
  healthBoxInternalHeaders,
  type HealthBoxSalesPolicy,
  type HealthBoxRecord,
} from "../_lib/health-box-api";
import { requireWritableAdminSession as requireAdminSession } from "../_lib/admin-auth";
import {
  parseInformationLines,
  serializeProductCommercePolicy,
  type ProductDisclosureType,
} from "../_lib/product-commerce";
import {
  defaultStorefrontPolicyBundle,
  normalizeZipRanges,
  serializeStorefrontPolicyBundle,
} from "../_lib/storefront-policy";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";

export type CreateDealerMallDialogState = {
  message?: string;
  status: "error" | "idle" | "success";
};

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : undefined;
}

function storefrontLinkValue(formData: FormData, key: string, label: string) {
  const value = formString(formData, key);
  if (value === undefined || value === "") {
    return value;
  }

  if (/^\/(?!\/)/.test(value) || /^https?:\/\/\S+$/i.test(value)) {
    return value;
  }

  throw new Error(`${label}는 /로 시작하는 내부 경로 또는 http/https 주소로 입력해주세요.`);
}

function optionalNumber(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function stringValues(formData: FormData, key: string) {
  return Array.from(
    new Set(
      formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function positiveIntegerValues(formData: FormData, key: string) {
  return Array.from(
    new Set(
      stringValues(formData, key)
        .map(Number)
        .filter((value) => Number.isSafeInteger(value) && value > 0),
    ),
  );
}

function collectStorefrontNavigationItems(formData: FormData) {
  const jsonValue = optionalString(formData, "mainNavigationJson");
  if (jsonValue) {
    return jsonValue;
  }

  const count = optionalNumber(formData, "navigationCount") ?? 0;
  const items = [];

  for (let index = 0; index < count; index += 1) {
    const label = optionalString(formData, `navigationLabel_${index}`);
    const href = optionalString(formData, `navigationHref_${index}`);
    if (!label || !href) {
      continue;
    }

    const key = optionalString(formData, `navigationKey_${index}`) || `custom-${index + 1}`;
    const style = optionalString(formData, `navigationStyle_${index}`) === "category" ? "category" : "link";
    const visible = formData.get(`navigationVisible_${index}`) === "on";

    items.push({
      href,
      key,
      label,
      sortOrder: index + 1,
      style,
      visible,
    });
  }

  return JSON.stringify(items);
}

function optionalJsonArray<T>(formData: FormData, key: string): T[] | undefined {
  const value = optionalString(formData, key);
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : undefined;
  } catch {
    return undefined;
  }
}

function buildNoticeSummary(body: string | undefined) {
  if (!body) {
    return undefined;
  }

  const singleLine = noticeBodyToText(body)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  if (!singleLine) {
    return undefined;
  }

  return singleLine.length > 120 ? `${singleLine.slice(0, 117)}...` : singleLine;
}

function buildNoticeChecklist(body: string) {
  return noticeBodyToText(body)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function noticeBodyToText(body: string) {
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function buildNoticeSlug(formData: FormData, title: string, id: number | undefined) {
  const existingSlug = optionalString(formData, "slug");
  if (existingSlug) {
    return existingSlug;
  }

  if (id) {
    return `notice-${id}`;
  }

  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  return base ? `${base}-${Date.now()}` : `notice-${Date.now()}`;
}

function buildSafeSlug(value: string, fallbackPrefix: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return base || `${fallbackPrefix}-${Date.now()}`;
}

function normalizeDealerDomainToSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.everybuy\.co\.kr\/?$/, "")
    .split("/")[0]
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function numberFromRecord(record: HealthBoxRecord | null | undefined, ...keys: string[]) {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const number = Number(value);
      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return undefined;
}

async function findDealerMallWithSlug(slug: string, currentDealerMallId?: number) {
  const dealerMalls = await fetchAdminDealerMalls();

  return (dealerMalls || []).find((dealerMall) => {
    const dealerMallId = numberFromRecord(dealerMall, "id", "dealerMallId");
    const isSameDealerMall = currentDealerMallId && dealerMallId === currentDealerMallId;
    const existingSlug = normalizeDealerDomainToSlug(
      typeof dealerMall.slug === "string" ? dealerMall.slug : "",
    );

    return !isSameDealerMall && existingSlug === slug;
  });
}

function redirectIfRequested(formData: FormData, defaultToast?: string) {
  const redirectTo = optionalString(formData, "redirectTo");
  if (redirectTo) {
    const toast = optionalString(formData, "toast") || defaultToast;
    const toastError = optionalString(formData, "toastError");
    if (toast) {
      redirect(buildRedirectWithMessage(redirectTo, "toast", toast));
    }

    if (toastError) {
      redirect(buildRedirectWithMessage(redirectTo, "toastError", toastError));
    }

    redirect(redirectTo);
  }
}

function buildRedirectWithMessage(path: string, key: string, value: string) {
  const hashIndex = path.indexOf("#");
  const basePath = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const params = new URLSearchParams();
  params.set(key, value);
  return `${basePath}${basePath.includes("?") ? "&" : "?"}${params.toString()}${hash}`;
}

function redirectFormError(formData: FormData, message: string): never {
  const redirectTo = optionalString(formData, "errorRedirectTo") || optionalString(formData, "redirectTo");
  if (redirectTo) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", message));
  }

  throw new Error(message);
}

function actionErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  return fallback;
}

function orderActionErrorMessage(error: unknown, fallback: string) {
  const message = actionErrorMessage(error, fallback).replace(/^HealthBox API \d+:\s*/i, "");
  if (/shipping address cannot be changed/i.test(message)) return "출고가 시작된 주문은 배송지를 수정할 수 없습니다.";
  if (/only unshipped orders can be delayed/i.test(message)) return "발송 전 주문만 지연 처리할 수 있습니다.";
  if (/active .*claim/i.test(message)) return "이미 처리 중인 취소·반품·교환 요청이 있습니다.";
  if (/must be approved before completion/i.test(message)) return "먼저 요청을 승인한 뒤 완료 처리해주세요.";
  if (/replacement delivery/i.test(message)) return "교환 상품의 배송완료 처리 후 교환을 완료해주세요.";
  if (/invalid shipment status transition/i.test(message)) return "현재 상태에서는 선택한 배송 상태로 변경할 수 없습니다.";
  if (/courier company and tracking number/i.test(message)) return "발송 처리에는 택배사와 송장번호가 필요합니다.";
  if (/Toss payment cancellation failed|Toss cancellation/i.test(message)) return "결제 환불 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
  return message || fallback;
}

function ensureApiConfigured() {
  if (!hasHealthBoxApi()) {
    throw new Error("HEALTH_BOX_API_BASE_URL is not configured");
  }
}

function isMissingEndpointError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /HealthBox API (404|405):/i.test(message);
}

type UploadedFileResponse = {
  fileDownloadUri?: string;
  fileName?: string;
  fileType?: string;
  size?: number;
};

type ProductMediaItem = {
  altText?: string;
  id?: number;
  mediaType?: string;
  mediaUrl?: string;
  sortOrder?: number;
};

async function fetchExistingProductForSave(id: number | undefined) {
  if (!id) {
    return {};
  }

  try {
    return await healthBoxFetch<HealthBoxRecord>(`/health-box/admin/products/${id}`);
  } catch (error) {
    if (!isMissingEndpointError(error)) {
      console.error("[saveProductAction] failed to fetch existing product", error);
    }
    return {};
  }
}

function getUploadBaseUrl() {
  const explicitBaseUrl = process.env.HEALTH_BOX_UPLOAD_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const healthBoxBaseUrl = process.env.HEALTH_BOX_API_BASE_URL?.trim();
  if (healthBoxBaseUrl) {
    return healthBoxBaseUrl.replace(/\/+$/, "");
  }

  throw new Error("HEALTH_BOX_UPLOAD_API_BASE_URL or HEALTH_BOX_API_BASE_URL is required");
}

function getCdnBaseUrl() {
  const explicitBaseUrl = process.env.HEALTH_BOX_CDN_BASE_URL?.trim();
  return explicitBaseUrl?.replace(/\/+$/, "") || new URL(getUploadBaseUrl()).origin;
}

function normalizeCdnUrl(value: string, cdnBaseUrl = getCdnBaseUrl()) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const baseUrl = new URL(cdnBaseUrl);
  const normalizedUrl = /^https?:\/\//i.test(trimmed)
    ? new URL(trimmed)
    : trimmed.startsWith("//")
      ? new URL(`${baseUrl.protocol}${trimmed}`)
      : new URL(trimmed.replace(/^\/?/, "/"), baseUrl);

  if (normalizedUrl.hostname.toLowerCase() === baseUrl.hostname.toLowerCase()) {
    normalizedUrl.protocol = baseUrl.protocol;
    normalizedUrl.host = baseUrl.host;
  }

  return normalizedUrl.toString();
}

function getProductImageFiles(formData: FormData) {
  return formData.getAll("productImages").filter((value): value is File => value instanceof File && value.size > 0);
}

async function parseUploadResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`Upload API ${response.status}: ${message || response.statusText}`);
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const wrappedPayload = record.data || record.result || record.payload;

    if (Array.isArray(wrappedPayload)) {
      return wrappedPayload as UploadedFileResponse[];
    }

    if (wrappedPayload && typeof wrappedPayload === "object") {
      return [wrappedPayload as UploadedFileResponse];
    }
  }

  return Array.isArray(payload) ? (payload as UploadedFileResponse[]) : [payload as UploadedFileResponse];
}

async function uploadProductImageFiles(files: File[]) {
  if (!files.length) {
    return [];
  }

  const uploadBaseUrl = getUploadBaseUrl();
  const cdnBaseUrl = getCdnBaseUrl();

  const outboundFormData = new FormData();
  for (const file of files) {
    outboundFormData.append("files", file);
  }

  const uploaded = await parseUploadResponse(
    await fetch(`${uploadBaseUrl}/health-box/admin/files`, {
      method: "POST",
      headers: healthBoxInternalHeaders(),
      body: outboundFormData,
    }),
  );

  return uploaded.map((file) => (file.fileDownloadUri ? normalizeCdnUrl(file.fileDownloadUri, cdnBaseUrl) : ""));
}

function existingProductMediaItems(product: HealthBoxRecord) {
  const mediaItems = product.mediaItems;
  if (!Array.isArray(mediaItems)) {
    return [];
  }

  return mediaItems.filter((item): item is ProductMediaItem => Boolean(item && typeof item === "object"));
}

function mediaItemsFromFormAndUploads(
  formData: FormData,
  existingProduct: HealthBoxRecord,
  uploadedImageUrls: string[],
) {
  const formImageUrls = [
    optionalString(formData, "thumbnailUrl"),
    optionalString(formData, "image"),
    optionalString(formData, "imageUrl"),
    optionalString(formData, "mainImageUrl"),
    optionalString(formData, "fileDownloadUri"),
  ].filter((url): url is string => Boolean(url));

  const gallery = optionalString(formData, "gallery");
  if (gallery) {
    try {
      const parsed = JSON.parse(gallery) as unknown;
      if (Array.isArray(parsed)) {
        formImageUrls.push(...parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      formImageUrls.push(...gallery.split(","));
    }
  }

  const existingItems = existingProductMediaItems(existingProduct);
  const existingByUrl = new Map(existingItems.map((item) => [item.mediaUrl ? normalizeCdnUrl(item.mediaUrl) : "", item]));
  const hasSubmittedImageState = formData.has("gallery") || formData.has("thumbnailUrl") || formData.has("image");
  const mediaSourceUrls = hasSubmittedImageState
    ? [...formImageUrls, ...uploadedImageUrls]
    : [...existingItems.map((item) => item.mediaUrl || ""), ...uploadedImageUrls];
  const mediaUrls = Array.from(
    new Set(
      mediaSourceUrls
        .map((url) => (url ? normalizeCdnUrl(url) : ""))
        .filter(Boolean),
    ),
  );

  return mediaUrls.map((mediaUrl, index) => {
    const existingItem = existingByUrl.get(mediaUrl);
    return {
      id: existingItem?.id,
      altText: existingItem?.altText || requiredString(formData, "name"),
      mediaType: existingItem?.mediaType || "IMAGE",
      mediaUrl,
      sortOrder: index,
    };
  });
}

async function submitDealerMall(formData: FormData): Promise<CreateDealerMallDialogState> {
  ensureApiConfigured();

  const mallName = requiredString(formData, "mallName");
  const slug = normalizeDealerDomainToSlug(requiredString(formData, "slug"));
  const applicantName = requiredString(formData, "applicantName");
  const email = requiredString(formData, "email");
  const phone = requiredString(formData, "phone");

  if (!mallName || !slug || !applicantName || !email || !phone) {
    return {
      message: "필수 항목을 모두 입력해주세요.",
      status: "error",
    };
  }

  const duplicatedDealerMall = await findDealerMallWithSlug(slug);
  if (duplicatedDealerMall) {
    return {
      message: "이미 사용 중인 도메인입니다. 다른 도메인을 입력해주세요.",
      status: "error",
    };
  }

  try {
    await healthBoxFetch("/health-box/admin/dealer-malls/manual", {
      method: "POST",
      body: {
        displayName: optionalString(formData, "displayName") || mallName,
        applicantName,
        email,
        phone,
        mallName,
        slug,
        reviewMemo: optionalString(formData, "reviewMemo"),
      },
    });

    revalidatePath("/admin/dealers");
    return {
      message: "딜러몰을 추가했습니다.",
      status: "success",
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const cleanedMessage = rawMessage
      .replace(/^HealthBox API \d+:\s*/, "")
      .replace(/^Error:\s*/, "")
      .trim();

    if (/404|Not Found/i.test(rawMessage)) {
      return {
        message: "백엔드 수동 딜러 등록 API를 찾지 못했습니다.",
        status: "error",
      };
    }

    if (/405|Method Not Allowed/i.test(rawMessage)) {
      return {
        message: "백엔드가 수동 딜러 등록을 아직 지원하지 않습니다.",
        status: "error",
      };
    }

    return {
      message: cleanedMessage || "딜러 추가 중 오류가 발생했습니다.",
      status: "error",
    };
  }
}

export async function saveStorefrontConfigAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();
  const mainVisualUrl = formString(formData, "mainVisualUrl");
  const middleBannerUrl = formString(formData, "middleBannerUrl");
  let mainVisualLinkUrl: string | undefined;
  let middleBannerLinkUrl: string | undefined;
  try {
    mainVisualLinkUrl = storefrontLinkValue(formData, "mainVisualLinkUrl", "메인 비주얼 링크");
    middleBannerLinkUrl = storefrontLinkValue(formData, "middleBannerLinkUrl", "중간 배너 링크");
  } catch (error) {
    redirectFormError(
      formData,
      error instanceof Error ? error.message : "비주얼 링크 주소를 확인해주세요.",
    );
  }

  const policyText = serializeStorefrontPolicyBundle({
    message: optionalString(formData, "policyText") || "",
    commerce: {
      baseShippingFee:
        optionalNumber(formData, "baseShippingFee") ??
        defaultStorefrontPolicyBundle.commerce.baseShippingFee,
      freeShippingThreshold:
        optionalNumber(formData, "freeShippingThreshold") ??
        defaultStorefrontPolicyBundle.commerce.freeShippingThreshold,
      remoteAreaFee:
        optionalNumber(formData, "remoteAreaFee") ??
        defaultStorefrontPolicyBundle.commerce.remoteAreaFee,
      remoteAreaZipRanges: normalizeZipRanges(optionalString(formData, "remoteAreaZipRanges") || ""),
      deliveryGuide:
        optionalString(formData, "defaultDeliveryGuide") ||
        defaultStorefrontPolicyBundle.commerce.deliveryGuide,
      exchangeReturnGuide:
        optionalString(formData, "defaultExchangeReturnGuide") ||
        defaultStorefrontPolicyBundle.commerce.exchangeReturnGuide,
      safetyTip:
        optionalString(formData, "defaultSafetyTip") ||
        defaultStorefrontPolicyBundle.commerce.safetyTip,
    },
    seller: {
      shopName:
        optionalString(formData, "sellerShopName") ||
        defaultStorefrontPolicyBundle.seller.shopName,
      companyName:
        optionalString(formData, "sellerCompanyName") ||
        defaultStorefrontPolicyBundle.seller.companyName,
      representativeName:
        optionalString(formData, "sellerRepresentativeName") ||
        defaultStorefrontPolicyBundle.seller.representativeName,
      businessRegistrationNumber:
        optionalString(formData, "sellerBusinessRegistrationNumber") ||
        defaultStorefrontPolicyBundle.seller.businessRegistrationNumber,
      mailOrderRegistrationNumber:
        optionalString(formData, "sellerMailOrderRegistrationNumber") || "",
      businessAddress:
        optionalString(formData, "sellerBusinessAddress") ||
        defaultStorefrontPolicyBundle.seller.businessAddress,
      supportPhone: optionalString(formData, "sellerSupportPhone") || "",
      supportEmail: optionalString(formData, "sellerSupportEmail") || "",
    },
  });

  await healthBoxFetch("/health-box/admin/public-site-config", {
    method: "PUT",
    body: {
      id: optionalNumber(formData, "id") ?? 0,
      logoUrl: optionalString(formData, "logoUrl"),
      faviconUrl: optionalString(formData, "faviconUrl"),
      mainVisualUrl,
      mainVisualLinkUrl,
      middleBannerUrl,
      middleBannerLinkUrl,
      shareThumbnailUrl: optionalString(formData, "shareThumbnailUrl"),
      metaTitle: optionalString(formData, "metaTitle"),
      metaDescription: optionalString(formData, "metaDescription"),
      mainNavigationJson: collectStorefrontNavigationItems(formData),
      searchPlaceholder: optionalString(formData, "searchPlaceholder"),
      policyText,
      customerCenterText: optionalString(formData, "customerCenterText"),
    },
  });

  revalidatePath("/");
  revalidatePath("/notice");
  revalidatePath("/mypage");
  revalidatePath("/admin/storefront");
  redirectIfRequested(formData, "홈페이지 설정을 저장했습니다.");
}

export async function saveDealerMallPublicConfigAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const dealerMallId = requiredString(formData, "dealerMallId");
  if (!dealerMallId) {
    throw new Error("dealerMallId is required");
  }
  const numericDealerMallId = Number(dealerMallId);
  const redirectTo = optionalString(formData, "redirectTo");
  const slug = normalizeDealerDomainToSlug(optionalString(formData, "slug") || "");
  if (!slug) {
    if (redirectTo) {
      redirect(buildRedirectWithMessage(redirectTo, "toastError", "도메인을 입력해주세요."));
    }

    throw new Error("도메인을 입력해주세요.");
  }

  const duplicatedDealerMall = await findDealerMallWithSlug(slug, numericDealerMallId);
  if (duplicatedDealerMall) {
    if (redirectTo) {
      redirect(
        buildRedirectWithMessage(
          redirectTo,
          "toastError",
          "이미 사용 중인 도메인입니다. 다른 도메인을 입력해주세요.",
        ),
      );
    }

    throw new Error("이미 사용 중인 도메인입니다. 다른 도메인을 입력해주세요.");
  }

  await healthBoxFetch(`/health-box/admin/dealer-malls/${dealerMallId}/public-config`, {
    method: "PUT",
    body: {
      id: optionalNumber(formData, "id") ?? 0,
      dealerMallId: numericDealerMallId,
      mallName: optionalString(formData, "mallName"),
      displayName: optionalString(formData, "displayName"),
      slug,
      supportEmail: optionalString(formData, "supportEmail"),
      supportPhone: optionalString(formData, "supportPhone"),
      activeYn: optionalString(formData, "activeYn"),
    },
  });

  revalidatePath("/admin/dealers");
  redirectIfRequested(formData, "딜러몰 정보를 저장했습니다.");
}

export async function createDealerMallAction(formData: FormData) {
  await requireAdminSession();
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/dealers";
  const result = await submitDealerMall(formData);

  if (result.status === "success") {
    redirect(buildRedirectWithMessage(redirectTo, "createStatus", "success"));
  }

  redirect(
    buildRedirectWithMessage(
      redirectTo,
      "createError",
      result.message || "딜러 추가 중 오류가 발생했습니다.",
    ),
  );
}

export async function createDealerMallDialogAction(
  _previousState: CreateDealerMallDialogState,
  formData: FormData,
) {
  await requireAdminSession();
  return submitDealerMall(formData);
}

export async function approveDealerApplicationAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/dealers#dealer-applications";
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  try {
    await healthBoxFetch(`/health-box/admin/dealer-applications/${applicationId}/approve`, {
      method: "POST",
      body: {
        reviewMemo: optionalString(formData, "reviewMemo"),
      },
    });
  } catch (error) {
    const rawMessage = actionErrorMessage(error, "딜러 승인 중 오류가 발생했습니다.");
    const message = /slug already exists/i.test(rawMessage)
      ? "희망 딜러몰 주소가 이미 사용 중입니다. 신청 정보를 확인해주세요."
      : rawMessage.replace(/^HealthBox API \d+:\s*/, "").replace(/^Error:\s*/, "").trim();
    redirect(buildRedirectWithMessage(redirectTo, "toastError", message));
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dealers");
  redirect(buildRedirectWithMessage(redirectTo, "toast", "딜러 신청을 승인하고 딜러몰을 생성했습니다."));
}

export async function rejectDealerApplicationAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/dealers#dealer-applications";
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  try {
    await healthBoxFetch(`/health-box/admin/dealer-applications/${applicationId}/reject`, {
      method: "POST",
      body: {
        rejectReason: optionalString(formData, "rejectReason") || "운영 검토 보류",
        reviewMemo: optionalString(formData, "reviewMemo"),
      },
    });
  } catch (error) {
    const message = actionErrorMessage(error, "딜러 신청 반려 중 오류가 발생했습니다.")
      .replace(/^HealthBox API \d+:\s*/, "")
      .replace(/^Error:\s*/, "")
      .trim();
    redirect(buildRedirectWithMessage(redirectTo, "toastError", message));
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dealers");
  redirect(buildRedirectWithMessage(redirectTo, "toast", "딜러 신청을 반려했습니다."));
}

export async function approveBuyerSignupApplicationAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/members";
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  let approvalError = "";
  try {
    await healthBoxFetch(`/health-box/admin/buyer-signup-applications/${applicationId}/approve`, {
      method: "POST",
      body: {
        reviewMemo: optionalString(formData, "reviewMemo"),
      },
    });
  } catch (error) {
    const message = actionErrorMessage(error, "회원 승인 중 오류가 발생했습니다.");
    approvalError = /existing buyer account belongs to different dealer mall/i.test(message)
      ? "기존 구매자 계정이 다른 딜러몰에 연결되어 있어 승인하지 못했습니다. 백엔드 수정 반영 후 다시 승인해주세요."
      : message
          .replace(/^HealthBox API \d+:\s*/, "")
          .replace(/^Error:\s*/, "")
          .trim() || "회원 승인 중 오류가 발생했습니다.";
  }

  if (approvalError) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", approvalError));
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/members");
  redirect(buildRedirectWithMessage(redirectTo, "toast", "회원 가입을 승인했습니다."));
}

export async function rejectBuyerSignupApplicationAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/members";
  if (!applicationId) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "회원 신청 정보가 올바르지 않습니다."));
  }

  try {
    await healthBoxFetch(`/health-box/admin/buyer-signup-applications/${applicationId}/reject`, {
      method: "POST",
      body: {
        rejectReason: optionalString(formData, "rejectReason") || "가입 정보 재확인 필요",
      },
    });
  } catch (error) {
    redirect(
      buildRedirectWithMessage(
        redirectTo,
        "toastError",
        actionErrorMessage(error, "회원 신청을 반려하지 못했습니다."),
      ),
    );
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/members");
  redirect(buildRedirectWithMessage(redirectTo, "toast", "회원 가입 신청을 반려했습니다."));
}

export async function saveNoticeAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const id = optionalNumber(formData, "id");
  const title = requiredString(formData, "title");
  const body = sanitizeRichHtml(requiredString(formData, "body"));
  if (!title || !body) {
    redirectFormError(formData, "공지 제목과 내용을 입력해주세요.");
  }

  const summary = optionalString(formData, "summary") || buildNoticeSummary(body) || title;
  const checklistInput = optionalString(formData, "checklist");
  const checklist = checklistInput
    ? checklistInput
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : buildNoticeChecklist(body);

  await healthBoxFetch("/health-box/admin/notices", {
    method: "PUT",
    body: {
      id,
      slug: buildNoticeSlug(formData, title, id),
      category: optionalString(formData, "category") || "운영안내",
      visibility: optionalString(formData, "visibility") || "전체 공개",
      title,
      summary,
      body,
      checklist,
      status: optionalString(formData, "status") || "게시중",
    },
  });

  revalidatePath("/admin/notices");
  redirectIfRequested(formData, id ? "공지를 수정했습니다." : "공지를 등록했습니다.");
}

export async function deleteNoticeAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const noticeId = optionalNumber(formData, "id");
  if (!noticeId) {
    redirect(buildRedirectWithMessage("/admin/notices", "toastError", "삭제할 공지 ID가 없습니다."));
  }

  const slug = optionalString(formData, "slug") || `notice-${noticeId}`;

  await healthBoxFetch(`/health-box/admin/notices/${noticeId}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/notices");
  revalidatePath(`/admin/notices/${slug}`);
  revalidatePath(`/notice/${slug}`);
  redirect(buildRedirectWithMessage("/admin/notices", "toast", "공지가 삭제되었습니다."));
}

async function saveProduct(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const name = requiredString(formData, "name");

  if (!name) {
    throw new Error("상품명을 입력해주세요.");
  }

  const id = optionalNumber(formData, "id");
  const productId = id;
  const existingProduct = await fetchExistingProductForSave(productId);
  const uploadedImageUrls = (await uploadProductImageFiles(getProductImageFiles(formData))).filter(Boolean);
  const mediaItems = mediaItemsFromFormAndUploads(formData, existingProduct, uploadedImageUrls);
  const requestedOptionUseYn = optionalString(formData, "optionUseYn") === "Y" ? "Y" : "N";
  const optionGroups = optionalJsonArray<HealthBoxRecord>(formData, "optionGroups") || [];
  const skus = optionalJsonArray<HealthBoxRecord>(formData, "skus") || [];
  const memberPrice = optionalNumber(formData, "memberPrice") ?? 0;
  const consumerPrice = optionalNumber(formData, "consumerPrice") ?? 0;
  if (consumerPrice > 0 && memberPrice > consumerPrice) {
    throw new Error("회원가는 소비자가보다 높을 수 없습니다.");
  }

  const primaryCategoryId = optionalNumber(formData, "categoryId") ?? 1;
  const categoryIds = Array.from(
    new Set([primaryCategoryId, ...positiveIntegerValues(formData, "categoryIds")]),
  );
  const detailHtml = sanitizeRichHtml(optionalString(formData, "detailHtml") || "");
  const disclosureSource = optionalString(formData, "disclosureSource") === "DETAIL_HTML"
    ? "DETAIL_HTML"
    : "STRUCTURED";
  const disclosureTypeValue = optionalString(formData, "disclosureType");
  const disclosureType: ProductDisclosureType =
    disclosureTypeValue === "GENERAL" ||
    disclosureTypeValue === "PROCESSED_FOOD" ||
    disclosureTypeValue === "HEALTH_FUNCTIONAL_FOOD"
      ? disclosureTypeValue
      : "HEALTH_FUNCTIONAL_FOOD";
  const disclosureItems = parseInformationLines(optionalString(formData, "disclosureItems"));
  if (disclosureSource === "STRUCTURED" && !disclosureItems.length) {
    throw new Error("상품정보 제공고시를 한 개 이상 입력해주세요.");
  }
  if (disclosureSource === "DETAIL_HTML" && !detailHtml) {
    throw new Error("상세페이지 참조를 선택하려면 상품 상세 콘텐츠를 입력해주세요.");
  }

  const salesPolicyText = serializeProductCommercePolicy({
    salesPolicyText: optionalString(formData, "salesPolicyText") || "",
    exchangeReturnGuide: optionalString(formData, "exchangeReturnGuide") || "",
    cautions: optionalString(formData, "cautions") || "",
    safetyTip: optionalString(formData, "safetyTip") || "",
    disclosureSource,
    disclosureType,
    disclosureItems,
    purchaseInformation: parseInformationLines(optionalString(formData, "purchaseInformation")),
    categoryIds,
    bundleProductSlugs: stringValues(formData, "bundleProductSlugs"),
  });
  const hasOptionRows = skus.some((sku) => Array.isArray(sku.optionValueCodes) && sku.optionValueCodes.length > 0);
  const optionUseYn = requestedOptionUseYn === "Y" && (optionGroups.length > 0 || hasOptionRows) ? "Y" : "N";
  const normalizedSkus =
    optionUseYn === "Y"
      ? skus.map((sku) => ({
          ...sku,
          memberPrice: memberPrice + (Number(sku.memberPrice) || 0),
        }))
      : skus;
  const normalizedOptionGroups =
    optionUseYn === "Y" && !optionGroups.length && skus.length
      ? [
          {
            groupName: "옵션",
            requiredYn: "Y",
            sortOrder: 1,
            values: skus
              .map((sku, index) => {
                const optionValueCodes = Array.isArray(sku.optionValueCodes) ? sku.optionValueCodes : [];
                const valueName = typeof sku.skuName === "string" && sku.skuName.trim() ? sku.skuName.trim() : `옵션 ${index + 1}`;
                return {
                  sortOrder: index + 1,
                  status: "ACTIVE",
                  valueCode: String(optionValueCodes[0] || `OPT${index + 1}`),
                  valueName,
                };
              })
              .filter((value) => value.valueCode && value.valueName),
          },
        ]
      : optionGroups;
  const productPayload = {
    id: productId ?? 0,
    brandName: optionalString(formData, "brandName") || "",
    categoryId: primaryCategoryId,
    consumerPrice,
    deliveryPolicyText: optionalString(formData, "deliveryPolicyText") || optionalString(formData, "shipping") || "",
    detailHtml,
    mediaItems: mediaItems.map((item) => ({
      id: item.id ?? 0,
      altText: item.altText || name,
      mediaType: item.mediaType || "IMAGE",
      mediaUrl: item.mediaUrl || "",
      sortOrder: item.sortOrder ?? 0,
    })),
    memberPrice,
    name,
    optionGroups: normalizedOptionGroups,
    optionUseYn,
    priceExposurePolicy: optionalString(formData, "priceExposurePolicy") || "MEMBER_ONLY",
    publishStatus: optionalString(formData, "publishStatus") || "정상 판매",
    salesPolicyText,
    settlementBasePrice: optionalNumber(formData, "settlementBasePrice") ?? 0,
    skus: normalizedSkus,
    sortOrder: optionalNumber(formData, "sortOrder") ?? 0,
    status: optionalString(formData, "status") || "ACTIVE",
    summaryText: optionalString(formData, "summaryText") || optionalString(formData, "summary") || "",
    supplyPrice: optionalNumber(formData, "supplyPrice") ?? 0,
  };

  try {
    await healthBoxFetch("/health-box/admin/products", {
      method: "PUT",
      body: productPayload,
    });
  } catch (error) {
    console.error("[saveProductAction]", error);
    const redirectTo =
      optionalString(formData, "errorRedirectTo") ||
      optionalString(formData, "redirectTo") ||
      (productId ? `/admin/products/product-${productId}` : "/admin/products/new");
    redirect(
      buildRedirectWithMessage(
        redirectTo,
        "toastError",
        actionErrorMessage(error, "상품 저장 중 오류가 발생했습니다."),
      ),
    );
  }

  revalidatePath("/admin/products");
  if (productId) {
    const routeSlug = `product-${productId}`;
    revalidatePath(`/admin/products/${routeSlug}`);
    revalidatePath(`/product/${routeSlug}`);
  }
  revalidatePath("/");
  revalidatePath("/products/best");
  revalidatePath("/products/recommend");
  redirectIfRequested(formData, productId ? "상품 수정을 완료했습니다." : "상품 등록을 완료했습니다.");
}

export async function saveProductAction(formData: FormData) {
  try {
    await saveProduct(formData);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[saveProductAction]", error);
    redirectFormError(formData, actionErrorMessage(error, "상품 저장 중 오류가 발생했습니다."));
  }
}

export async function answerProductInquiryAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const inquiryId = optionalNumber(formData, "inquiryId");
  const productId = optionalNumber(formData, "productId");
  const answer = requiredString(formData, "answer");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/products";

  if (!inquiryId || !productId) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "문의 정보가 올바르지 않습니다."));
  }
  if (answer.length < 2 || answer.length > 2_000) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "답변은 2자 이상 2,000자 이하로 입력해주세요."));
  }

  const body = { answer, answerText: answer, productId, status: "ANSWERED" };
  try {
    try {
      await healthBoxFetch(`/health-box/admin/product-inquiries/${inquiryId}/answer`, {
        method: "PUT",
        body,
      });
    } catch (error) {
      if (!isMissingEndpointError(error)) {
        throw error;
      }
      await healthBoxFetch(`/health-box/admin/product-inquiries/${inquiryId}`, {
        method: "PUT",
        body,
      });
    }
  } catch (error) {
    console.error("[answerProductInquiryAction]", error);
    redirect(
      buildRedirectWithMessage(
        redirectTo,
        "toastError",
        isMissingEndpointError(error)
          ? "상품 문의 답변 API가 아직 연결되지 않았습니다."
          : actionErrorMessage(error, "상품 문의 답변을 저장하지 못했습니다."),
      ),
    );
  }

  revalidatePath(redirectTo);
  revalidatePath(`/product/product-${productId}`);
  redirect(buildRedirectWithMessage(redirectTo, "toast", "상품 문의 답변을 저장했습니다."));
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const name = requiredString(formData, "name");
  const slug = optionalString(formData, "slug") || buildSafeSlug(name, "category");
  if (!name) {
    redirectFormError(formData, "카테고리명을 입력해주세요.");
  }

  await healthBoxFetch("/health-box/admin/categories", {
    method: "PUT",
    body: {
      categoryCode: optionalString(formData, "categoryCode"),
      id: optionalNumber(formData, "id") ?? 0,
      name,
      slug,
      sortOrder: optionalNumber(formData, "sortOrder") ?? 0,
      status: optionalString(formData, "status") || "ACTIVE",
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  redirectIfRequested(formData, optionalNumber(formData, "id") ? "카테고리를 수정했습니다." : "카테고리를 추가했습니다.");
}

export async function saveCategoryOrderAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const categories = optionalJsonArray<HealthBoxRecord>(formData, "categoryOrder") || [];

  await Promise.all(
    categories
      .filter((item) => Number(item.id) > 0 && typeof item.name === "string" && item.name.trim())
      .map((item, index) =>
        healthBoxFetch("/health-box/admin/categories", {
          method: "PUT",
          body: {
            categoryCode: typeof item.categoryCode === "string" ? item.categoryCode : undefined,
            id: Number(item.id),
            name: String(item.name).trim(),
            slug: typeof item.slug === "string" && item.slug.trim() ? item.slug.trim() : buildSafeSlug(String(item.name), "category"),
            sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index * 10,
            status: typeof item.status === "string" && item.status ? item.status : "ACTIVE",
          },
        }),
      ),
  );

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  redirectIfRequested(formData, "카테고리 순서를 저장했습니다.");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const categoryId = optionalNumber(formData, "id");
  if (!categoryId) {
    redirectFormError(formData, "삭제할 카테고리 정보가 없습니다.");
  }

  await healthBoxFetch(`/health-box/admin/categories/${categoryId}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  redirectIfRequested(formData, "카테고리를 삭제했습니다.");
}

export async function saveSalesPolicyTemplateAction(input: {
  content: string;
  id?: number | null;
  sortOrder?: number | null;
  status?: string | null;
  title: string;
}) {
  await requireAdminSession();
  ensureApiConfigured();

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) {
    throw new Error("판매정책 템플릿 이름과 내용을 입력해 주세요.");
  }

  const savedPolicy = await healthBoxFetch<HealthBoxSalesPolicy>("/health-box/admin/sales-policies", {
    method: "PUT",
    body: {
      content,
      id: input.id ?? 0,
      sortOrder: input.sortOrder ?? 0,
      status: input.status || "ACTIVE",
      title,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  return savedPolicy;
}

export async function fetchSalesPolicyTemplateAction(policyId: number) {
  await requireAdminSession();
  ensureApiConfigured();

  if (!policyId) {
    throw new Error("조회할 판매정책 템플릿 ID가 없습니다.");
  }

  return healthBoxFetch<HealthBoxSalesPolicy>(`/health-box/admin/sales-policies/${policyId}`);
}

export async function deleteSalesPolicyTemplateAction(policyId: number) {
  await requireAdminSession();
  ensureApiConfigured();

  if (!policyId) {
    throw new Error("삭제할 판매정책 템플릿 ID가 없습니다.");
  }

  await healthBoxFetch(`/health-box/admin/sales-policies/${policyId}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
}

export async function saveDeliveryPolicyTemplateAction(input: {
  content: string;
  id?: number | null;
  sortOrder?: number | null;
  status?: string | null;
  title: string;
}) {
  await requireAdminSession();
  ensureApiConfigured();

  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) {
    throw new Error("배송정책 템플릿 이름과 내용을 입력해 주세요.");
  }

  const savedPolicy = await healthBoxFetch<HealthBoxSalesPolicy>("/health-box/admin/delivery-policies", {
    method: "PUT",
    body: {
      content,
      id: input.id ?? 0,
      sortOrder: input.sortOrder ?? 0,
      status: input.status || "ACTIVE",
      title,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  return savedPolicy;
}

export async function fetchDeliveryPolicyTemplateAction(policyId: number) {
  await requireAdminSession();
  ensureApiConfigured();

  if (!policyId) {
    throw new Error("조회할 배송정책 템플릿 ID가 없습니다.");
  }

  return healthBoxFetch<HealthBoxSalesPolicy>(`/health-box/admin/delivery-policies/${policyId}`);
}

export async function deleteDeliveryPolicyTemplateAction(policyId: number) {
  await requireAdminSession();
  ensureApiConfigured();

  if (!policyId) {
    throw new Error("삭제할 배송정책 템플릿 ID가 없습니다.");
  }

  await healthBoxFetch(`/health-box/admin/delivery-policies/${policyId}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const productId = optionalNumber(formData, "id");
  if (!productId) {
    redirect(buildRedirectWithMessage("/admin/products", "toastError", "삭제 처리할 상품 ID가 없습니다."));
  }

  const slug = optionalString(formData, "slug") || `product-${productId}`;

  await healthBoxFetch(`/health-box/admin/products/${productId}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");
  revalidatePath("/products/best");
  revalidatePath("/products/recommend");
  redirect(buildRedirectWithMessage("/admin/products", "toast", "상품이 삭제 처리되었습니다."));
}

export async function cancelOrderAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  const cancellationRequestId = requiredString(formData, "cancellationRequestId");
  if (!orderId || !cancellationRequestId) {
    redirectFormError(formData, "취소 요청 정보가 없습니다.");
  }
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";

  try {
    await healthBoxFetch(`/health-box/admin/orders/${orderId}/cancel`, {
      method: "POST",
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "주문 취소에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  redirectIfRequested(formData, "주문 전체 취소를 완료했습니다.");
}

export async function partialCancelOrderAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  const cancellationRequestId = requiredString(formData, "cancellationRequestId");
  const orderItemId = optionalNumber(formData, "orderItemId");
  const quantity = optionalNumber(formData, "quantity");
  if (!orderId || !cancellationRequestId || !orderItemId || !quantity) {
    redirectFormError(formData, "부분취소할 주문상품과 수량을 선택해주세요.");
  }
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";

  try {
    await healthBoxFetch(`/health-box/admin/orders/${orderId}/partial-cancel`, {
      method: "POST",
      body: {
        requestId: cancellationRequestId,
        items: [{ orderItemId, quantity }],
      },
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "부분 취소에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  redirectIfRequested(formData, "주문 부분 취소를 완료했습니다.");
}

export async function updateOrderShippingAddressAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  const receiverName = requiredString(formData, "receiverName");
  const receiverPhone = requiredString(formData, "receiverPhone");
  const baseAddress = requiredString(formData, "baseAddress");
  if (!orderId || !receiverName || !receiverPhone || !baseAddress) {
    redirectFormError(formData, "수령인, 연락처, 기본 주소를 입력해주세요.");
  }

  const redirectTo = optionalString(formData, "redirectTo") || `/admin/orders/${orderId}`;
  try {
    await healthBoxFetch(`/health-box/admin/orders/${orderId}/shipping-address`, {
      method: "PUT",
      body: {
        receiverName,
        receiverPhone,
        zipCode: optionalString(formData, "zipCode"),
        baseAddress,
        detailAddress: optionalString(formData, "detailAddress"),
      },
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "배송지 수정에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirectIfRequested(formData, "배송지 정보를 수정했습니다.");
}

export async function delayShipmentAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const shipmentId = requiredString(formData, "shipmentId");
  const reason = requiredString(formData, "reason");
  if (!shipmentId || !reason) {
    redirectFormError(formData, "발송 지연 사유를 입력해주세요.");
  }

  const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";
  try {
    await healthBoxFetch(`/health-box/admin/shipments/${shipmentId}/delay`, {
      method: "POST",
      body: {
        reason,
        expectedShipDate: optionalString(formData, "expectedShipDate"),
      },
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "발송 지연 처리에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  redirectIfRequested(formData, "발송 지연 상태와 사유를 저장했습니다.");
}

export async function createOrderClaimAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  const claimType = requiredString(formData, "claimType").toUpperCase();
  const reason = requiredString(formData, "reason");
  if (!orderId || !["CANCEL", "RETURN", "EXCHANGE"].includes(claimType) || !reason) {
    redirectFormError(formData, "클레임 종류와 접수 사유를 입력해주세요.");
  }

  const redirectTo = optionalString(formData, "redirectTo") || `/admin/orders/${orderId}`;
  try {
    await healthBoxFetch(`/health-box/admin/orders/${orderId}/claims`, {
      method: "POST",
      body: { claimType, reason },
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "클레임 접수에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  redirectIfRequested(formData, "클레임을 접수했습니다.");
}

export async function processOrderClaimAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  const claimId = requiredString(formData, "claimId");
  const status = requiredString(formData, "status").toUpperCase();
  if (!orderId || !claimId || !["APPROVED", "REJECTED", "COMPLETED", "APPLIED"].includes(status)) {
    redirectFormError(formData, "클레임 처리 정보가 올바르지 않습니다.");
  }

  const redirectTo = optionalString(formData, "redirectTo") || `/admin/orders/${orderId}`;
  try {
    await healthBoxFetch(`/health-box/admin/orders/${orderId}/claims/${claimId}/status`, {
      method: "PUT",
      body: {
        status,
        reason: optionalString(formData, "reason"),
      },
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "클레임 처리에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  const messages: Record<string, string> = {
    APPROVED: "클레임을 승인했습니다.",
    REJECTED: "클레임을 반려했습니다.",
    COMPLETED: "클레임 처리를 완료했습니다.",
    APPLIED: "취소 승인과 환불 처리를 완료했습니다.",
  };
  redirectIfRequested(formData, messages[status]);
}

export async function updateShipmentStatusAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const shipmentId = requiredString(formData, "shipmentId");
  if (!shipmentId) {
    redirectFormError(formData, "배송 처리 정보가 올바르지 않습니다.");
  }

  const shipmentStatus = optionalString(formData, "shipmentStatus");
  const courierCompany = optionalString(formData, "courierCompany");
  const trackingNo = optionalString(formData, "trackingNo");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";
  const normalizedStatus = (shipmentStatus || "").toUpperCase();

  if (normalizedStatus === "SHIPPED" && (!courierCompany || !trackingNo)) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "배송중 처리 시 택배사와 송장번호를 입력해주세요."));
  }

  if (normalizedStatus === "DELIVERED" && !trackingNo) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "배송완료는 송장번호가 등록된 주문만 처리할 수 있습니다."));
  }

  try {
    await healthBoxFetch(`/health-box/admin/shipments/${shipmentId}/status`, {
      method: "PUT",
      body: {
        shipmentStatus,
        courierCompany,
        trackingNo,
        shippedAt: optionalString(formData, "shippedAt"),
        deliveredAt: optionalString(formData, "deliveredAt"),
        handlerAccountId: optionalNumber(formData, "handlerAccountId"),
      },
    });
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "배송 상태 저장에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  redirectIfRequested(formData, "배송 상태를 저장했습니다.");
}

export async function bulkPrepareShipmentsAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const shipmentIds = formData
    .getAll("shipmentId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!shipmentIds.length) {
    const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "상품 준비 처리할 주문을 선택해주세요."));
  }

  const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";

  try {
    await Promise.all(
      shipmentIds.map((shipmentId) =>
        healthBoxFetch(`/health-box/admin/shipments/${shipmentId}/status`, {
          method: "PUT",
          body: {
            shipmentStatus: "PREPARING",
          },
        }),
      ),
    );
  } catch (error) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", orderActionErrorMessage(error, "상품 준비 처리에 실패했습니다.")));
  }

  revalidatePath("/admin/orders");
  redirectIfRequested(formData, `${shipmentIds.length}건을 상품 준비 상태로 변경했습니다.`);
}

const bulkOrderTaskLabels: Record<string, string> = {
  ship: "발송 처리",
  delay: "발송 지연 처리",
  address: "배송지 수정",
  sellerCancel: "판매자 직접 취소",
  cancelApproval: "취소 승인",
  completedCancel: "구매확정 후 취소",
  claimCreate: "반품·교환 접수",
  returnProcess: "반품 처리",
  exchangeProcess: "교환 처리",
};

export async function bulkOrderTaskAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const task = requiredString(formData, "task");
  const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";
  const orderIds = Array.from(
    new Set(
      formData
        .getAll("selectedOrderId")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => /^\d+$/.test(value)),
    ),
  );

  if (!bulkOrderTaskLabels[task]) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "지원하지 않는 일괄 처리 작업입니다."));
  }
  if (!orderIds.length) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "처리할 주문을 선택해주세요."));
  }

  const sharedReason = optionalString(formData, "reason");
  const expectedShipDate = optionalString(formData, "expectedShipDate");
  const claimType = optionalString(formData, "claimType")?.toUpperCase();
  if (task === "delay" && !sharedReason) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "발송 지연 사유를 입력해주세요."));
  }
  if (task === "claimCreate" && (!sharedReason || !claimType || !["RETURN", "EXCHANGE"].includes(claimType))) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "반품·교환 종류와 접수 사유를 입력해주세요."));
  }

  const failures: string[] = [];
  let successCount = 0;

  for (const orderId of orderIds) {
    const orderLabel = optionalString(formData, `orderLabel:${orderId}`) || orderId;
    try {
      if (task === "ship") {
        const shipmentId = requiredString(formData, `shipmentId:${orderId}`);
        const courierCompany = requiredString(formData, `courierCompany:${orderId}`);
        const trackingNo = requiredString(formData, `trackingNo:${orderId}`);
        if (!shipmentId || !courierCompany || !trackingNo) {
          throw new Error("택배사와 송장번호를 모두 입력해주세요.");
        }
        await healthBoxFetch(`/health-box/admin/shipments/${shipmentId}/status`, {
          method: "PUT",
          body: { shipmentStatus: "SHIPPED", courierCompany, trackingNo },
        });
      } else if (task === "delay") {
        const shipmentId = requiredString(formData, `shipmentId:${orderId}`);
        if (!shipmentId) {
          throw new Error("배송 정보가 없습니다.");
        }
        await healthBoxFetch(`/health-box/admin/shipments/${shipmentId}/delay`, {
          method: "POST",
          body: { reason: sharedReason, expectedShipDate },
        });
      } else if (task === "address") {
        const receiverName = requiredString(formData, `receiverName:${orderId}`);
        const receiverPhone = requiredString(formData, `receiverPhone:${orderId}`);
        const baseAddress = requiredString(formData, `baseAddress:${orderId}`);
        if (!receiverName || !receiverPhone || !baseAddress) {
          throw new Error("수령인, 연락처, 기본 주소를 모두 입력해주세요.");
        }
        await healthBoxFetch(`/health-box/admin/orders/${orderId}/shipping-address`, {
          method: "PUT",
          body: {
            receiverName,
            receiverPhone,
            zipCode: optionalString(formData, `zipCode:${orderId}`),
            baseAddress,
            detailAddress: optionalString(formData, `detailAddress:${orderId}`),
          },
        });
      } else if (task === "sellerCancel" || task === "completedCancel") {
        await healthBoxFetch(`/health-box/admin/orders/${orderId}/cancel`, { method: "POST" });
      } else if (task === "claimCreate") {
        await healthBoxFetch(`/health-box/admin/orders/${orderId}/claims`, {
          method: "POST",
          body: { claimType, reason: sharedReason },
        });
      } else {
        const claimId = requiredString(formData, `claimId:${orderId}`);
        const currentClaimStatus = requiredString(formData, `claimStatus:${orderId}`).toUpperCase();
        if (!claimId) {
          throw new Error("처리할 요청 정보가 없습니다.");
        }
        const nextStatus = task === "cancelApproval"
          ? "APPLIED"
          : currentClaimStatus === "REQUESTED"
            ? "APPROVED"
            : "COMPLETED";
        await healthBoxFetch(`/health-box/admin/orders/${orderId}/claims/${claimId}/status`, {
          method: "PUT",
          body: { status: nextStatus },
        });
      }
      successCount += 1;
    } catch (error) {
      failures.push(`${orderLabel}: ${orderActionErrorMessage(error, "처리에 실패했습니다.")}`);
    }
  }

  revalidatePath("/admin/orders");
  const label = bulkOrderTaskLabels[task];
  if (failures.length) {
    const failureSummary = failures.slice(0, 2).join(" / ");
    const moreCount = Math.max(0, failures.length - 2);
    const message = `${label} ${successCount}건 완료, ${failures.length}건 실패: ${failureSummary}${moreCount ? ` 외 ${moreCount}건` : ""}`;
    redirect(buildRedirectWithMessage(redirectTo, "toastError", message));
  }

  redirect(buildRedirectWithMessage(redirectTo, "toastSuccess", `${label} ${successCount}건을 완료했습니다.`));
}

export async function saveAdminStaffAction(formData: FormData) {
  await requireAdminSession();
  ensureApiConfigured();

  const redirectTo = "/admin/staff";
  const id = optionalNumber(formData, "id");
  const name = requiredString(formData, "name");
  const loginId = requiredString(formData, "loginId");
  const phone = requiredString(formData, "phone");
  const password = optionalString(formData, "password");
  const scopeType = optionalString(formData, "scopeType") === "DEALER" ? "DEALER" : "HQ";
  const dealerMallId = scopeType === "DEALER" ? optionalNumber(formData, "dealerMallId") : undefined;

  if (!name || !loginId || !phone) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "직원 이름, 로그인 아이디, 휴대폰 번호를 입력해주세요."));
  }
  if (!id && !password) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "새 직원의 초기 비밀번호를 입력해주세요."));
  }
  if (scopeType === "DEALER" && !dealerMallId) {
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "소속 딜러몰을 선택해주세요."));
  }

  try {
    await healthBoxFetch("/health-box/admin/staff", {
      method: "PUT",
      body: {
        dealerMallId,
        email: optionalString(formData, "email"),
        id,
        loginId,
        memo: optionalString(formData, "memo"),
        name,
        password,
        permissionCodes: stringValues(formData, "permissionCodes"),
        phone,
        positionName: optionalString(formData, "positionName"),
        roleType: optionalString(formData, "roleType") === "OWNER" ? "OWNER" : "STAFF",
        scopeType,
        status: optionalString(formData, "status") === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });
  } catch (error) {
    console.error("[saveAdminStaffAction]", error);
    redirect(
      buildRedirectWithMessage(
        redirectTo,
        "toastError",
        actionErrorMessage(error, "직원 정보를 저장하지 못했습니다."),
      ),
    );
  }

  revalidatePath(redirectTo);
  redirect(buildRedirectWithMessage(redirectTo, "toast", id ? "직원 정보와 권한을 수정했습니다." : "직원 계정을 추가했습니다."));
}
