import { NextRequest, NextResponse } from "next/server";

import {
  type HealthBoxRecord,
  stringValue,
} from "../../../_lib/health-box-api";
import {
  buildMemberSessionCookieValue,
  isMemberSecureCookie,
  MEMBER_COOKIE_NAME,
} from "../../../_lib/member-auth";

function getApiBaseUrl() {
  return process.env.HEALTH_BOX_API_BASE_URL?.trim().replace(/\/+$/, "") || "";
}

function extractErrorMessage(payload: string) {
  try {
    const parsed = JSON.parse(payload) as { message?: string };
    return parsed.message || payload;
  } catch {
    return payload;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dealerMallId = Number(body.dealerMallId);
    const loginId = String(body.loginId || "").trim();
    const password = String(body.password || "");
    const dealerSlug = String(body.dealerSlug || "").trim() || undefined;
    const apiBaseUrl = getApiBaseUrl();

    if (!dealerMallId) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보가 없습니다. 딜러몰에서 다시 접속해주세요." },
        { status: 400 },
      );
    }

    if (!loginId || !password) {
      return NextResponse.json(
        { ok: false, message: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 },
      );
    }

    if (!apiBaseUrl) {
      return NextResponse.json(
        { ok: false, message: "HEALTH_BOX_API_BASE_URL이 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const backendResponse = await fetch(`${apiBaseUrl}/health-box/public/buyer-auth/login`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dealerMallId,
        loginId,
        password,
        slug: dealerSlug,
      }),
    });

    const rawText = await backendResponse.text();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { ok: false, message: extractErrorMessage(rawText) || "로그인에 실패했습니다." },
        { status: backendResponse.status || 500 },
      );
    }

    let memberPayload: HealthBoxRecord | null = null;
    if (rawText) {
      try {
        memberPayload = JSON.parse(rawText) as HealthBoxRecord;
      } catch {
        memberPayload = null;
      }
    }

    const response = NextResponse.json({ ok: true, message: "로그인 성공" });
    response.cookies.set({
      name: MEMBER_COOKIE_NAME,
      value: buildMemberSessionCookieValue({
        memberId:
          Number(
            memberPayload?.id ??
              memberPayload?.buyerMemberId ??
              memberPayload?.memberId ??
              0,
          ) || null,
        dealerMallId,
        name: stringValue(memberPayload, "name", "memberName", "buyerName") || loginId,
        loginId,
        phone: stringValue(memberPayload, "phone") || undefined,
        email: stringValue(memberPayload, "email") || undefined,
        dealerSlug,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: isMemberSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
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
