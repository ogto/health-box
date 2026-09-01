"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { addMemberCartItemsToServer, dispatchMemberCartSync } from "../_lib/member-cart";

export function MemberReorderButton({
  image,
  optionLabel,
  productSlug,
  productTitle,
  quantity,
  skuId,
  unitPrice,
}: {
  image?: string;
  optionLabel: string;
  productSlug?: string;
  productTitle: string;
  quantity: number;
  skuId: number;
  unitPrice: number;
}) {
  const router = useRouter();
  const titleId = useId();
  const [message, setMessage] = useState("");
  const [showCartAddedModal, setShowCartAddedModal] = useState(false);

  async function addToCart() {
    if (!skuId || unitPrice <= 0) {
      setMessage("담을 수 없는 상품입니다.");
      return;
    }

    try {
      await addMemberCartItemsToServer([
        {
          image,
          optionLabel,
          productSlug: productSlug || "",
          productTitle,
          quantity: Math.max(1, quantity || 1),
          skuId,
          unitPrice,
        },
      ]);
      dispatchMemberCartSync();
      setShowCartAddedModal(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "장바구니에 담지 못했습니다.");
    }
  }

  return (
    <div className="account-order-reorder">
      <button onClick={() => void addToCart()} type="button">
        장바구니 담기
      </button>
      {message ? <span>{message}</span> : null}
      {showCartAddedModal ? (
        <div className="shop-login-modal-backdrop" role="presentation">
          <div aria-labelledby={titleId} aria-modal="true" className="shop-login-modal" role="dialog">
            <strong id={titleId}>장바구니에 담았습니다</strong>
            <p>장바구니로 이동해서 담은 상품을 확인하시겠어요?</p>
            <div className="shop-login-modal-actions">
              <button className="button-secondary" onClick={() => setShowCartAddedModal(false)} type="button">
                계속 보기
              </button>
              <button className="button-primary" onClick={() => router.push("/cart")} type="button">
                장바구니 보기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MemberOrderComingSoonButton({ children }: { children: string }) {
  return (
    <button onClick={() => window.alert("준비중입니다.")} type="button">
      {children}
    </button>
  );
}
