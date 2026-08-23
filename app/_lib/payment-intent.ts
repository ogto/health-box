import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { MemberSession } from "./member-auth";
import type { MemberOrderItem, MemberOrderQuote } from "./member-orders";
import { memberOrderItemsFingerprint } from "./member-orders";

const CHECKOUT_INTENT_MAX_AGE_MS = 15 * 60 * 1000;
const CHECKOUT_INTENT_CLOCK_SKEW_MS = 60 * 1000;
const CHECKOUT_INTENT_MAX_LENGTH = 4_000;

export type CheckoutIntent = {
  amount: number;
  dealerMallId: number;
  discountAmount: number;
  issuedAt: number;
  itemsFingerprint: string;
  memberId: number;
  orderId: string;
  productAmount: number;
  shippingFee: number;
  version: 1;
};

function getPaymentSigningSecret() {
  const secret = process.env.HEALTH_BOX_PAYMENT_PROOF_SECRET?.trim() || "";
  const production = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (!secret) {
    if (production) {
      throw new Error("HEALTH_BOX_PAYMENT_PROOF_SECRET is not configured");
    }

    return "health-box-development-only-payment-signing-secret";
  }

  if (production && secret.length < 32) {
    throw new Error("HEALTH_BOX_PAYMENT_PROOF_SECRET must be at least 32 characters in production");
  }

  return secret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getPaymentSigningSecret())
    .update(`checkout-intent:${payload}`)
    .digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function buildCheckoutIntent(
  session: MemberSession,
  orderId: string,
  items: MemberOrderItem[],
  quote: MemberOrderQuote,
) {
  if (!session.memberId || session.dealerMallId == null) {
    throw new Error("Invalid member session");
  }

  const value: CheckoutIntent = {
    amount: quote.totalPaymentAmount,
    dealerMallId: session.dealerMallId,
    discountAmount: quote.discountAmount,
    issuedAt: Date.now(),
    itemsFingerprint: memberOrderItemsFingerprint(items),
    memberId: session.memberId,
    orderId,
    productAmount: quote.productAmount,
    shippingFee: quote.shippingFee,
    version: 1,
  };
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifyCheckoutIntent(value: string): CheckoutIntent | null {
  if (!value || value.length > CHECKOUT_INTENT_MAX_LENGTH) {
    return null;
  }

  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra || !signaturesMatch(signature, signPayload(payload))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CheckoutIntent;
    const age = Date.now() - Number(parsed.issuedAt);
    const validAmounts = [
      parsed.amount,
      parsed.productAmount,
      parsed.shippingFee,
      parsed.discountAmount,
    ].every((amount) => Number.isSafeInteger(amount) && amount >= 0);

    if (
      parsed.version !== 1 ||
      !Number.isSafeInteger(parsed.memberId) ||
      parsed.memberId <= 0 ||
      !Number.isSafeInteger(parsed.dealerMallId) ||
      parsed.dealerMallId < 0 ||
      !validAmounts ||
      parsed.amount <= 0 ||
      parsed.productAmount + parsed.shippingFee - parsed.discountAmount !== parsed.amount ||
      !/^healthbox_[A-Za-z0-9_-]{6,54}$/.test(parsed.orderId) ||
      !parsed.itemsFingerprint ||
      !Number.isFinite(age) ||
      age < -CHECKOUT_INTENT_CLOCK_SKEW_MS ||
      age > CHECKOUT_INTENT_MAX_AGE_MS
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
