import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "@/app/_lib/health-box-api";
import { getMemberSession } from "@/app/_lib/member-auth";
import {
  fetchMemberOrderQuote,
  memberOrderItemsFingerprint,
  normalizeMemberOrderItems,
} from "@/app/_lib/member-orders";
import { verifyCheckoutIntent } from "@/app/_lib/payment-intent";
import {
  cancelTossPayment,
  confirmOrRetrieveTossPayment,
  TossPaymentsError,
  tossPaymentMethodName,
  tossPaymentProvider,
  tossPaymentReceiptUrl,
} from "@/app/_lib/toss-payments";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function paymentMatches(payment: Record<string, unknown>, paymentKey: string, orderId: string, amount: number) {
  return (
    String(payment.paymentKey || "").trim() === paymentKey &&
    String(payment.orderId || "").trim() === orderId &&
    Number(payment.totalAmount || 0) === amount
  );
}

async function createOrder(body: Record<string, unknown>, payment: Record<string, unknown>) {
  const session = await getMemberSession();
  if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
    throw new Error("로그인 정보가 만료되었습니다.");
  }

  const items = normalizeMemberOrderItems(body.items);
  const quote = await fetchMemberOrderQuote(session, items, body.zipCode as string);
  const methodName = tossPaymentMethodName(payment);

  return healthBoxFetch<Record<string, unknown>>("/health-box/public/orders", {
    method: "POST",
    body: {
      buyerMemberId: session.memberId,
      dealerMallId: session.dealerMallId,
      sessionToken: session.sessionToken,
      ordererName: session.name || String(body.receiverName || "").trim(),
      ordererPhone: normalizePhone(session.phone) || normalizePhone(body.receiverPhone),
      buyerAddressId: Number(body.buyerAddressId || 0) || null,
      receiverName: String(body.receiverName || "").trim(),
      receiverPhone: normalizePhone(body.receiverPhone),
      zipCode: String(body.zipCode || "").trim(),
      baseAddress: String(body.baseAddress || "").trim(),
      detailAddress: String(body.detailAddress || "").trim(),
      paymentStatus: "PAID",
      orderStatus: "ORDERED",
      productAmount: quote.productAmount,
      shippingFee: quote.shippingFee,
      discountAmount: quote.discountAmount,
      totalPaymentAmount: quote.totalPaymentAmount,
      payment: {
        provider: tossPaymentProvider(),
        paymentKey: String(payment.paymentKey || "").trim(),
        paymentOrderId: String(payment.orderId || "").trim(),
        method: String(payment.method || "토스페이먼츠").trim(),
        methodDetail: methodName,
        paymentMethodName: methodName,
        approvedAt: String(payment.approvedAt || "").trim(),
        paidAmount: Number(payment.totalAmount || 0),
        receiptUrl: tossPaymentReceiptUrl(payment),
        rawResponseJson: JSON.stringify(payment).slice(0, 20_000),
      },
      items,
    },
  });
}

async function createOrderWithRetry(body: Record<string, unknown>, payment: Record<string, unknown>) {
  try {
    return await createOrder(body, payment);
  } catch (firstError) {
    try {
      return await createOrder(body, payment);
    } catch {
      throw firstError;
    }
  }
}

