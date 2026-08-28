import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getAdminSession,
  isAdminSecureCookie,
} from "../../../_lib/admin-auth";
import { recordAdminAuthEvent } from "../../../_lib/health-box-api";

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    try {
      await recordAdminAuthEvent("LOGOUT", session);
    } catch (error) {
      console.error("[admin-auth] failed to record logout event", error);
    }
  }

  const response = NextResponse.json({ ok: true, message: "로그아웃 완료" });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isAdminSecureCookie(),
    path: "/",
    maxAge: 0,
  });

  return response;
}

