import {
  dateTimeValue,
  healthBoxFetch,
  hasHealthBoxApi,
  idValue,
  stringValue,
  type HealthBoxPageResponse,
  type HealthBoxRecord,
} from "./health-box-api";
import type { MemberSession } from "./member-auth";

export type ProductInquiry = {
  answer: string;
  answeredAt: string;
  authorName: string;
  createdAt: string;
  id: number;
  isPrivate: boolean;
  question: string;
  status: string;
};

function recordsFromPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as HealthBoxRecord[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as HealthBoxPageResponse<HealthBoxRecord>).content)) {
    return (payload as HealthBoxPageResponse<HealthBoxRecord>).content;
  }

  return [];
}

export function mapProductInquiries(payload: unknown): ProductInquiry[] {
  return recordsFromPayload(payload)
    .map((record, index) => ({
      id: idValue(record, "id", "inquiryId", "productInquiryId") || index + 1,
      question: stringValue(record, "question", "content", "questionText", "inquiryText"),
      answer: stringValue(record, "answer", "answerText", "reply", "replyText"),
      authorName: stringValue(record, "authorName", "memberName", "buyerName", "name") || "회원",
      createdAt: dateTimeValue(record, "createdAt", "questionedAt", "registeredAt"),
      answeredAt: dateTimeValue(record, "answeredAt", "repliedAt", "updatedAt"),
      isPrivate:
        record.privateYn === "Y" ||
        record.secretYn === "Y" ||
        record.isPrivate === true ||
        record.secret === true,
      status: stringValue(record, "status", "answerStatus") || (stringValue(record, "answer", "answerText") ? "ANSWERED" : "PENDING"),
    }))
    .filter((inquiry) => inquiry.question);
}

function missingEndpoint(error: unknown) {
  return /HealthBox API (404|405):/i.test(error instanceof Error ? error.message : String(error));
}

async function fetchWithEndpointFallback(
  primaryPath: string,
  fallbackPath: string,
  productId: number,
  query?: Record<string, string | number | null | undefined>,
) {
  try {
    return await healthBoxFetch<unknown>(primaryPath, { query, revalidate: 0 });
  } catch (error) {
    if (!missingEndpoint(error)) {
      throw error;
    }

    return healthBoxFetch<unknown>(fallbackPath, {
      query: { ...query, productId },
      revalidate: 0,
    });
  }
}

export async function fetchPublicProductInquiries(
  productId: number,
  session?: MemberSession | null,
) {
  if (!hasHealthBoxApi() || !Number.isSafeInteger(productId) || productId <= 0) {
    return [];
  }

  try {
    const payload = await fetchWithEndpointFallback(
      `/health-box/public/products/${productId}/inquiries`,
      "/health-box/public/product-inquiries",
      productId,
      session?.memberId && session.dealerMallId != null && session.sessionToken
        ? {
            buyerMemberId: session.memberId,
            dealerMallId: session.dealerMallId,
            sessionToken: session.sessionToken,
          }
        : undefined,
    );
    return mapProductInquiries(payload);
  } catch (error) {
    console.error("[product-inquiries] public list failed", error);
    return [];
  }
}

export async function fetchAdminProductInquiries(productId: number) {
  if (!hasHealthBoxApi() || !Number.isSafeInteger(productId) || productId <= 0) {
    return [];
  }

  try {
    const payload = await fetchWithEndpointFallback(
      `/health-box/admin/products/${productId}/inquiries`,
      "/health-box/admin/product-inquiries",
      productId,
    );
    return mapProductInquiries(payload);
  } catch (error) {
    console.error("[product-inquiries] admin list failed", error);
    return [];
  }
}
