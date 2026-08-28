import { NextRequest, NextResponse } from "next/server";

import {
  healthBoxFetch,
} from "../../../../_lib/health-box-api";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

type SignupAvailabilityResponse = {
  available: boolean;
  message: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type === "phone" ? "phone" : "email";
    const hqMall = Boolean(body.hqMall);
    const dealerSlug = hqMall ? undefined : String(body.dealerSlug || "").trim() || undefined;
    const requestedDealerMallId = Number(body.dealerMallId);
    const dealerMallId = hqMall ? 0 : requestedDealerMallId || undefined;
    const value = type === "email" ? normalizeEmail(body.value) : normalizePhone(body.value);

    if (!value) {
      return NextResponse.json(
        { ok: false, message: type === "email" ? "이메일을 입력해주세요." : "휴대폰 번호를 입력해주세요." },
        { status: 400 },
      );
    }

    if (!hqMall && !dealerMallId && !dealerSlug) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보를 확인할 수 없습니다." },
        { status: 400 },
      );
    }

    const result = await healthBoxFetch<SignupAvailabilityResponse>(
      "/health-box/public/buyer-signup-availability",
      {
        method: "POST",
        body: {
          dealerMallId,
          hqMall,
          slug: dealerSlug,
          type,
          value,
        },
      },
    );

    return NextResponse.json({
      available: result.available,
      ok: true,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "중복확인 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
