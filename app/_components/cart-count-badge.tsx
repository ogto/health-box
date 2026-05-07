"use client";

import { useEffect, useState } from "react";

import { fetchMemberCart } from "../_lib/member-cart";

export function CartCountBadge({ loggedIn }: { loggedIn: boolean }) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (!loggedIn) {
      setQuantity(0);
      return;
    }

    async function syncQuantity() {
      try {
        const items = await fetchMemberCart();
        setQuantity(items.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        setQuantity(0);
      }
    }

    void syncQuantity();
    const handleSync = () => void syncQuantity();
    window.addEventListener("focus", handleSync);
    window.addEventListener("health-box-cart-sync", handleSync);

    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("health-box-cart-sync", handleSync);
    };
  }, [loggedIn]);

  if (!loggedIn || !quantity) {
    return null;
  }

  return <span className="cart-count-badge">{quantity > 99 ? "99+" : quantity}</span>;
}
