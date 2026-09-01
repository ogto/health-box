import type { MemberCartItem } from "./member-cart";

export const MEMBER_CHECKOUT_DRAFT_STORAGE_KEY = "health-box-member-checkout-draft";

const CHECKOUT_DRAFT_MAX_AGE_MS = 30 * 60 * 1000;

export type MemberCheckoutDraft = {
  createdAt: number;
  items: MemberCartItem[];
  source: "buy-now" | "cart";
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isValidItem(item: MemberCartItem) {
  return (
    Number.isSafeInteger(item.skuId) &&
    item.skuId > 0 &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0 &&
    item.quantity <= 99
  );
}

export function readMemberCheckoutDraft() {
  if (!isBrowser()) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(MEMBER_CHECKOUT_DRAFT_STORAGE_KEY) || "null",
    ) as MemberCheckoutDraft | null;
    const age = Date.now() - Number(parsed?.createdAt || 0);

    if (
      !parsed ||
      (parsed.source !== "buy-now" && parsed.source !== "cart") ||
      !Array.isArray(parsed.items) ||
      !parsed.items.length ||
      !parsed.items.every(isValidItem) ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > CHECKOUT_DRAFT_MAX_AGE_MS
    ) {
      clearMemberCheckoutDraft();
      return null;
    }

    return parsed;
  } catch {
    clearMemberCheckoutDraft();
    return null;
  }
}

export function writeMemberCheckoutDraft(
  source: MemberCheckoutDraft["source"],
  items: MemberCartItem[],
) {
  if (!isBrowser()) {
    return;
  }

  const validItems = items.filter(isValidItem);
  if (!validItems.length) {
    throw new Error("주문할 상품을 선택해주세요.");
  }

  window.sessionStorage.setItem(
    MEMBER_CHECKOUT_DRAFT_STORAGE_KEY,
    JSON.stringify({ createdAt: Date.now(), items: validItems, source } satisfies MemberCheckoutDraft),
  );
}

export function clearMemberCheckoutDraft() {
  if (isBrowser()) {
    window.sessionStorage.removeItem(MEMBER_CHECKOUT_DRAFT_STORAGE_KEY);
  }
}
