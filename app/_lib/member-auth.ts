import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const MEMBER_COOKIE_NAME = "health_box_member_auth";
export const MEMBER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const MEMBER_SESSION_CLOCK_SKEW_MS = 60 * 1000;

export type MemberSession = {
  memberId: number | null;
  dealerMallId: number;
  name?: string;
  loginId?: string;
  phone?: string;
  email?: string;
  dealerSlug?: string;
  sessionToken?: string;
  issuedAt: number;
};

type DealerSessionScope = {
  dealerMallId?: number | string | null;
  slug?: string | null;
} | null | undefined;

function getMemberSessionSecret() {
  const secret = process.env.MEMBER_SESSION_SECRET?.trim() || "";
  const production = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (secret) {
    if (production && secret.length < 32) {
      throw new Error("MEMBER_SESSION_SECRET must be at least 32 characters in production");
    }

    return secret;
  }

  if (production) {
    throw new Error("MEMBER_SESSION_SECRET is not configured");
  }

  return "health-box-development-only-member-session-secret";
}

function signValue(value: string) {
  return createHmac("sha256", getMemberSessionSecret()).update(value).digest("base64url");
}

function encodePayload(payload: Omit<MemberSession, "issuedAt">) {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      issuedAt: Date.now(),
    } satisfies MemberSession),
  ).toString("base64url");

  const signature = signValue(data);
  return `${data}.${signature}`;
}

function decodePayload(value: string): MemberSession | null {
  const [data, signature, extra] = value.split(".");
  if (!data || !signature || extra) {
    return null;
  }

  const expected = signValue(data);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as MemberSession;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (!Number.isFinite(Number(parsed.dealerMallId))) {
      return null;
    }

    const age = Date.now() - Number(parsed.issuedAt);
    if (
      !Number.isFinite(age) ||
      age < -MEMBER_SESSION_CLOCK_SKEW_MS ||
      age > MEMBER_SESSION_MAX_AGE_SECONDS * 1000
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isMemberSecureCookie() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function buildMemberSessionCookieValue(payload: Omit<MemberSession, "issuedAt">) {
  return encodePayload(payload);
}

export async function getMemberSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(MEMBER_COOKIE_NAME)?.value;
  return raw ? decodePayload(raw) : null;
}

export function isMemberSessionForDealer(session: MemberSession | null | undefined, dealer: DealerSessionScope) {
  if (!session) {
    return false;
  }

  if (!dealer) {
    return true;
  }

  const dealerMallId = Number(dealer.dealerMallId);
  if (Number.isFinite(dealerMallId) && dealerMallId > 0) {
    return Number(session.dealerMallId) === dealerMallId;
  }

  const dealerSlug = typeof dealer.slug === "string" ? dealer.slug.trim() : "";
  if (dealerSlug && session.dealerSlug) {
    return session.dealerSlug === dealerSlug;
  }

  return true;
}
