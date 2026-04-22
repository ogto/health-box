import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getAdminPassword,
  getAdminSessionToken,
  isAdminSecureCookie,
} from "../../../_lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputPassword = String(body.password || "").trim();

    const adminPassword = getAdminPassword();
    const adminSessionToken = getAdminSessionToken();

    if (!adminPassword || !adminSessionToken) {
      return NextResponse.json(
        { ok: false, message: "관리자 로그인 환경변수가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    if (inputPassword !== adminPassword) {
      return NextResponse.json(
        { ok: false, message: "비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true, message: "로그인 성공" });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: adminSessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: isAdminSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "로그인 처리 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

