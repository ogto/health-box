import { cookies } from "next/headers";

export { ADMIN_COOKIE_NAME } from "./admin-session";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "./admin-session";

export function isAdminSecureCookie() {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("관리자 로그인이 필요합니다.");
  }
  return session;
}

export async function requireWritableAdminSession() {
  const session = await requireAdminSession();
  if (session.scopeType === "DEALER") {
    throw new Error("딜러 관리자 계정은 조회만 가능합니다.");
  }
  return session;
}
