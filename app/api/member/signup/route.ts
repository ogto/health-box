import { NextRequest, NextResponse } from "next/server";

import {
  fetchDealerPublicBySlug,
  healthBoxFetch,
} from "../../../_lib/health-box-api";
import { BUYER_SIGNUP_CONSENT_VERSION } from "@/lib/buyer-consent";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function extractErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const cleanedMessage = rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();

  try {
    const payload = JSON.parse(cleanedMessage);
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    // The API may return a plain-text validation message.
  }

  return cleanedMessage;
}

function extractErrorStatus(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const match = /^HealthBox API (\d+):/.exec(rawMessage);
  const status = Number(match?.[1] || 0);
  return status >= 400 && status < 500 ? status : 500;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedDealerMallId = Number(body.dealerMallId);
    const hqMall = Boolean(body.hqMall);
    const dealerSlug = hqMall ? undefined : String(body.dealerSlug || "").trim() || undefined;
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = String(body.password || "");
    const birthDate = String(body.birthDate || "").trim();
    const termsAgreed = body.termsAgreed === true;
    const privacyAgreed = body.privacyAgreed === true;
    const thirdPartyAgreed = body.thirdPartyAgreed === true;
    const marketingAgreed = body.marketingAgreed === true;
    const consentDocumentVersion = String(body.consentDocumentVersion || "").trim();
    const resolvedDealerMallId =
      hqMall ? 0 :
      requestedDealerMallId ||
      Number((await fetchDealerPublicBySlug(dealerSlug || ""))?.dealerMallId || 0) ||
      0;

    if (!hqMall && !resolvedDealerMallId && !dealerSlug) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보가 없습니다. 딜러몰에서 다시 접속해주세요." },
        { status: 400 },
      );
    }

    if (!name || !phone || !email) {
      return NextResponse.json(
        { ok: false, message: "이름, 휴대폰 번호, 이메일을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "비밀번호는 8자 이상 입력해주세요." },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return NextResponse.json(
        { ok: false, message: "생년월일을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!termsAgreed || !privacyAgreed || !thirdPartyAgreed) {
      return NextResponse.json(
        { ok: false, message: "필수 약관과 개인정보 동의 항목에 동의해주세요." },
        { status: 400 },
      );
    }

    if (consentDocumentVersion !== BUYER_SIGNUP_CONSENT_VERSION) {
      return NextResponse.json(
        { ok: false, message: "개인정보 동의 문안 버전을 확인해주세요." },
        { status: 400 },
      );
    }

    if (!hqMall && !resolvedDealerMallId) {
      return NextResponse.json(
        {
          ok: false,
          message: "딜러몰 정보를 확인할 수 없습니다. 다시 시도해주세요.",
        },
        { status: 400 },
      );
    }

    await healthBoxFetch("/health-box/public/buyer-signup-applications", {
      method: "POST",
      body: {
        dealerMallId: resolvedDealerMallId,
        name,
        phone,
        email,
        password,
        birthDate,
        termsAgreed,
        privacyAgreed,
        thirdPartyAgreed,
        marketingAgreed,
        consentDocumentVersion,
        inboundChannel: hqMall ? "hq-public" : "dealer-public",
        slug: hqMall ? undefined : dealerSlug,
      },
    });

    return NextResponse.json({ ok: true, message: "회원가입이 완료되었습니다. 바로 로그인해주세요." });
  } catch (error) {
    const message = extractErrorMessage(error);
    const status = extractErrorStatus(error);
    return NextResponse.json(
      {
        ok: false,
        message: message || "회원가입 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status },
    );
  }
}
