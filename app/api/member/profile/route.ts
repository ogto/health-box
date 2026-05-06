import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch, stringValue, type HealthBoxRecord } from "../../../_lib/health-box-api";
import {
  buildMemberSessionCookieValue,
  getMemberSession,
  isMemberSecureCookie,
  MEMBER_COOKIE_NAME,
} from "../../../_lib/member-auth";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function extractErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}

function toFriendlyMessage(message: string) {
  if (/phone already exists/i.test(message)) {
    return "이미 사용 중인 휴대폰 번호입니다.";
  }

  if (/email already exists/i.test(message)) {
    return "이미 사용 중인 이메일입니다.";
  }

  if (/buyer member|buyer account|session token|invalid buyer session/i.test(message)) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
  }

  return message || "회원정보 수정 중 오류가 발생했습니다.";
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json(
        { ok: false, message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const phone = normalizePhone(body.phone);
    const email = String(body.email || "").trim();

    if (!name || !phone || !email) {
      return NextResponse.json(
        { ok: false, message: "이름, 휴대폰 번호, 이메일을 입력해주세요." },
        { status: 400 },
      );
    }

    const updated = await healthBoxFetch<HealthBoxRecord>(`/health-box/public/buyer-members/${session.memberId}`, {
      method: "PUT",
      body: {
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
        name,
        phone,
        email,
      },
    });

    const response = NextResponse.json({ ok: true, message: "회원정보가 수정되었습니다." });
    response.cookies.set({
      name: MEMBER_COOKIE_NAME,
      value: buildMemberSessionCookieValue({
        memberId: session.memberId,
        dealerMallId: Number(updated.dealerMallId ?? session.dealerMallId),
        name: stringValue(updated, "name") || name,
        loginId: session.loginId,
        phone: stringValue(updated, "phone") || phone,
        email: stringValue(updated, "email") || email,
        dealerSlug: stringValue(updated, "slug") || session.dealerSlug,
        sessionToken: stringValue(updated, "sessionToken") || session.sessionToken,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: isMemberSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = extractErrorMessage(error);
    return NextResponse.json(
      {
        ok: false,
        message: toFriendlyMessage(message),
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
