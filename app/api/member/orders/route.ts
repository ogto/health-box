import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "../../../_lib/health-box-api";
import { getMemberSession } from "../../../_lib/member-auth";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

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

  if (/address|receiver|baseAddress/i.test(parsedMessage)) {
    return "배송지 정보를 입력해주세요.";
  }

  return parsedMessage || "주문 생성 중 오류가 발생했습니다.";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || !session.dealerMallId || !session.sessionToken) {
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
    const receiverName = String(body.receiverName || "").trim();
    const receiverPhone = normalizePhone(body.receiverPhone);
    const zipCode = String(body.zipCode || "").trim();
    const baseAddress = String(body.baseAddress || "").trim();
    const detailAddress = String(body.detailAddress || "").trim();
    const buyerAddressId = Number(body.buyerAddressId || 0);
    const items = Array.isArray(body.items) ? body.items : [];
    const payment = body.payment && typeof body.payment === "object" ? body.payment as Record<string, unknown> : null;

    if (!buyerAddressId && (!receiverName || !receiverPhone || !baseAddress)) {
      return NextResponse.json(
        { ok: false, message: "받는 분, 연락처, 주소를 입력해주세요." },
        { status: 400 },
      );
    }

    const orderItems = items
      .map((item: Record<string, unknown>) => {
        const optionSummarySnapshot = String(item?.optionLabel || item?.optionSummarySnapshot || "").trim();
        return {
          skuId: Number(item?.skuId || 0),
          quantity: Number(item?.quantity || 0),
          ...(optionSummarySnapshot ? { optionSummarySnapshot } : {}),
        };
      })
      .filter((item: { quantity: number; skuId: number }) => item.skuId > 0 && item.quantity > 0);

    if (!orderItems.length) {
      return NextResponse.json(
        { ok: false, message: "주문할 상품을 담아주세요." },
        { status: 400 },
      );
    }

    const order = await healthBoxFetch("/health-box/public/orders", {
      method: "POST",
      body: {
        buyerMemberId: session.memberId,
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
        ordererName: session.name || receiverName,
        ordererPhone: normalizePhone(session.phone) || receiverPhone,
        buyerAddressId: buyerAddressId || null,
        receiverName,
        receiverPhone,
        zipCode,
        baseAddress,
        detailAddress,
        paymentStatus: "PAID",
        orderStatus: "ORDERED",
        payment: payment
          ? {
              provider: String(payment.provider || "").trim(),
              paymentKey: String(payment.paymentKey || "").trim(),
              paymentOrderId: String(payment.paymentOrderId || "").trim(),
              method: String(payment.method || "").trim(),
              methodDetail: String(payment.methodDetail || "").trim(),
              paymentMethodName: String(payment.paymentMethodName || "").trim(),
              approvedAt: String(payment.approvedAt || "").trim(),
              paidAmount: Number(payment.paidAmount || 0),
              receiptUrl: String(payment.receiptUrl || "").trim(),
              rawResponseJson: String(payment.rawResponseJson || "").trim(),
            }
          : null,
        items: orderItems,
      },
    });

    return NextResponse.json({ ok: true, message: "주문이 접수되었습니다.", order });
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("[member-orders] create order failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: toFriendlyMessage(message),
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
