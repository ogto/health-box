export const MEMBER_CART_STORAGE_KEY = "health-box-member-cart";

export type MemberCartItem = {
  image?: string;
  optionLabel: string;
  productSlug: string;
  productTitle: string;
  quantity: number;
  skuId: number;
  unitPrice: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeOptionLabel(value: string) {
  const label = value.trim();
  return !label || label === "기본 상품" || label === "상품" ? "없음" : label;
}

function normalizeCartItems(items: MemberCartItem[]) {
  const merged = new Map<number, MemberCartItem>();

  for (const item of items) {
    if (!item.skuId || item.quantity <= 0) {
      continue;
    }

    const existing = merged.get(item.skuId);
    if (existing) {
      merged.set(item.skuId, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        unitPrice: item.unitPrice || existing.unitPrice,
      });
      continue;
    }

    merged.set(item.skuId, {
      ...item,
      optionLabel: normalizeOptionLabel(item.optionLabel || ""),
      quantity: Math.max(1, item.quantity),
      unitPrice: Math.max(0, item.unitPrice),
    });
  }

  return Array.from(merged.values());
}

export function readMemberCart() {
  if (!isBrowser()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(MEMBER_CART_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? normalizeCartItems(parsed as MemberCartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeMemberCart(items: MemberCartItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(MEMBER_CART_STORAGE_KEY, JSON.stringify(normalizeCartItems(items)));
}

export function addMemberCartItems(items: MemberCartItem[]) {
  const nextItems = normalizeCartItems([...readMemberCart(), ...items]);
  writeMemberCart(nextItems);
  return nextItems;
}

export function clearMemberCart() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(MEMBER_CART_STORAGE_KEY);
}
