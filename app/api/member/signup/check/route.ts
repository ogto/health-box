import { NextRequest, NextResponse } from "next/server";

import {
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerMallMembers,
  fetchAdminMembers,
  fetchDealerPublicBySlug,
  stringValue,
} from "../../../../_lib/health-box-api";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function valueMatches(type: "email" | "phone", source: unknown, target: string) {
  return type === "email"
    ? normalizeEmail(source) === target
    : normalizePhone(source) === target;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type === "phone" ? "phone" : "email";
    const hqMall = Boolean(body.hqMall);
    const dealerSlug = hqMall ? undefined : String(body.dealerSlug || "").trim() || undefined;
    const requestedDealerMallId = Number(body.dealerMallId);
    const dealerMallId =
      hqMall ? 0 :
      requestedDealerMallId ||
      Number((await fetchDealerPublicBySlug(dealerSlug || ""))?.dealerMallId || 0) ||
      0;
    const value = type === "email" ? normalizeEmail(body.value) : normalizePhone(body.value);

    if (!value) {
      return NextResponse.json(
        { ok: false, message: type === "email" ? "이메일을 입력해주세요." : "휴대폰 번호를 입력해주세요." },
        { status: 400 },
      );
    }

    if (!hqMall && !dealerMallId) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 정보를 확인할 수 없습니다." },
        { status: 400 },
      );
    }

    const members = hqMall
      ? ((await fetchAdminMembers()) || []).filter((member) => Number(member.dealerMallId ?? 0) === 0)
      : (await fetchAdminDealerMallMembers(dealerMallId)) || [];
    const duplicatedMember = members.find((member) =>
      valueMatches(type, stringValue(member, type), value),
    );

    if (duplicatedMember) {
      return NextResponse.json(
        {
          available: false,
          ok: true,
          message: type === "email" ? "이미 승인된 회원 이메일입니다." : "이미 승인된 회원 휴대폰 번호입니다.",
        },
        { status: 200 },
      );
    }

    const applications = (await fetchAdminBuyerSignupApplications()) || [];
    const duplicatedApplication = applications.find((application) => {
      const applicationStatus = stringValue(application, "status");
      const applicationDealerMallId = Number(application.dealerMallId ?? 0);
      const isPending = !applicationStatus || /^PENDING$/i.test(applicationStatus);
      return (
        isPending &&
        applicationDealerMallId === dealerMallId &&
        valueMatches(type, stringValue(application, type), value)
      );
    });

    if (duplicatedApplication) {
      return NextResponse.json(
        {
          available: false,
          ok: true,
          message: type === "email" ? "이미 가입 신청된 이메일입니다." : "이미 가입 신청된 휴대폰 번호입니다.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      available: true,
      ok: true,
      message: type === "email" ? "사용 가능한 이메일입니다." : "사용 가능한 휴대폰 번호입니다.",
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
