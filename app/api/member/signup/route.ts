import { NextRequest, NextResponse } from "next/server";

import {
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerMallMembers,
  fetchDealerPublicBySlug,
  healthBoxFetch,
  stringValue,
} from "../../../_lib/health-box-api";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function normalizeName(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
}

function buildSignupSlug(name: string, dealerSlug?: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 24);

  return `${dealerSlug || "member"}-${base || "signup"}-${Date.now()}`;
}

function extractErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedDealerMallId = Number(body.dealerMallId);
    const dealerSlug = String(body.dealerSlug || "").trim() || undefined;
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = normalizePhone(body.phone);
    const password = String(body.password || "");
    const resolvedDealerMallId =
      requestedDealerMallId ||
      Number((await fetchDealerPublicBySlug(dealerSlug || ""))?.dealerMallId || 0) ||
      0;

    if (!resolvedDealerMallId && !dealerSlug) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보가 없습니다. 딜러몰에서 다시 접속해주세요." },
        { status: 400 },
      );
    }

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, message: "이름과 휴대폰 번호를 입력해주세요." },
        { status: 400 },
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { ok: false, message: "비밀번호는 8자 이상 입력해주세요." },
        { status: 400 },
      );
    }

    if (!resolvedDealerMallId) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보를 확인할 수 없습니다. 다시 시도해주세요." },
        { status: 400 },
      );
    }

    const normalizedName = normalizeName(name);
    const members = (await fetchAdminDealerMallMembers(resolvedDealerMallId)) || [];
    const existingMember = members.find((member) => {
      const memberPhone = normalizePhone(stringValue(member, "phone"));
      const memberName = normalizeName(stringValue(member, "name"));
      return memberPhone === phone && memberName === normalizedName;
    });

    if (existingMember) {
      return NextResponse.json(
        { ok: false, message: "이미 승인된 회원입니다. 로그인 후 이용해주세요." },
        { status: 409 },
      );
    }

    const applications = (await fetchAdminBuyerSignupApplications()) || [];
    const existingApplication = applications.find((application) => {
      const applicationDealerMallId = Number(application.dealerMallId ?? 0);
      const applicationPhone = normalizePhone(stringValue(application, "phone"));
      const applicationName = normalizeName(stringValue(application, "name"));
      return (
        applicationDealerMallId === resolvedDealerMallId &&
        applicationPhone === phone &&
        applicationName === normalizedName
      );
    });

    if (existingApplication) {
      return NextResponse.json(
        { ok: false, message: "이미 가입 신청이 접수되어 있습니다. 승인 후 로그인해주세요." },
        { status: 409 },
      );
    }

    await healthBoxFetch("/health-box/public/buyer-signup-applications", {
      method: "POST",
      body: {
        dealerMallId: resolvedDealerMallId,
        name,
        phone,
        email: email || undefined,
        password,
        inboundChannel: dealerSlug ? `${dealerSlug}-public` : "public-web",
        slug: buildSignupSlug(name, dealerSlug),
      },
    });

    return NextResponse.json({ ok: true, message: "가입 신청이 접수되었습니다." });
  } catch (error) {
    const message = extractErrorMessage(error);
    return NextResponse.json(
      {
        ok: false,
        message: message || "회원가입 신청 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
