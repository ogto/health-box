import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "../../../../_lib/health-box-api";

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
  if (/buyer identity does not match/i.test(message)) {
    return "입력한 이름, 휴대폰 번호, 이메일이 가입된 회원 정보와 일치하지 않습니다.";
  }

  if (/buyer member not found/i.test(message)) {
    return "입력한 정보와 일치하는 승인 회원을 찾을 수 없습니다.";
  }

  if (/buyer account not found/i.test(message)) {
    return "승인된 회원 정보는 확인됐지만 비밀번호 변경 대상 계정을 찾지 못했습니다. 관리자에게 문의해주세요.";
  }

  if (/dealerMallId or slug is required|dealer mall not found|invalid dealer mall/i.test(message)) {
    return "몰 정보를 확인할 수 없습니다. 접속한 몰에서 다시 시도해주세요.";
  }

  return message || "본인확인 중 오류가 발생했습니다.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const hqMall = Boolean(body.hqMall);
    const dealerMallId = Number(body.dealerMallId || 0) || undefined;
    const dealerSlug = hqMall ? undefined : String(body.dealerSlug || "").trim() || undefined;
    const host = String(body.host || "").trim() || undefined;
    const name = String(body.name || "").trim();
    const phone = normalizePhone(body.phone);
    const email = String(body.email || "").trim();

    if (!name || !phone || !email) {
      return NextResponse.json(
        { ok: false, message: "이름, 휴대폰 번호, 이메일을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!hqMall && !dealerMallId && !dealerSlug && !host) {
      return NextResponse.json(
        { ok: false, message: "몰 정보를 확인할 수 없습니다. 접속한 몰에서 다시 시도해주세요." },
        { status: 400 },
      );
    }

    await healthBoxFetch("/health-box/public/buyer-auth/password-reset/verify", {
      method: "POST",
      body: {
        dealerMallId: hqMall ? undefined : dealerMallId,
        slug: dealerSlug,
        host,
        hqMall,
        name,
        phone,
        email,
      },
    });

    return NextResponse.json({ ok: true, message: "본인확인이 완료되었습니다." });
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
