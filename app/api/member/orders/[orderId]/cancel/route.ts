import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "@/app/_lib/health-box-api";
import { getMemberSession } from "@/app/_lib/member-auth";

function friendlyCancellationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/order not found/i.test(message)) {
    return "주문 정보를 찾을 수 없습니다.";
  }
  if (/session|buyer member/i.test(message)) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
  }
  if (/Toss payment cancellation failed|Toss cancellation/i.test(message)) {
    return "결제 취소 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
  return message.replace(/^HealthBox API \d+:\s*/, "") || "취소 요청을 처리하지 못했습니다.";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { orderId: rawOrderId } = await params;
    const orderId = Number(rawOrderId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ ok: false, message: "주문 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const result = await healthBoxFetch<Record<string, unknown>>(
      `/health-box/public/orders/${orderId}/cancel-request`,
      {
        method: "POST",
        body: {
          buyerMemberId: session.memberId,
          dealerMallId: session.dealerMallId,
          sessionToken: session.sessionToken,
          reason: String(body.reason || "회원 주문 취소").trim().slice(0, 500),
        },
      },
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[member-orders] cancellation failed", error);
    return NextResponse.json(
      { ok: false, message: friendlyCancellationError(error) },
      { status: 500 },
    );
  }
}
