"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export function MemberOrderCancelButton({
  claimStatus,
  immediate,
  orderId,
}: {
  claimStatus?: string;
  immediate: boolean;
  orderId: number;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const requested = String(claimStatus || "").toUpperCase() === "REQUESTED";

  async function submitCancellation() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/member/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ reason: "회원 주문 취소" }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        action?: string;
        message?: string;
        ok?: boolean;
      };

      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "취소 요청을 처리하지 못했습니다.");
      }

      setOpen(false);
      setMessage(data.message || (data.action === "CANCELED" ? "주문이 취소되었습니다." : "취소 요청이 접수되었습니다."));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "취소 요청을 처리하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (requested) {
    return <button className="member-order-cancel-button" disabled type="button">취소 요청 접수</button>;
  }

  return (
    <>
      <button
        className="member-order-cancel-button"
        disabled={loading}
        onClick={() => setOpen(true)}
        type="button"
      >
        {loading ? "처리 중..." : immediate ? "주문 취소" : "취소 요청"}
      </button>
      {message ? <span className="member-order-cancel-message" role="status">{message}</span> : null}
      {open ? (
        <div className="shop-login-modal-backdrop" role="presentation">
          <div aria-labelledby={titleId} aria-modal="true" className="shop-login-modal" role="dialog">
            <strong id={titleId}>{immediate ? "주문을 바로 취소할까요?" : "취소 요청을 접수할까요?"}</strong>
            <p>
              {immediate
                ? "주문 접수 상태이므로 결제 승인 취소와 재고 복구가 즉시 처리됩니다."
                : "상품 준비가 시작된 주문입니다. 판매자 확인이 필요한 취소 요청으로 접수됩니다."}
            </p>
            {message ? <div className="member-auth-alert is-error" role="alert">{message}</div> : null}
            <div className="shop-login-modal-actions">
              <button className="button-secondary" disabled={loading} onClick={() => setOpen(false)} type="button">
                돌아가기
              </button>
              <button className="button-primary" disabled={loading} onClick={() => void submitCancellation()} type="button">
                {loading ? "처리 중..." : immediate ? "즉시 취소" : "요청 접수"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
