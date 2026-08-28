"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import {
  DEALER_APPLICATION_CONSENT_VERSION,
  DEALER_APPLICATION_PRIVACY_SUMMARY,
} from "@/lib/dealer-application-consent";

type DealerApplicationResponse = {
  applicationId?: number;
  message?: string;
  ok?: boolean;
};

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function DealerApplicationForm() {
  const [wantedSlug, setWantedSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedApplicationId, setSubmittedApplicationId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/dealer-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: formValue(formData, "applicantName"),
          phone: formValue(formData, "phone"),
          email: formValue(formData, "email"),
          companyName: formValue(formData, "companyName"),
          businessRegistrationNumber: formValue(formData, "businessRegistrationNumber"),
          businessType: formValue(formData, "businessType"),
          businessAddress: formValue(formData, "businessAddress"),
          applicationReason: formValue(formData, "applicationReason"),
          wantedMallName: formValue(formData, "wantedMallName"),
          wantedSlug,
          privacyAgreed: formData.get("privacyAgreed") === "on",
          consentDocumentVersion: DEALER_APPLICATION_CONSENT_VERSION,
          website: formValue(formData, "website"),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as DealerApplicationResponse;

      if (!response.ok || !data.ok) {
        setError(data.message || "딜러 신청을 접수하지 못했습니다.");
        return;
      }

      setSubmittedApplicationId(Number(data.applicationId || 0) || null);
      setSubmitted(true);
      form.reset();
      setWantedSlug("");
    } catch {
      setError("딜러 신청 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="dealer-application-success" role="status">
        <span className="dealer-application-success-icon" aria-hidden="true">✓</span>
        <h1>딜러 신청이 접수되었습니다.</h1>
        <p>
          담당자가 사업자 정보와 운영 계획을 확인한 뒤 입력하신 연락처로 결과를 안내드립니다.
          승인되면 희망하신 주소로 딜러몰이 생성됩니다.
        </p>
        {submittedApplicationId ? (
          <strong className="dealer-application-receipt">접수번호 #{submittedApplicationId}</strong>
        ) : null}
        <div className="dealer-application-success-actions">
          <Link className="button-primary" href="/">본사몰로 돌아가기</Link>
          <button className="button-secondary" onClick={() => setSubmitted(false)} type="button">
            새 신청 작성
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dealer-application-card">
      <div className="dealer-application-head">
        <h1>건강창고 딜러 신청</h1>
        <p>건강창고 상품을 판매할 전용 딜러몰 운영을 신청해주세요. 본사 검토와 승인 후 딜러몰이 개설됩니다.</p>
        <div className="dealer-application-process" aria-label="딜러 신청 절차">
          <span><b>1</b> 신청서 접수</span>
          <i aria-hidden="true" />
          <span><b>2</b> 본사 검토</span>
          <i aria-hidden="true" />
          <span><b>3</b> 승인 및 개설</span>
        </div>
      </div>

      <form className="dealer-application-form" onSubmit={handleSubmit}>
        <input
          aria-hidden="true"
          autoComplete="off"
          className="dealer-application-honeypot"
          name="website"
          tabIndex={-1}
          type="text"
        />

        <fieldset className="dealer-application-section">
          <legend>
            <span>01</span>
            신청자 정보
          </legend>
          <div className="dealer-application-grid two">
            <label className="dealer-application-field">
              <span>신청자 이름 <b>필수</b></span>
              <input autoComplete="name" maxLength={100} name="applicantName" placeholder="홍길동" required type="text" />
            </label>
            <label className="dealer-application-field">
              <span>휴대폰 번호 <b>필수</b></span>
              <input autoComplete="tel" inputMode="tel" maxLength={14} name="phone" placeholder="010-0000-0000" required type="tel" />
            </label>
            <label className="dealer-application-field span-two">
              <span>이메일 <b>필수</b></span>
              <input autoComplete="email" maxLength={150} name="email" placeholder="dealer@example.com" required type="email" />
              <small>승인 결과와 향후 딜러 운영 안내를 받을 이메일입니다.</small>
            </label>
          </div>
        </fieldset>

        <fieldset className="dealer-application-section">
          <legend>
            <span>02</span>
            사업자 정보
          </legend>
          <div className="dealer-application-grid two">
            <label className="dealer-application-field">
              <span>상호 또는 단체명 <b>필수</b></span>
              <input maxLength={150} name="companyName" placeholder="건강파트너" required type="text" />
            </label>
            <label className="dealer-application-field">
              <span>사업자등록번호</span>
              <input inputMode="numeric" maxLength={12} name="businessRegistrationNumber" placeholder="선택 입력" type="text" />
            </label>
            <label className="dealer-application-field">
              <span>업종 / 업태</span>
              <input maxLength={100} name="businessType" placeholder="도소매 / 건강식품" type="text" />
            </label>
            <label className="dealer-application-field">
              <span>사업장 주소</span>
              <input maxLength={200} name="businessAddress" placeholder="시·군·구까지 입력" type="text" />
            </label>
          </div>
        </fieldset>

        <fieldset className="dealer-application-section">
          <legend>
            <span>03</span>
            딜러몰 정보
          </legend>
          <div className="dealer-application-grid two">
            <label className="dealer-application-field">
              <span>희망 딜러몰 이름 <b>필수</b></span>
              <input maxLength={150} name="wantedMallName" placeholder="건강파트너몰" required type="text" />
            </label>
            <label className="dealer-application-field">
              <span>희망 딜러몰 주소 <b>필수</b></span>
              <div className="dealer-application-domain-field">
                <input
                  autoCapitalize="none"
                  maxLength={40}
                  minLength={3}
                  name="wantedSlug"
                  onChange={(event) => {
                    setWantedSlug(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-{2,}/g, "-"),
                    );
                  }}
                  pattern="[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])"
                  placeholder="my-store"
                  required
                  type="text"
                  value={wantedSlug}
                />
                <span>.everybuy.co.kr</span>
              </div>
              <small>영문 소문자, 숫자, 하이픈만 3~40자로 입력할 수 있습니다.</small>
            </label>
            <label className="dealer-application-field span-two">
              <span>신청 내용 및 운영 계획 <b>필수</b></span>
              <textarea
                maxLength={500}
                minLength={10}
                name="applicationReason"
                placeholder="판매 예정 채널, 주요 고객층, 딜러몰 운영 계획 등을 입력해주세요."
                required
                rows={6}
              />
            </label>
          </div>
        </fieldset>

        <div className="dealer-application-consent">
          <label>
            <input name="privacyAgreed" required type="checkbox" />
            <span>
              <b>필수</b>
              <span className="dealer-application-consent-copy">개인정보 수집·이용에 동의합니다.</span>
            </span>
          </label>
          <details>
            <summary>내용보기</summary>
            <div>
              <p>{DEALER_APPLICATION_PRIVACY_SUMMARY}</p>
              <ul>
                <li><strong>수집 항목:</strong> 신청자 이름, 휴대폰 번호, 이메일, 사업자 정보, 신청 내용</li>
                <li><strong>이용 목적:</strong> 딜러 신청 접수·심사, 본인 및 사업자 확인, 결과 안내</li>
                <li><strong>보유 기간:</strong> 신청 철회 또는 목적 달성 후 지체 없이 파기하며, 관계 법령상 보존 의무가 있는 경우 해당 기간까지 보관</li>
              </ul>
              <p>동의를 거부할 수 있으나, 거부 시 딜러 신청이 제한됩니다.</p>
            </div>
          </details>
        </div>

        {error ? <div className="member-auth-alert is-error" role="alert">{error}</div> : null}

        <button className="button-primary dealer-application-submit" disabled={loading} type="submit">
          {loading ? "신청 접수 중..." : "딜러 신청하기"}
        </button>
        <p className="dealer-application-submit-note">접수 후 본사 검토 과정에서 추가 서류를 요청할 수 있습니다.</p>
      </form>
    </div>
  );
}
