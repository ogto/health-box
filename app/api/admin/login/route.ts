import { NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isAdminSecureCookie } from "../../../_lib/admin-auth";
import {
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  type AdminSession,
} from "../../../_lib/admin-session";
import {
  authenticateAdminStaff,
  hasHealthBoxApi,
  recordAdminAuthEvent,
} from "../../../_lib/health-box-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputLoginId = String(body.loginId || "").trim().toLowerCase();
    const inputPassword = String(body.password || "").trim();

    if (!process.env.ADMIN_SESSION_TOKEN?.trim()) {
      return NextResponse.json(
        { ok: false, message: "관리자 세션 환경변수가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    let sessionInput: Omit<AdminSession, "expiresAt"> | null = null;

    if (inputLoginId && inputPassword && hasHealthBoxApi()) {
      try {
        const staff = await authenticateAdminStaff(inputLoginId, inputPassword);
        const scopeType = staff.scopeType === "DEALER" ? "DEALER" : "HQ";
        const dealerMallId = Number(staff.dealerMallId || 0);
        sessionInput = {
          staffId: Number(staff.id || 0) > 0 ? Number(staff.id) : null,
          loginId: staff.loginId || inputLoginId,
          name: staff.name || "관리자",
          scopeType,
          dealerMallId: scopeType === "DEALER" && dealerMallId > 0 ? dealerMallId : null,
          scopeName: staff.scopeName || (scopeType === "DEALER" ? "딜러몰" : "본사몰"),
          roleType: staff.roleType === "OWNER" || staff.roleType === "DEVELOPER" ? "OWNER" : "STAFF",
          permissionCodes: Array.isArray(staff.permissionCodes) ? staff.permissionCodes : [],
        };
      } catch {
        sessionInput = null;
      }
    }

    if (!sessionInput) {
      return NextResponse.json(
        { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    if (sessionInput.scopeType === "DEALER" && !sessionInput.dealerMallId) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 소속 정보가 올바르지 않습니다." },
        { status: 403 },
      );
    }

    try {
      await recordAdminAuthEvent("LOGIN", sessionInput);
    } catch (error) {
      console.error("[admin-auth] failed to record login event", error);
    }

    const adminSessionToken = createAdminSessionToken(sessionInput);

    const response = NextResponse.json({
      ok: true,
      message: "로그인 성공",
      scopeType: sessionInput.scopeType,
      scopeName: sessionInput.scopeName,
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: adminSessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: isAdminSecureCookie(),
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
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
