"use client";

import { useState } from "react";

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
  const [message, setMessage] = useState("");

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
      setMessage("장바구니에 담았습니다.");
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
