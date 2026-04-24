import { NextResponse } from "next/server";

import { isMemberSecureCookie, MEMBER_COOKIE_NAME } from "../../../_lib/member-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "로그아웃되었습니다." });

  response.cookies.set({
    name: MEMBER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isMemberSecureCookie(),
    path: "/",
    maxAge: 0,
  });

  return response;
}
