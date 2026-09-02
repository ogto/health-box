"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  DEALER_APPLICATION_CONSENT_VERSION,
  DEALER_APPLICATION_PRIVACY_SUMMARY,
} from "@/lib/dealer-application-consent";
import {
  DEALER_CONTRACT_PAGE_COUNT,
  DEALER_CONTRACT_PRINT_MESSAGE,
  DEALER_CONTRACT_PRINT_URL,
  DEALER_CONTRACT_TITLE,
  DEALER_CONTRACT_VERSION,
} from "@/lib/dealer-contract";

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
  const [contractPrintRequested, setContractPrintRequested] = useState(false);
  const [contractPrintConfirmed, setContractPrintConfirmed] = useState(false);
  const contractWindow = useRef<Window | null>(null);
  const contractRequestId = useRef("");
  const contractReady = contractPrintRequested && contractPrintConfirmed;

  useEffect(() => {
    function handleContractPrint(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== contractWindow.current) return;
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type !== DEALER_CONTRACT_PRINT_MESSAGE
        || event.data.version !== DEALER_CONTRACT_VERSION
        || !contractRequestId.current
        || event.data.requestId !== contractRequestId.current) return;
      setContractPrintRequested(true);
    }
    window.addEventListener("message", handleContractPrint);
    return () => window.removeEventListener("message", handleContractPrint);
  }, []);

  function openContract() {
    setError("");
    try {
      const requestId = window.crypto.randomUUID();
      // Keep an opener only for this same-origin print page; messages are source/token checked.
      const printWindow = window.open(`${DEALER_CONTRACT_PRINT_URL}#${requestId}`, "_blank");
      if (!printWindow) {
        setError("계약서 인쇄창이 차단되었습니다. 브라우저의 팝업을 허용한 뒤 다시 눌러주세요.");
        return;
      }
      contractWindow.current = printWindow;
      contractRequestId.current = requestId;
      setContractPrintRequested(false);
      setContractPrintConfirmed(false);
    } catch {
      setError("계약서 인쇄창을 열지 못했습니다. 인쇄 가능한 브라우저 또는 PC에서 다시 시도해주세요.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!contractReady) {
      setError("계약서를 인쇄한 뒤 출력 완료와 후속 제출 절차를 확인해주세요.");
      return;
    }
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
      setContractPrintRequested(false);
      setContractPrintConfirmed(false);
      contractWindow.current = null;
      contractRequestId.current = "";
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
          본사에서 신청 내용을 검토한 뒤 입력하신 연락처로 계약서 작성·날인과 제출 방법을 안내드립니다.
          날인한 사본 사진으로 사전 승인을 진행한 후 원본을 우편으로 교환합니다.
        </p>
        <p>계약서 원본은 2부를 작성해 본사와 딜러가 각 1부씩 보관합니다. 딜러몰 개설 일정은 담당자가 별도로 안내드립니다.</p>
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
        <p>계약서를 먼저 확인·출력한 뒤 딜러몰 운영을 신청해주세요. 본사 검토 후 날인본 확인과 원본 교환 절차를 안내드립니다.</p>
        <div className="dealer-application-process" aria-label="딜러 신청 절차">
          <span><b>1</b> 신청서 접수</span>
          <i aria-hidden="true" />
          <span><b>2</b> 본사 검토</span>
          <i aria-hidden="true" />
          <span><b>3</b> 날인본 확인·사전 승인</span>
          <i aria-hidden="true" />
          <span><b>4</b> 원본 우편 교환</span>
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

        <fieldset className="dealer-application-section dealer-contract-section">
          <legend><span>04</span> 딜러 계약서 확인·출력</legend>
          <p className="dealer-contract-intro">신청 전 계약서 전체를 확인하고 출력해주세요. 신청 접수만으로 딜러 승인이나 계약 체결이 완료되는 것은 아닙니다.</p>
          <div className="dealer-contract-file">
            <div>
              <span className="dealer-contract-file-tag">PDF · {DEALER_CONTRACT_VERSION} · A4 {DEALER_CONTRACT_PAGE_COUNT}쪽</span>
              <strong>{DEALER_CONTRACT_TITLE}</strong>
              <p>새 창에서 계약서 원문을 확인한 뒤 ‘계약서 {DEALER_CONTRACT_PAGE_COUNT}쪽 인쇄’를 눌러주세요.</p>
            </div>
            <button className="button-primary" disabled={loading} onClick={openContract} type="button">계약서 확인·인쇄</button>
          </div>
          <ol className="dealer-contract-steps">
            <li><span>1</span><div><strong>본사 검토 및 제출 안내</strong><p>신청 내용을 검토한 뒤 담당자가 계약서 작성 방법과 사진 제출처, 우편 수령처를 안내합니다.</p></div></li>
            <li><span>2</span><div><strong>날인한 사본 사진 제출·사전 승인</strong><p>안내에 따라 계약서를 작성·날인하고, 글자와 날인이 선명하게 보이도록 촬영한 사진을 보내주세요.</p></div></li>
            <li><span>3</span><div><strong>원본 우편 교환</strong><p>사전 승인 후 계약서 원본 2부를 작성·날인하여 우편으로 교환하고, 본사와 딜러가 각 1부씩 보관합니다.</p></div></li>
          </ol>
          <div className="dealer-contract-confirmation">
            <label>
              <input
                aria-describedby="dealer-contract-print-note"
                checked={contractPrintConfirmed}
                disabled={!contractPrintRequested || loading}
                onChange={(event) => setContractPrintConfirmed(event.target.checked)}
                required
                type="checkbox"
              />
              <span><b>필수</b> 계약서 출력을 완료했으며, 본사 검토 후 날인본 사진 제출과 원본 우편 교환 절차를 확인했습니다.</span>
            </label>
            <p id="dealer-contract-print-note" role="status">
              {contractPrintRequested
                ? "실제 출력 여부는 자동 확인할 수 없습니다. 인쇄를 취소했다면 다시 출력한 후 체크해주세요."
                : "계약서 인쇄 화면에서 인쇄를 진행하면 출력 완료 확인란이 활성화됩니다."}
            </p>
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

        <button className="button-primary dealer-application-submit" disabled={loading || !contractReady} type="submit">
          {loading ? "신청 접수 중..." : "딜러 신청하기"}
        </button>
        <p className="dealer-application-submit-note">계약서 출력 완료를 확인해야 신청할 수 있습니다. 날인본 사진과 원본은 본사 안내에 따라 별도로 제출해주세요.</p>
      </form>
    </div>
  );
}
