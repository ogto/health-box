import { NextRequest, NextResponse } from "next/server";

import {
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerMallMembers,
  fetchAdminMembers,
  fetchDealerPublicBySlug,
  healthBoxFetch,
  stringValue,
} from "../../../_lib/health-box-api";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
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
    const hqMall = Boolean(body.hqMall);
    const dealerSlug = hqMall ? undefined : String(body.dealerSlug || "").trim() || undefined;
    const name = String(body.name || "").trim();
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = String(body.password || "");
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

    if (!hqMall && !resolvedDealerMallId) {
      return NextResponse.json(
        {
          ok: false,
          message: "딜러몰 정보를 확인할 수 없습니다. 다시 시도해주세요.",
        },
        { status: 400 },
      );
    }

    const members = hqMall
      ? ((await fetchAdminMembers()) || []).filter((member) => Number(member.dealerMallId ?? 0) === 0)
      : (await fetchAdminDealerMallMembers(resolvedDealerMallId)) || [];
    const existingMember = members.find((member) => {
      const memberPhone = normalizePhone(stringValue(member, "phone"));
      const memberEmail = normalizeEmail(stringValue(member, "email"));
      return memberPhone === phone || memberEmail === email;
    });

    if (existingMember) {
      const existingMemberEmail = normalizeEmail(stringValue(existingMember, "email"));
      return NextResponse.json(
        {
          ok: false,
          message: existingMemberEmail === email
            ? "이미 승인된 회원 이메일입니다. 로그인 후 이용해주세요."
            : "이미 승인된 회원 휴대폰 번호입니다. 로그인 후 이용해주세요.",
        },
        { status: 409 },
      );
    }

    const applications = (await fetchAdminBuyerSignupApplications()) || [];
    const existingApplication = applications.find((application) => {
      const applicationDealerMallId = Number(application.dealerMallId ?? 0);
      const applicationPhone = normalizePhone(stringValue(application, "phone"));
      const applicationEmail = normalizeEmail(stringValue(application, "email"));
      const applicationStatus = stringValue(application, "status");
      return (
        (!applicationStatus || /^PENDING$/i.test(applicationStatus)) &&
        applicationDealerMallId === resolvedDealerMallId &&
        (applicationPhone === phone || applicationEmail === email)
      );
    });

    if (existingApplication) {
      const existingApplicationEmail = normalizeEmail(stringValue(existingApplication, "email"));
      return NextResponse.json(
        {
          ok: false,
          message: existingApplicationEmail === email
            ? "이미 가입 신청된 이메일입니다. 승인 후 로그인해주세요."
            : "이미 가입 신청된 휴대폰 번호입니다. 승인 후 로그인해주세요.",
        },
        { status: 409 },
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
        inboundChannel: hqMall ? "hq-public" : "dealer-public",
        slug: hqMall ? undefined : buildSignupSlug(name, dealerSlug),
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
