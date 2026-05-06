"use client";

import { useEffect, useState } from "react";

import { MEMBER_CART_STORAGE_KEY, readMemberCart } from "../_lib/member-cart";

function cartQuantity() {
  return readMemberCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function CartCountBadge() {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    function syncQuantity() {
      setQuantity(cartQuantity());
    }

    syncQuantity();
    window.addEventListener("storage", syncQuantity);
    window.addEventListener("focus", syncQuantity);

    const originalSetItem = window.localStorage.setItem;
    const originalRemoveItem = window.localStorage.removeItem;

    window.localStorage.setItem = function setItem(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === MEMBER_CART_STORAGE_KEY) {
        syncQuantity();
      }
    };

    window.localStorage.removeItem = function removeItem(key) {
      originalRemoveItem.apply(this, [key]);
      if (key === MEMBER_CART_STORAGE_KEY) {
        syncQuantity();
      }
    };

    return () => {
      window.removeEventListener("storage", syncQuantity);
      window.removeEventListener("focus", syncQuantity);
      window.localStorage.setItem = originalSetItem;
      window.localStorage.removeItem = originalRemoveItem;
    };
  }, []);

  if (!quantity) {
    return null;
  }

  return <span className="cart-count-badge">{quantity > 99 ? "99+" : quantity}</span>;
}
