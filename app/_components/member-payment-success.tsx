"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { clearMemberCart, clearMemberCartOnServer, dispatchMemberCartSync } from "../_lib/member-cart";
import {
  clearMemberOrderDraft,
  readMemberOrderDraft,
} from "../_lib/member-order-draft";

type Status = "error" | "loading" | "success";

function paymentMethodName(payment: Record<string, unknown>) {
  const easyPay = payment.easyPay && typeof payment.easyPay === "object" ? payment.easyPay as Record<string, unknown> : null;
  const method = String(payment.method || "").trim();
  const easyPayProvider = String(easyPay?.provider || "").trim();

  if (easyPayProvider) {
    return easyPayProvider;
  }

  return method || "테스트 결제";
}

function paymentReceiptUrl(payment: Record<string, unknown>) {
  const receipt = payment.receipt && typeof payment.receipt === "object" ? payment.receipt as Record<string, unknown> : null;
  return String(receipt?.url || "").trim();
}

export function MemberPaymentSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("테스트 결제를 확인하고 있습니다.");
  const [orderDetailHref, setOrderDetailHref] = useState("/mypage");

  useEffect(() => {
    async function confirmPaymentAndCreateOrder() {
      const paymentKey = searchParams.get("paymentKey") || "";
      const orderId = searchParams.get("orderId") || "";
      const amount = Number(searchParams.get("amount") || 0);
      const draft = readMemberOrderDraft();

      if (!paymentKey || !orderId || !amount || !draft) {
        setStatus("error");
        setMessage("결제 확인 정보가 없습니다. 장바구니에서 다시 시도해주세요.");
        return;
      }

      if (draft.orderId !== orderId || draft.amount !== amount) {
        setStatus("error");
        setMessage("결제 금액 또는 주문 정보가 일치하지 않습니다.");
        return;
      }

      try {
        const confirmResponse = await fetch("/api/member/payments/test/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok || !confirmData.ok) {
          setStatus("error");
          setMessage(confirmData?.message || "테스트 결제 승인에 실패했습니다.");
          return;
        }

        const orderResponse = await fetch("/api/member/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            buyerAddressId: draft.buyerAddressId,
            receiverName: draft.receiverName,
            receiverPhone: draft.receiverPhone,
            zipCode: draft.zipCode,
            baseAddress: draft.baseAddress,
            detailAddress: draft.detailAddress,
            items: draft.items,
            payment: {
              provider: "TOSS_TEST",
              paymentKey: String(confirmData.payment?.paymentKey || paymentKey),
              paymentOrderId: String(confirmData.payment?.orderId || orderId),
              method: String(confirmData.payment?.method || "테스트 결제"),
              methodDetail: paymentMethodName(confirmData.payment || {}),
              paymentMethodName: paymentMethodName(confirmData.payment || {}),
              approvedAt: String(confirmData.payment?.approvedAt || ""),
              paidAmount: Number(confirmData.payment?.totalAmount || amount),
              receiptUrl: paymentReceiptUrl(confirmData.payment || {}),
              rawResponseJson: JSON.stringify(confirmData.payment || {}),
            },
          }),
        });
        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.ok) {
          setStatus("error");
          const detail = orderData?.detail ? ` ${orderData.detail}` : "";
          setMessage(`${orderData?.message || "주문 접수에 실패했습니다."}${detail}`);
          return;
        }

        clearMemberCart();
        await clearMemberCartOnServer().catch(() => undefined);
        dispatchMemberCartSync();
        clearMemberOrderDraft();
        setStatus("success");
        setOrderDetailHref(orderData.order?.id ? `/mypage/orders/${orderData.order.id}` : "/mypage");
        setMessage(`테스트 결제와 주문 접수가 완료되었습니다. 주문번호 ${orderData.order?.orderNo || ""}`.trim());
      } catch {
        setStatus("error");
        setMessage("테스트 결제 확인 중 오류가 발생했습니다.");
      }
    }

    void confirmPaymentAndCreateOrder();
  }, [searchParams]);

  return (
    <div className="member-auth-card content-panel payment-result-panel">
      <h1 className="section-panel-title">
        {status === "loading" ? "결제 확인 중" : status === "success" ? "주문 완료" : "결제 확인 실패"}
      </h1>
      <div className={`member-auth-alert ${status === "success" ? "is-success" : status === "loading" ? "is-muted" : "is-error"}`}>
        {message}
      </div>
      <div className="member-auth-actions">
        <Link className="button-primary" href={orderDetailHref}>
          {status === "success" ? "주문 상세" : "마이페이지"}
        </Link>
        <Link className="button-secondary" href="/cart">
          장바구니
        </Link>
      </div>
    </div>
  );
}
