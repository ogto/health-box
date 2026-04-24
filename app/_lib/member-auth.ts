import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const MEMBER_COOKIE_NAME = "health_box_member_auth";

export type MemberSession = {
  memberId: number | null;
  dealerMallId: number;
  name?: string;
  loginId?: string;
  phone?: string;
  email?: string;
  dealerSlug?: string;
  issuedAt: number;
};

function getMemberSessionSecret() {
  return (
    process.env.MEMBER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_TOKEN?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "health-box-member-session"
  );
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
  const [data, signature] = value.split(".");
  if (!data || !signature) {
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

    if (!parsed.dealerMallId) {
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
