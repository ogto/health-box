import "server-only";

import { createHash, createHmac } from "node:crypto";

const TOSS_API_BASE_URL = "https://api.tosspayments.com";

export type TossPayment = Record<string, unknown>;

export class TossPaymentsError extends Error {
  code: string;
  status: number;

  constructor(message: string, status = 500, code = "TOSS_PAYMENT_ERROR") {
    super(message);
    this.name = "TossPaymentsError";
    this.status = status;
    this.code = code;
  }
}

function paymentMode() {
  const mode = String(process.env.HEALTH_BOX_TOSS_PAYMENT_MODE || "live").trim().toLowerCase();
  if (mode !== "live" && mode !== "test") {
    throw new Error("HEALTH_BOX_TOSS_PAYMENT_MODE must be live or test");
  }
  return mode;
}

function assertTossCredentialSource() {
  const source = String(process.env.HEALTH_BOX_TOSS_CREDENTIAL_SOURCE || "health-box")
    .trim()
    .toLowerCase();
  if (source === "health-box") {
    return;
  }
  if (source !== "notitle-temporary") {
    throw new Error("HEALTH_BOX_TOSS_CREDENTIAL_SOURCE must be health-box or notitle-temporary");
  }

  const expiresAt = String(process.env.HEALTH_BOX_TOSS_TEMPORARY_BRIDGE_EXPIRES_AT || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
    throw new Error("HEALTH_BOX_TOSS_TEMPORARY_BRIDGE_EXPIRES_AT must be YYYY-MM-DD");
  }

  const expirationTime = Date.parse(`${expiresAt}T23:59:59+09:00`);
  if (!Number.isFinite(expirationTime) || Date.now() > expirationTime) {
    throw new Error("The temporary NoTitle Toss credential bridge has expired");
  }
}

function getTossSecretKey() {
  assertTossCredentialSource();
  const mode = paymentMode();
  const secretKey =
    (mode === "live"
      ? process.env.HEALTH_BOX_TOSS_LIVE_SECRET_KEY
      : process.env.HEALTH_BOX_TOSS_TEST_SECRET_KEY
    )?.trim() || "";
  if (!secretKey) {
    throw new Error(
      mode === "live"
        ? "HEALTH_BOX_TOSS_LIVE_SECRET_KEY is not configured"
        : "HEALTH_BOX_TOSS_TEST_SECRET_KEY is not configured",
    );
  }

  const expectedPrefix = mode === "live" ? /^live_(?:g?sk)_/ : /^test_(?:g?sk)_/;
  if (!expectedPrefix.test(secretKey)) {
    throw new Error(`HealthBox Toss secret key does not match ${mode} mode`);
  }

  return secretKey;
}

function encodeAuthorization() {
  return `Basic ${Buffer.from(`${getTossSecretKey()}:`, "utf8").toString("base64")}`;
}

function idempotencyKey(scope: string, value: string) {
  const digest = createHash("sha256").update(value).digest("base64url");
  return `healthbox-${scope}-${digest}`;
}

async function parsePayload(response: Response) {
  return (await response.json().catch(() => ({}))) as TossPayment;
}

async function requestToss(
  path: string,
  options?: { body?: Record<string, unknown>; idempotencyKey?: string; method?: "GET" | "POST" },
) {
  const method = options?.method || "GET";
  const response = await fetch(`${TOSS_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: encodeAuthorization(),
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new TossPaymentsError(
      String(payload.message || "토스페이먼츠 요청에 실패했습니다."),
      response.status,
      String(payload.code || "TOSS_PAYMENT_ERROR"),
    );
  }

  return payload;
}

export function buildTossCustomerKey(memberId: number) {
  const secret = process.env.MEMBER_SESSION_SECRET?.trim() || "";
  const production = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (!secret && production) {
    throw new Error("MEMBER_SESSION_SECRET is not configured");
  }

  const signingSecret = secret || "health-box-development-only-member-session-secret";
  const digest = createHmac("sha256", signingSecret)
    .update(`toss-customer:${memberId}`)
    .digest("base64url");
  return `healthbox_${digest}`;
}

export async function getTossPayment(paymentKey: string) {
  return requestToss(`/v1/payments/${encodeURIComponent(paymentKey)}`);
}

export async function confirmOrRetrieveTossPayment(paymentKey: string, orderId: string, amount: number) {
  try {
    return await requestToss("/v1/payments/confirm", {
      method: "POST",
      idempotencyKey: idempotencyKey("confirm", `${orderId}:${paymentKey}`),
      body: { paymentKey, orderId, amount },
    });
  } catch (confirmError) {
    try {
      const payment = await getTossPayment(paymentKey);
      if (String(payment.status || "").toUpperCase() === "DONE") {
        return payment;
      }
    } catch {
      // The original confirmation error is more useful than a follow-up lookup failure.
    }
    throw confirmError;
  }
}

export async function cancelTossPayment({
  paymentKey,
  cancelReason,
  cancelAmount,
  requestId,
}: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
  requestId: string;
}) {
  return requestToss(`/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
    method: "POST",
    idempotencyKey: idempotencyKey("cancel", requestId),
    body: {
      cancelReason: cancelReason.slice(0, 200),
      ...(cancelAmount && cancelAmount > 0 ? { cancelAmount } : {}),
    },
  });
}

export function tossPaymentMethodName(payment: TossPayment) {
  const easyPay =
    payment.easyPay && typeof payment.easyPay === "object"
      ? (payment.easyPay as Record<string, unknown>)
      : null;
  return String(easyPay?.provider || payment.method || "토스페이먼츠").trim();
}

export function tossPaymentReceiptUrl(payment: TossPayment) {
  const receipt =
    payment.receipt && typeof payment.receipt === "object"
      ? (payment.receipt as Record<string, unknown>)
      : null;
  return String(receipt?.url || "").trim();
}

export function tossPaymentProvider() {
  if (paymentMode() !== "live") {
    return "TOSS_TEST";
  }
  const source = String(process.env.HEALTH_BOX_TOSS_CREDENTIAL_SOURCE || "health-box")
    .trim()
    .toLowerCase();
  return source === "notitle-temporary" ? "TOSS_NOTITLE_TEMPORARY" : "TOSS";
}
