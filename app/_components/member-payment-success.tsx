"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { dispatchMemberCartSync } from "../_lib/member-cart";
import { clearMemberCheckoutDraft } from "../_lib/member-checkout-draft";
import {
  clearMemberOrderDraft,
  readMemberOrderDraft,
} from "../_lib/member-order-draft";

type Status = "error" | "loading" | "success";

export function MemberPaymentSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("결제를 확인하고 주문을 접수하고 있습니다.");
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
        const orderResponse = await fetch("/api/member/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            amount,
            buyerAddressId: draft.buyerAddressId,
            checkoutIntent: draft.checkoutIntent,
            receiverName: draft.receiverName,
            receiverPhone: draft.receiverPhone,
            zipCode: draft.zipCode,
            baseAddress: draft.baseAddress,
            detailAddress: draft.detailAddress,
            items: draft.items,
            orderId,
            paymentKey,
          }),
        });
        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.ok) {
          setStatus("error");
          const detail = orderData?.detail ? ` ${orderData.detail}` : "";
          setMessage(`${orderData?.message || "주문 접수에 실패했습니다."}${detail}`);
          return;
        }

        dispatchMemberCartSync();
        clearMemberCheckoutDraft();
        clearMemberOrderDraft();
        setStatus("success");
        setOrderDetailHref(orderData.order?.id ? `/mypage/orders/${orderData.order.id}` : "/mypage");
        setMessage(`결제와 주문 접수가 완료되었습니다. 주문번호 ${orderData.order?.orderNo || ""}`.trim());
      } catch {
        setStatus("error");
        setMessage("결제 확인 중 오류가 발생했습니다.");
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
