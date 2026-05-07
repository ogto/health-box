"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  fetchAdminDealerMalls,
  fetchAdminProducts,
  hasHealthBoxApi,
  healthBoxFetch,
  type HealthBoxSalesPolicy,
  type HealthBoxRecord,
} from "../_lib/health-box-api";
import { mapProductRows } from "../_lib/health-box-presenters";

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

function optionalNumber(formData: FormData, key: string) {
  const value = optionalString(formData, key);
  if (!value) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
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

function redirectIfRequested(formData: FormData) {
  const redirectTo = optionalString(formData, "redirectTo");
  if (redirectTo) {
    const toast = optionalString(formData, "toast");
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
  const params = new URLSearchParams();
  params.set(key, value);
  return `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;
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

function ensureApiConfigured() {
  if (!hasHealthBoxApi()) {
    throw new Error("HEALTH_BOX_API_BASE_URL is not configured");
  }
}

function isMissingEndpointError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /HealthBox API (404|405):/i.test(message);
}

async function findProductWithSlug(slug: string, currentProductId: number | undefined) {
  const page = await fetchAdminProducts({ q: slug, page: 1, size: 50 });

  return mapProductRows(page).items.find((product) => {
    const isSameProduct = currentProductId && product.recordId === currentProductId;
    return !isSameProduct && (product.sourceSlug === slug || product.slug === slug);
  });
}

const PRODUCT_IMAGE_MEMBER_NO = "505";
const DEFAULT_UPLOAD_BASE_URL = "https://cloud.1472.ai:18443";
const DEFAULT_CDN_BASE_URL = "https://cdn.1472.ai";

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
  const explicitBaseUrl = process.env.FILE_UPLOAD_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const healthBoxBaseUrl = process.env.HEALTH_BOX_API_BASE_URL?.trim();
  if (healthBoxBaseUrl) {
    try {
      return new URL(healthBoxBaseUrl).origin;
    } catch {
      return healthBoxBaseUrl.replace(/\/api\/v\d+\/?$/i, "").replace(/\/+$/, "");
    }
  }

  return DEFAULT_UPLOAD_BASE_URL;
}

function getCdnBaseUrl() {
  return process.env.FILE_CDN_BASE_URL?.trim().replace(/\/+$/, "") || DEFAULT_CDN_BASE_URL;
}

function normalizeCdnUrl(value: string, cdnBaseUrl = getCdnBaseUrl()) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\/cloud\.1472\.ai(?::\d+)?\/downloadFile\//i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/cloud\.1472\.ai(?::\d+)?\/downloadFile\//i, `${cdnBaseUrl}/`);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return new URL(trimmed.replace(/^\/?/, "/"), cdnBaseUrl).toString();
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

  if (files.length === 1) {
    const uploadUrl = new URL("/api/v1/uploadFile", uploadBaseUrl);
    uploadUrl.searchParams.set("fileType", "I");
    uploadUrl.searchParams.set("ids", "S");
    uploadUrl.searchParams.set("mberNo", PRODUCT_IMAGE_MEMBER_NO);

    const outboundFormData = new FormData();
    outboundFormData.set("file", files[0]);

    const uploaded = await parseUploadResponse(
      await fetch(uploadUrl, {
        method: "POST",
        body: outboundFormData,
      }),
    );

    return uploaded.map((file) => (file.fileDownloadUri ? normalizeCdnUrl(file.fileDownloadUri, cdnBaseUrl) : ""));
  }

  const outboundFormData = new FormData();
  outboundFormData.set("fileType", "I");
  outboundFormData.set("ids", "S");
  outboundFormData.set("mberNo", PRODUCT_IMAGE_MEMBER_NO);
  for (const file of files) {
    outboundFormData.append("files", file);
  }

  const uploaded = await parseUploadResponse(
    await fetch(new URL("/api/v1/uploadFiles", uploadBaseUrl), {
      method: "POST",
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
  ensureApiConfigured();

  await healthBoxFetch("/health-box/admin/public-site-config", {
    method: "PUT",
    body: {
      id: optionalNumber(formData, "id") ?? 0,
      logoUrl: optionalString(formData, "logoUrl"),
      faviconUrl: optionalString(formData, "faviconUrl"),
      mainVisualUrl: optionalString(formData, "mainVisualUrl"),
      middleBannerUrl: optionalString(formData, "middleBannerUrl"),
      shareThumbnailUrl: optionalString(formData, "shareThumbnailUrl"),
      metaTitle: optionalString(formData, "metaTitle"),
      metaDescription: optionalString(formData, "metaDescription"),
      mainNavigationJson: collectStorefrontNavigationItems(formData),
      searchPlaceholder: optionalString(formData, "searchPlaceholder"),
      policyText: optionalString(formData, "policyText"),
      customerCenterText: optionalString(formData, "customerCenterText"),
    },
  });

  revalidatePath("/");
  revalidatePath("/notice");
  revalidatePath("/mypage");
  revalidatePath("/admin/storefront");
  redirectIfRequested(formData);
}

export async function saveDealerMallPublicConfigAction(formData: FormData) {
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
  redirectIfRequested(formData);
}

export async function createDealerMallAction(formData: FormData) {
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
  return submitDealerMall(formData);
}

export async function approveDealerApplicationAction(formData: FormData) {
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  await healthBoxFetch(`/health-box/admin/dealer-applications/${applicationId}/approve`, {
    method: "POST",
    body: {
      reviewMemo: optionalString(formData, "reviewMemo"),
    },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dealers");
}

export async function rejectDealerApplicationAction(formData: FormData) {
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  await healthBoxFetch(`/health-box/admin/dealer-applications/${applicationId}/reject`, {
    method: "POST",
    body: {
      rejectReason: optionalString(formData, "rejectReason") || "운영 검토 보류",
      reviewMemo: optionalString(formData, "reviewMemo"),
    },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/dealers");
}

export async function approveBuyerSignupApplicationAction(formData: FormData) {
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
    redirect(buildRedirectWithMessage(redirectTo, "memberApprovalError", approvalError));
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/members");
}

export async function rejectBuyerSignupApplicationAction(formData: FormData) {
  ensureApiConfigured();
  const applicationId = requiredString(formData, "applicationId");
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  await healthBoxFetch(`/health-box/admin/buyer-signup-applications/${applicationId}/reject`, {
    method: "POST",
    body: {
      rejectReason: optionalString(formData, "rejectReason") || "가입 정보 재확인 필요",
    },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/members");
}

export async function saveNoticeAction(formData: FormData) {
  ensureApiConfigured();

  const id = optionalNumber(formData, "id");
  const title = requiredString(formData, "title");
  const body = requiredString(formData, "body");
  if (!title || !body) {
    throw new Error("공지 제목과 내용을 입력해주세요.");
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
  redirectIfRequested(formData);
}

export async function deleteNoticeAction(formData: FormData) {
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

export async function saveProductAction(formData: FormData) {
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
    categoryId: optionalNumber(formData, "categoryId") ?? 1,
    consumerPrice: optionalNumber(formData, "consumerPrice") ?? 0,
    deliveryPolicyText: optionalString(formData, "deliveryPolicyText") || optionalString(formData, "shipping") || "",
    detailHtml: optionalString(formData, "detailHtml") || "",
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
    salesPolicyText: optionalString(formData, "salesPolicyText") || "",
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
    const redirectTo = optionalString(formData, "redirectTo") || (productId ? `/admin/products/product-${productId}` : "/admin/products");
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
  redirectIfRequested(formData);
}

export async function saveCategoryAction(formData: FormData) {
  ensureApiConfigured();

  const name = requiredString(formData, "name");
  const slug = optionalString(formData, "slug") || buildSafeSlug(name, "category");
  if (!name) {
    throw new Error("카테고리명을 입력해주세요.");
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
  redirectIfRequested(formData);
}

export async function saveCategoryOrderAction(formData: FormData) {
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
  redirectIfRequested(formData);
}

export async function deleteCategoryAction(formData: FormData) {
  ensureApiConfigured();

  const categoryId = optionalNumber(formData, "id");
  if (!categoryId) {
    throw new Error("삭제할 카테고리 ID가 없습니다.");
  }

  await healthBoxFetch(`/health-box/admin/categories/${categoryId}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  redirectIfRequested(formData);
}

export async function saveSalesPolicyTemplateAction(input: {
  content: string;
  id?: number | null;
  sortOrder?: number | null;
  status?: string | null;
  title: string;
}) {
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
  ensureApiConfigured();

  if (!policyId) {
    throw new Error("조회할 판매정책 템플릿 ID가 없습니다.");
  }

  return healthBoxFetch<HealthBoxSalesPolicy>(`/health-box/admin/sales-policies/${policyId}`);
}

export async function deleteSalesPolicyTemplateAction(policyId: number) {
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
  ensureApiConfigured();

  if (!policyId) {
    throw new Error("조회할 배송정책 템플릿 ID가 없습니다.");
  }

  return healthBoxFetch<HealthBoxSalesPolicy>(`/health-box/admin/delivery-policies/${policyId}`);
}

export async function deleteDeliveryPolicyTemplateAction(policyId: number) {
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
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  if (!orderId) {
    throw new Error("orderId is required");
  }

  await healthBoxFetch(`/health-box/admin/orders/${orderId}/cancel`, {
    method: "POST",
  });

  revalidatePath("/admin/orders");
  redirectIfRequested(formData);
}

export async function partialCancelOrderAction(formData: FormData) {
  ensureApiConfigured();

  const orderId = requiredString(formData, "orderId");
  const orderItemId = optionalNumber(formData, "orderItemId");
  const quantity = optionalNumber(formData, "quantity");
  if (!orderId || !orderItemId || !quantity) {
    throw new Error("부분취소할 주문상품과 수량을 선택해주세요.");
  }

  await healthBoxFetch(`/health-box/admin/orders/${orderId}/partial-cancel`, {
    method: "POST",
    body: {
      items: [{ orderItemId, quantity }],
    },
  });

  revalidatePath("/admin/orders");
  redirectIfRequested(formData);
}

export async function updateShipmentStatusAction(formData: FormData) {
  ensureApiConfigured();

  const shipmentId = requiredString(formData, "shipmentId");
  if (!shipmentId) {
    throw new Error("shipmentId is required");
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

  revalidatePath("/admin/orders");
  redirectIfRequested(formData);
}

export async function bulkPrepareShipmentsAction(formData: FormData) {
  ensureApiConfigured();

  const shipmentIds = formData
    .getAll("shipmentId")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!shipmentIds.length) {
    const redirectTo = optionalString(formData, "redirectTo") || "/admin/orders";
    redirect(buildRedirectWithMessage(redirectTo, "toastError", "상품 준비 처리할 주문을 선택해주세요."));
  }

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

  revalidatePath("/admin/orders");
  redirectIfRequested(formData);
}
