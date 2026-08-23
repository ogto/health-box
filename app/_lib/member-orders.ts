import "server-only";

import { createHash } from "node:crypto";

import { fetchPublicSiteConfig, healthBoxFetch } from "./health-box-api";
import type { MemberSession } from "./member-auth";
import {
  calculateShippingBreakdown,
  normalizeZipCode,
  parseStorefrontPolicyBundle,
  remainingForFreeShipping,
} from "./storefront-policy";

export type MemberOrderItem = {
  optionSummarySnapshot?: string;
  quantity: number;
  skuId: number;
};

export type MemberOrderQuote = {
  discountAmount: number;
  freeShippingThreshold: number;
  productAmount: number;
  remainingForFreeShipping: number;
  remoteAreaFee: number;
  shippingFee: number;
  totalPaymentAmount: number;
};

export function normalizeMemberOrderItems(value: unknown): MemberOrderItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: Record<string, unknown>) => {
      const optionSummarySnapshot = String(item?.optionLabel || item?.optionSummarySnapshot || "").trim();
      return {
        skuId: Number(item?.skuId || 0),
        quantity: Number(item?.quantity || 0),
        ...(optionSummarySnapshot ? { optionSummarySnapshot } : {}),
      };
    })
    .filter(
      (item): item is MemberOrderItem =>
        Number.isSafeInteger(item.skuId) &&
        item.skuId > 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99,
    );
}

export function memberOrderItemsFingerprint(items: MemberOrderItem[]) {
  const canonicalItems = items
    .map(({ quantity, skuId }) => ({ quantity, skuId }))
    .sort((left, right) => left.skuId - right.skuId || left.quantity - right.quantity);

  return createHash("sha256").update(JSON.stringify(canonicalItems)).digest("base64url");
}

function optionalNonNegativeInteger(value: unknown) {
  const numericValue = Number(value);
  return Number.isSafeInteger(numericValue) && numericValue >= 0 ? numericValue : null;
}

export async function fetchMemberOrderQuote(
  session: MemberSession,
  items: MemberOrderItem[],
  zipCode?: string | null,
): Promise<MemberOrderQuote> {
  if (!session.memberId || session.dealerMallId == null || !session.sessionToken) {
    throw new Error("Invalid member session");
  }

  const normalizedZipCode = normalizeZipCode(zipCode);

  const [quote, publicSiteConfig] = await Promise.all([
    healthBoxFetch<{
      amount?: number;
      deliveryFee?: number;
      discountAmount?: number;
      freeShippingThreshold?: number;
      itemSubtotal?: number;
      productAmount?: number;
      remainingForFreeShipping?: number;
      remoteAreaFee?: number;
      shippingFee?: number;
      totalAmount?: number;
      totalPaymentAmount?: number;
      totalProductAmount?: number;
    }>("/health-box/public/orders/quote", {
      method: "POST",
      body: {
        buyerMemberId: session.memberId,
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
        zipCode: normalizedZipCode,
        items: items.map(({ quantity, skuId }) => ({ quantity, skuId })),
      },
    }),
    fetchPublicSiteConfig(),
  ]);

  const policy = parseStorefrontPolicyBundle(publicSiteConfig?.policyText).commerce;
  const backendTotal = optionalNonNegativeInteger(
    quote.totalPaymentAmount ?? quote.totalAmount ?? quote.amount,
  );
  const backendShippingFee = optionalNonNegativeInteger(quote.shippingFee ?? quote.deliveryFee);
  const discountAmount = optionalNonNegativeInteger(quote.discountAmount) ?? 0;
  const explicitProductAmount = optionalNonNegativeInteger(
    quote.productAmount ?? quote.totalProductAmount ?? quote.itemSubtotal,
  );
  const productAmount = explicitProductAmount ?? (
    backendTotal !== null
      ? Math.max(0, backendTotal - (backendShippingFee ?? 0) + discountAmount)
      : null
  );

  if (productAmount === null || productAmount <= 0) {
    throw new Error("Invalid member order total");
  }

  const localBreakdown = calculateShippingBreakdown(productAmount, policy, normalizedZipCode);
  const completeBackendBreakdown =
    explicitProductAmount !== null && backendShippingFee !== null && backendTotal !== null;
  const shippingFee = completeBackendBreakdown ? backendShippingFee : localBreakdown.shippingFee;
  const remoteAreaFee = completeBackendBreakdown
    ? Math.min(optionalNonNegativeInteger(quote.remoteAreaFee) ?? 0, shippingFee)
    : localBreakdown.remoteAreaFee;
  const calculatedTotal = Math.max(0, productAmount + shippingFee - discountAmount);
  if (completeBackendBreakdown && backendTotal !== calculatedTotal) {
    throw new Error("Inconsistent member order quote");
  }
  const totalPaymentAmount = completeBackendBreakdown ? backendTotal : calculatedTotal;
  const freeShippingThreshold =
    optionalNonNegativeInteger(quote.freeShippingThreshold) ?? policy.freeShippingThreshold;
  const quotedRemaining = optionalNonNegativeInteger(quote.remainingForFreeShipping);

  if (!Number.isSafeInteger(totalPaymentAmount) || totalPaymentAmount <= 0) {
    throw new Error("Invalid member order total");
  }

  return {
    productAmount,
    shippingFee,
    discountAmount,
    totalPaymentAmount,
    freeShippingThreshold,
    remoteAreaFee,
    remainingForFreeShipping:
      quotedRemaining ?? remainingForFreeShipping(productAmount, { ...policy, freeShippingThreshold }),
  };
}

export async function fetchMemberOrderTotal(
  session: MemberSession,
  items: MemberOrderItem[],
  zipCode?: string | null,
) {
  return (await fetchMemberOrderQuote(session, items, zipCode)).totalPaymentAmount;
}
