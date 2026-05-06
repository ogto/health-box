import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "../../../../_lib/health-box-api";
import { getMemberSession } from "../../../../_lib/member-auth";

function extractErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}

function toFriendlyMessage(message: string) {
  let parsedMessage = message;
  try {
    const parsed = JSON.parse(message) as { message?: string };
    parsedMessage = parsed.message || message;
  } catch {
    parsedMessage = message;
  }

  if (/stock|sold out|orderable|sku not found/i.test(parsedMessage)) {
    return "주문 가능한 상품 정보를 확인할 수 없습니다. 장바구니를 다시 확인해주세요.";
  }

  if (/buyer member|session token|invalid buyer session/i.test(parsedMessage)) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
  }

  if (/Method Not Allowed|Request method 'POST' not supported|orders\/quote/i.test(parsedMessage)) {
    return "주문 금액 산출 API가 아직 서버에 반영되지 않았습니다. 서버 반영 후 다시 주문해주세요.";
  }

  return parsedMessage || "주문 금액 확인 중 오류가 발생했습니다.";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json(
        {
          ok: false,
          message: session
            ? "로그인 정보가 오래되었습니다. 다시 로그인해주세요."
            : "로그인이 필요합니다.",
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body.items) ? body.items : [];
    const orderItems = items
      .map((item: Record<string, unknown>) => ({
        skuId: Number(item?.skuId || 0),
        quantity: Number(item?.quantity || 0),
      }))
      .filter((item: { quantity: number; skuId: number }) => item.skuId > 0 && item.quantity > 0);

    if (!orderItems.length) {
      return NextResponse.json(
        { ok: false, message: "주문할 상품을 담아주세요." },
        { status: 400 },
      );
    }

    const quote = await healthBoxFetch<{ totalPaymentAmount?: number }>("/health-box/public/orders/quote", {
      method: "POST",
      body: {
        buyerMemberId: session.memberId,
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
        items: orderItems,
      },
    });

    const totalPaymentAmount = Number(
      quote.totalPaymentAmount ??
        (quote as { totalAmount?: number }).totalAmount ??
        (quote as { amount?: number }).amount ??
        0,
    );

    if (totalPaymentAmount <= 0) {
      return NextResponse.json({
        ok: false,
        message: "백엔드에서 산출한 주문 금액이 0원입니다. 상품 SKU 가격을 확인해주세요.",
        detail: JSON.stringify(quote),
      });
    }

    return NextResponse.json({
      ok: true,
      totalPaymentAmount,
    });
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("[member-orders] quote failed", error);
    const isQuoteEndpointMissing = /Method Not Allowed|Request method 'POST' not supported|orders\/quote/i.test(message);
    return NextResponse.json(
      {
        ok: false,
        message: toFriendlyMessage(message),
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: isQuoteEndpointMissing ? 200 : 500 },
    );
  }
}
