import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch } from "../../_lib/health-box-api";
import { DEALER_APPLICATION_CONSENT_VERSION } from "@/lib/dealer-application-consent";

function text(value: unknown) {
  return String(value || "").trim();
}

function digits(value: unknown) {
  return text(value).replace(/[^0-9]/g, "");
}

function errorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const cleaned = rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();

  try {
    const payload = JSON.parse(cleaned) as { message?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    // The backend may return a plain-text validation error.
  }

  return cleaned;
}

function errorStatus(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const status = Number(/^HealthBox API (\d+):/.exec(rawMessage)?.[1] || 0);
  return status >= 400 && status < 500 ? status : 500;
}

function publicErrorMessage(message: string) {
  if (/slug already exists|slug already has a pending application/i.test(message)) {
    return "이미 사용 중이거나 승인 대기 중인 딜러몰 주소입니다. 다른 주소를 입력해주세요.";
  }
  if (/privacy consent/i.test(message)) {
    return "개인정보 수집·이용 동의가 필요합니다.";
  }
  if (/businessInfo/i.test(message)) {
    return "사업자 정보와 신청 내용을 다시 확인해주세요.";
  }

  return message || "딜러 신청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    if (text(body.website)) {
      return NextResponse.json({ ok: true, message: "딜러 신청이 접수되었습니다." });
    }

    const applicantName = text(body.applicantName);
    const phone = digits(body.phone);
    const email = text(body.email).toLowerCase();
    const companyName = text(body.companyName);
    const businessRegistrationNumber = digits(body.businessRegistrationNumber);
    const businessType = text(body.businessType);
    const businessAddress = text(body.businessAddress);
    const applicationReason = text(body.applicationReason);
    const wantedMallName = text(body.wantedMallName);
    const wantedSlug = text(body.wantedSlug).toLowerCase();
    const privacyAgreed = body.privacyAgreed === true;
    const consentDocumentVersion = text(body.consentDocumentVersion);

    if (!applicantName || applicantName.length > 100) {
      return NextResponse.json({ ok: false, message: "신청자 이름을 입력해주세요." }, { status: 400 });
    }
    if (!/^\d{9,11}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: "휴대폰 번호를 정확히 입력해주세요." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 150) {
      return NextResponse.json({ ok: false, message: "이메일을 정확히 입력해주세요." }, { status: 400 });
    }
    if (!companyName || companyName.length > 150) {
      return NextResponse.json({ ok: false, message: "상호 또는 단체명을 입력해주세요." }, { status: 400 });
    }
    if (businessRegistrationNumber && !/^\d{10}$/.test(businessRegistrationNumber)) {
      return NextResponse.json({ ok: false, message: "사업자등록번호 10자리를 입력해주세요." }, { status: 400 });
    }
    if (!wantedMallName || wantedMallName.length > 150) {
      return NextResponse.json({ ok: false, message: "희망 딜러몰 이름을 입력해주세요." }, { status: 400 });
    }
    if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(wantedSlug) || /^(admin|www)$/i.test(wantedSlug)) {
      return NextResponse.json(
        { ok: false, message: "딜러몰 주소는 영문 소문자, 숫자, 하이픈으로 3~40자 입력해주세요." },
        { status: 400 },
      );
    }
    if (applicationReason.length < 10 || applicationReason.length > 500) {
      return NextResponse.json({ ok: false, message: "신청 내용을 10자 이상 500자 이하로 입력해주세요." }, { status: 400 });
    }
    if (!privacyAgreed || consentDocumentVersion !== DEALER_APPLICATION_CONSENT_VERSION) {
      return NextResponse.json({ ok: false, message: "개인정보 수집·이용에 동의해주세요." }, { status: 400 });
    }

    const businessInfo = [
      `상호/단체명: ${companyName}`,
      businessRegistrationNumber ? `사업자등록번호: ${businessRegistrationNumber}` : "",
      businessType ? `업종/업태: ${businessType}` : "",
      businessAddress ? `사업장 주소: ${businessAddress}` : "",
      `신청 내용: ${applicationReason}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (businessInfo.length > 1000) {
      return NextResponse.json({ ok: false, message: "사업자 정보와 신청 내용을 1,000자 이내로 입력해주세요." }, { status: 400 });
    }

    const result = await healthBoxFetch<{ rtnModel?: number }>("/health-box/public/dealer-applications", {
      method: "POST",
      body: {
        applicantName,
        phone,
        email,
        businessInfo,
        wantedMallName,
        wantedSlug,
        privacyAgreed,
        consentDocumentVersion,
      },
    });

    return NextResponse.json({
      ok: true,
      applicationId: Number(result?.rtnModel || 0) || undefined,
      message: "딜러 신청이 접수되었습니다.",
    });
  } catch (error) {
    const message = publicErrorMessage(errorMessage(error));
    const status = /사용 중|승인 대기/.test(message) ? 409 : errorStatus(error);
    return NextResponse.json(
      { ok: false, message },
      { status },
    );
  }
}
