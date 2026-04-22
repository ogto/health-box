import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isAdminSecureCookie } from "../../../_lib/admin-auth";

export async function POST() {
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

