import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "../../../../../_lib/health-box-api";
import { getMemberSession } from "../../../../../_lib/member-auth";

function isMissingEndpoint(error: unknown) {
  return /HealthBox API (404|405):/i.test(error instanceof Error ? error.message : String(error));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인 후 문의를 등록할 수 있습니다." }, { status: 401 });
    }

    const productId = Number((await params).productId);
    const body = await request.json().catch(() => ({}));
    const question = String(body.question || "").trim();
    const privateYn = body.privateYn === "Y" || body.isPrivate === true ? "Y" : "N";

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json({ ok: false, message: "상품 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (question.length < 5 || question.length > 1_000) {
      return NextResponse.json({ ok: false, message: "문의 내용은 5자 이상 1,000자 이하로 입력해주세요." }, { status: 400 });
    }

    const inquiryBody = {
      buyerMemberId: session.memberId,
      dealerMallId: session.dealerMallId,
      sessionToken: session.sessionToken,
      productId,
      question,
      privateYn,
    };

    let inquiry: unknown;
    try {
      inquiry = await healthBoxFetch(`/health-box/public/products/${productId}/inquiries`, {
        method: "POST",
        body: inquiryBody,
      });
    } catch (error) {
      if (!isMissingEndpoint(error)) {
        throw error;
      }
      inquiry = await healthBoxFetch("/health-box/public/product-inquiries", {
        method: "POST",
        body: inquiryBody,
      });
    }

    revalidatePath(`/product/product-${productId}`);
    return NextResponse.json({ ok: true, inquiry, message: "상품 문의를 등록했습니다." });
  } catch (error) {
    console.error("[product-inquiries] create failed", error);
    const endpointMissing = isMissingEndpoint(error);
    return NextResponse.json(
      {
        ok: false,
        message: endpointMissing
          ? "상품 문의 저장 API가 아직 연결되지 않았습니다. 관리자에게 문의해주세요."
          : "상품 문의를 등록하지 못했습니다.",
      },
      { status: endpointMissing ? 503 : 500 },
    );
  }
}
