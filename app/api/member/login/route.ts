import { NextRequest, NextResponse } from "next/server";

import {
  fetchDealerPublicBySlug,
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

function normalizeBuyerLoginError(message: string) {
  const normalized = message.trim();

  if (/invalid buyer login credentials/i.test(normalized)) {
    return {
      message: "계정 정보를 확인해주세요.",
      status: 401,
    };
  }

  if (/buyer member not found for dealer mall/i.test(normalized)) {
    return {
      message: "승인된 회원 정보를 찾을 수 없습니다.",
      status: 403,
    };
  }

  if (/dealer mall not found/i.test(normalized)) {
    return {
      message: "딜러몰 정보를 찾지 못했습니다. 다시 접속해주세요.",
      status: 400,
    };
  }

  if (/dealer mall public config is inactive|dealer mall is inactive/i.test(normalized)) {
    return {
      message: "현재 비활성화된 딜러몰입니다.",
      status: 403,
    };
  }

  return {
    message: normalized || "로그인에 실패했습니다.",
    status: 400,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedDealerMallId = Number(body.dealerMallId);
    const loginId = String(body.loginId || "").trim();
    const password = String(body.password || "");
    const dealerSlug = String(body.dealerSlug || "").trim() || undefined;
    const apiBaseUrl = getApiBaseUrl();

    if (!requestedDealerMallId && !dealerSlug) {
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
        dealerMallId: requestedDealerMallId || undefined,
        loginId,
        password,
        slug: dealerSlug,
      }),
    });

    const rawText = await backendResponse.text();

    if (!backendResponse.ok) {
      const normalizedError = normalizeBuyerLoginError(extractErrorMessage(rawText) || "");
      return NextResponse.json(
        { ok: false, message: normalizedError.message },
        { status: normalizedError.status },
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

    const responseDealerMallId =
      Number(
        memberPayload?.dealerMallId ??
          memberPayload?.dealer_mall_id ??
          memberPayload?.mallId ??
          0,
      ) || 0;
    const fallbackDealerMallId =
      requestedDealerMallId ||
      Number((await fetchDealerPublicBySlug(dealerSlug || ""))?.dealerMallId || 0) ||
      0;
    const finalDealerMallId = responseDealerMallId || fallbackDealerMallId;

    if (!finalDealerMallId) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보를 확인할 수 없습니다. 다시 시도해주세요." },
        { status: 500 },
      );
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
        dealerMallId: finalDealerMallId,
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
