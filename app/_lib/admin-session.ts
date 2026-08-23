import "server-only";

import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "./admin-auth";

export async function hasAdminSession() {
  const expectedToken = getAdminSessionToken();
  if (!expectedToken) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === expectedToken;
}

export async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    throw new Error("Unauthorized admin action");
  }
}
