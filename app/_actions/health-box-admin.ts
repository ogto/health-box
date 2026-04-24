"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasHealthBoxApi, healthBoxFetch } from "../_lib/health-box-api";

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

function buildNoticeSummary(body: string | undefined) {
  if (!body) {
    return undefined;
  }

  const singleLine = body
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
  return body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
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

function redirectIfRequested(formData: FormData) {
  const redirectTo = optionalString(formData, "redirectTo");
  if (redirectTo) {
    redirect(redirectTo);
  }
}

function buildRedirectWithMessage(path: string, key: string, value: string) {
  const params = new URLSearchParams();
  params.set(key, value);
  return `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;
}

function ensureApiConfigured() {
  if (!hasHealthBoxApi()) {
    throw new Error("HEALTH_BOX_API_BASE_URL is not configured");
  }
}

export async function saveStorefrontConfigAction(formData: FormData) {
  ensureApiConfigured();

  await healthBoxFetch("/health-box/admin/public-site-config", {
    method: "PUT",
    body: {
      logoUrl: optionalString(formData, "logoUrl"),
      faviconUrl: optionalString(formData, "faviconUrl"),
      mainVisualUrl: optionalString(formData, "mainVisualUrl"),
      middleBannerUrl: optionalString(formData, "middleBannerUrl"),
      shareThumbnailUrl: optionalString(formData, "shareThumbnailUrl"),
      metaTitle: optionalString(formData, "metaTitle"),
      metaDescription: optionalString(formData, "metaDescription"),
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

  await healthBoxFetch(`/health-box/admin/dealer-malls/${dealerMallId}/public-config`, {
    method: "PUT",
    body: {
      mallName: optionalString(formData, "mallName"),
      displayName: optionalString(formData, "displayName"),
      supportEmail: optionalString(formData, "supportEmail"),
      supportPhone: optionalString(formData, "supportPhone"),
      activeYn: optionalString(formData, "activeYn"),
    },
  });

  revalidatePath("/admin/dealers");
  redirectIfRequested(formData);
}

export async function createDealerMallAction(formData: FormData) {
  ensureApiConfigured();

  const redirectTo = optionalString(formData, "redirectTo") || "/admin/dealers";
  const mallName = requiredString(formData, "mallName");
  const slug = requiredString(formData, "slug");
  const applicantName = requiredString(formData, "applicantName");
  const email = requiredString(formData, "email");
  const phone = requiredString(formData, "phone");

  if (!mallName || !slug || !applicantName || !email || !phone) {
    redirect(buildRedirectWithMessage(redirectTo, "createError", "필수 항목을 모두 입력해주세요."));
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
    redirect(buildRedirectWithMessage(redirectTo, "createStatus", "success"));
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const cleanedMessage = rawMessage
      .replace(/^HealthBox API \d+:\s*/, "")
      .replace(/^Error:\s*/, "")
      .trim();

    if (/404|Not Found/i.test(rawMessage)) {
      redirect(buildRedirectWithMessage(redirectTo, "createError", "백엔드 수동 딜러 등록 API를 찾지 못했습니다."));
    }

    if (/405|Method Not Allowed/i.test(rawMessage)) {
      redirect(buildRedirectWithMessage(redirectTo, "createError", "백엔드가 수동 딜러 등록을 아직 지원하지 않습니다."));
    }

    redirect(
      buildRedirectWithMessage(
        redirectTo,
        "createError",
        cleanedMessage || "딜러 추가 중 오류가 발생했습니다.",
      ),
    );
  }
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
  if (!applicationId) {
    throw new Error("applicationId is required");
  }

  await healthBoxFetch(`/health-box/admin/buyer-signup-applications/${applicationId}/approve`, {
    method: "POST",
    body: {
      reviewMemo: optionalString(formData, "reviewMemo"),
    },
  });

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

export async function saveProductAction(formData: FormData) {
  ensureApiConfigured();

  await healthBoxFetch("/health-box/admin/products", {
    method: "PUT",
    body: {
      id: optionalNumber(formData, "id"),
      brandName: optionalString(formData, "brandName"),
      categoryId: optionalNumber(formData, "categoryId"),
      name: optionalString(formData, "name"),
      subtitle: optionalString(formData, "subtitle"),
      slug: optionalString(formData, "slug"),
      summary: optionalString(formData, "summary"),
      status: optionalString(formData, "status"),
      publishStatus: optionalString(formData, "publishStatus"),
      badge: optionalString(formData, "badge"),
      image: optionalString(formData, "image"),
      shipping: optionalString(formData, "shipping"),
      note: optionalString(formData, "note"),
    },
  });

  revalidatePath("/admin/products");
  redirectIfRequested(formData);
}

export async function updateShipmentStatusAction(formData: FormData) {
  ensureApiConfigured();

  const shipmentId = requiredString(formData, "shipmentId");
  if (!shipmentId) {
    throw new Error("shipmentId is required");
  }

  await healthBoxFetch(`/health-box/admin/shipments/${shipmentId}/status`, {
    method: "PUT",
    body: {
      shipmentStatus: optionalString(formData, "shipmentStatus"),
      courierCompany: optionalString(formData, "courierCompany"),
      trackingNo: optionalString(formData, "trackingNo"),
      shippedAt: optionalString(formData, "shippedAt"),
      deliveredAt: optionalString(formData, "deliveredAt"),
      handlerAccountId: optionalNumber(formData, "handlerAccountId"),
    },
  });

  revalidatePath("/admin/orders");
  redirectIfRequested(formData);
}
