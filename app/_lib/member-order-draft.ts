import type { MemberCartItem } from "./member-cart";

export const MEMBER_ORDER_DRAFT_STORAGE_KEY = "health-box-member-order-draft";

export type MemberOrderDraft = {
  amount: number;
  baseAddress: string;
  buyerAddressId?: number;
  detailAddress?: string;
  items: Array<Pick<MemberCartItem, "optionLabel" | "quantity" | "skuId">>;
  orderId: string;
  orderName: string;
  receiverName: string;
  receiverPhone: string;
  zipCode?: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readMemberOrderDraft() {
  if (!isBrowser()) {
    return null;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(MEMBER_ORDER_DRAFT_STORAGE_KEY) || "null");
    return parsed && typeof parsed === "object" ? (parsed as MemberOrderDraft) : null;
  } catch {
    return null;
  }
}

export function writeMemberOrderDraft(draft: MemberOrderDraft) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(MEMBER_ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearMemberOrderDraft() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(MEMBER_ORDER_DRAFT_STORAGE_KEY);
}