export async function POST(request: NextRequest) {
  let confirmedPayment: Record<string, unknown> | null = null;
  let paymentKey = "";
  let orderId = "";

  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    paymentKey = String(body.paymentKey || "").trim();
    orderId = String(body.orderId || "").trim();
    const amount = Number(body.amount || 0);
    const checkoutIntent = verifyCheckoutIntent(String(body.checkoutIntent || "").trim());
    const orderItems = normalizeMemberOrderItems(body.items);
    const receiverName = String(body.receiverName || "").trim();
    const receiverPhone = normalizePhone(body.receiverPhone);
    const baseAddress = String(body.baseAddress || "").trim();
    const buyerAddressId = Number(body.buyerAddressId || 0);

    if (
      !paymentKey ||
      !/^healthbox_[A-Za-z0-9_-]{6,54}$/.test(orderId) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      !orderItems.length
    ) {
      return NextResponse.json({ ok: false, message: "결제 승인 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (!buyerAddressId && (!receiverName || !receiverPhone || !baseAddress)) {
      return NextResponse.json({ ok: false, message: "배송지 정보를 입력해주세요." }, { status: 400 });
    }

    if (
      !checkoutIntent ||
      checkoutIntent.memberId !== session.memberId ||
      checkoutIntent.dealerMallId !== session.dealerMallId ||
      checkoutIntent.orderId !== orderId ||
      checkoutIntent.amount !== amount ||
      checkoutIntent.itemsFingerprint !== memberOrderItemsFingerprint(orderItems)
    ) {
      return NextResponse.json(
        { ok: false, message: "결제 요청이 만료되었거나 현재 주문과 일치하지 않습니다." },
        { status: 409 },
      );
    }

    const quote = await fetchMemberOrderQuote(session, orderItems, body.zipCode as string);
    if (
      quote.totalPaymentAmount !== checkoutIntent.amount ||
      quote.productAmount !== checkoutIntent.productAmount ||
      quote.shippingFee !== checkoutIntent.shippingFee ||
      quote.discountAmount !== checkoutIntent.discountAmount
    ) {
      return NextResponse.json(
        { ok: false, message: "상품 가격 또는 배송비가 변경되었습니다. 장바구니에서 다시 결제해주세요." },
        { status: 409 },
      );
    }

    confirmedPayment = await confirmOrRetrieveTossPayment(paymentKey, orderId, amount);
    const paymentStatus = String(confirmedPayment.status || "").toUpperCase();
    if (!paymentMatches(confirmedPayment, paymentKey, orderId, amount) || paymentStatus !== "DONE") {
      if (paymentMatches(confirmedPayment, paymentKey, orderId, amount)) {
        await cancelTossPayment({
          paymentKey,
          cancelReason: "즉시 결제 완료가 지원되지 않는 결제수단",
          requestId: `unsupported-status:${orderId}`,
        }).catch((cancelError) => console.error("[toss-payments] unsupported payment cancellation failed", cancelError));
      }
      return NextResponse.json(
        { ok: false, message: "결제 완료 상태를 확인할 수 없습니다. 다른 결제수단으로 다시 시도해주세요." },
        { status: 409 },
      );
    }

    try {
      const order = await createOrderWithRetry(body, confirmedPayment);
      return NextResponse.json({ ok: true, message: "결제와 주문 접수가 완료되었습니다.", order });
    } catch (orderError) {
      console.error("[member-payments] order persistence failed after payment confirmation", orderError);
      try {
        await cancelTossPayment({
          paymentKey,
          cancelReason: "주문 접수 실패에 따른 자동 취소",
          requestId: `order-create-failed:${orderId}`,
        });
        return NextResponse.json(
          { ok: false, message: "주문 접수에 실패해 승인된 결제를 자동으로 전액 취소했습니다." },
          { status: 502 },
        );
      } catch (cancelError) {
        console.error("[member-payments] automatic cancellation failed", {
          cancelError,
          orderId,
          paymentKey,
        });
        return NextResponse.json(
          {
            ok: false,
            message: "결제는 승인됐지만 주문 접수를 완료하지 못했습니다. 고객센터에 주문번호를 알려주세요.",
            orderId,
            recoveryRequired: true,
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[member-payments] payment confirmation failed", {
      code: error instanceof TossPaymentsError ? error.code : undefined,
      message,
      orderId,
      paymentKey,
    });
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof TossPaymentsError ? message : "결제 승인 중 오류가 발생했습니다.",
        code: error instanceof TossPaymentsError ? error.code : undefined,
      },
      { status: error instanceof TossPaymentsError ? Math.max(400, error.status) : 500 },
    );
  }
}
