"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BUYER_SIGNUP_CONSENT_VERSION } from "@/lib/buyer-consent";

function resolveNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/mypage";
  }

  return nextPath;
}

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isAtLeastFourteen(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  if (
    birthDate.getFullYear() !== birthYear ||
    birthDate.getMonth() !== birthMonth - 1 ||
    birthDate.getDate() !== birthDay
  ) {
    return false;
  }

  const today = new Date();
  const fourteenthBirthday = new Date(birthYear + 14, birthMonth - 1, birthDay);
  return birthDate <= today && fourteenthBirthday <= today;
}

type DuplicateCheckState = {
  message: string;
  status: "idle" | "checking" | "error" | "success";
};

export function MemberSignupForm({
  dealerMallId,
  dealerName,
  dealerSlug,
  hqMall = false,
  nextPath,
}: {
  dealerMallId?: number;
  dealerName?: string;
  dealerSlug?: string;
  hqMall?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const safeNextPath = useMemo(() => resolveNextPath(nextPath), [nextPath]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [thirdPartyAgreed, setThirdPartyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [phoneCheck, setPhoneCheck] = useState<DuplicateCheckState>({ message: "", status: "idle" });
  const [emailCheck, setEmailCheck] = useState<DuplicateCheckState>({ message: "", status: "idle" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const allAgreed = termsAgreed && privacyAgreed && thirdPartyAgreed && marketingAgreed;

  function setAllAgreements(checked: boolean) {
    setTermsAgreed(checked);
    setPrivacyAgreed(checked);
    setThirdPartyAgreed(checked);
    setMarketingAgreed(checked);
  }

  async function checkDuplicate(type: "email" | "phone") {
    const value = type === "email" ? email.trim() : phone;
    const setCheck = type === "email" ? setEmailCheck : setPhoneCheck;
    const emptyMessage = type === "email" ? "이메일을 입력해주세요." : "휴대폰 번호를 입력해주세요.";

    if (!value.trim()) {
      setCheck({ message: emptyMessage, status: "error" });
      return;
    }

    setCheck({ message: "확인 중...", status: "checking" });

    try {
      const response = await fetch("/api/member/signup/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          dealerMallId: hqMall ? undefined : dealerMallId,
          dealerSlug: hqMall ? undefined : dealerSlug,
          hqMall,
          type,
          value,
        }),
      });
      const data = await response.json();

      if (response.ok && data.ok && data.available) {
        setCheck({ message: data.message || "사용 가능합니다.", status: "success" });
        return;
      }

      setCheck({ message: data?.message || "이미 사용 중입니다.", status: "error" });
    } catch {
      setCheck({ message: "중복확인 중 오류가 발생했습니다.", status: "error" });
    }
  }

  async function handleSubmit() {
    setError("");

    if (!password || password.length < 8) {
      setError("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!birthDate) {
      setError("생년월일을 입력해주세요.");
      return;
    }

    if (!isAtLeastFourteen(birthDate)) {
      setError("만 14세 미만은 회원가입할 수 없습니다.");
      return;
    }

    if (!termsAgreed || !privacyAgreed || !thirdPartyAgreed) {
      setError("필수 약관과 개인정보 동의 항목에 동의해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          dealerMallId: hqMall ? undefined : dealerMallId,
          dealerSlug: hqMall ? undefined : dealerSlug,
          name,
          phone,
          email,
          birthDate,
          password,
          termsAgreed,
          privacyAgreed,
          thirdPartyAgreed,
          marketingAgreed,
          consentDocumentVersion: BUYER_SIGNUP_CONSENT_VERSION,
          hqMall,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        router.replace(`/login?next=${encodeURIComponent(safeNextPath)}&signup=success`);
        router.refresh();
        return;
      }

      setError(data?.message || "회원가입에 실패했습니다.");
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="member-auth-card content-panel">
      <div className="member-auth-head">
        <h1 className="section-panel-title">회원가입</h1>
        <p className="member-auth-copy">
          {hqMall
            ? "본사몰 구매 회원으로 가입합니다."
            : dealerName
              ? `${dealerName} 딜러몰 회원가입`
              : "구매 회원가입"}
        </p>
      </div>

      <div className="member-auth-form">
        <label className="member-auth-field">
          <span>이름</span>
          <input
            className="member-auth-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="이름 입력"
            type="text"
            value={name}
          />
        </label>

        <label className="member-auth-field">
          <span>휴대폰 번호</span>
          <div className="member-auth-check-control">
            <input
              className="member-auth-input"
              inputMode="numeric"
              onChange={(event) => {
                setPhone(formatPhone(event.target.value));
                setPhoneCheck({ message: "", status: "idle" });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
              placeholder="010-0000-0000"
              type="tel"
              value={phone}
            />
            <button
              className="button-secondary member-auth-check-button"
              disabled={phoneCheck.status === "checking"}
              onClick={() => void checkDuplicate("phone")}
              type="button"
            >
              중복확인
            </button>
          </div>
          {phoneCheck.message ? (
            <p className={`member-auth-check-message is-${phoneCheck.status === "success" ? "success" : phoneCheck.status === "checking" ? "muted" : "error"}`}>
              {phoneCheck.message}
            </p>
          ) : null}
        </label>

        <label className="member-auth-field">
          <span>이메일</span>
          <div className="member-auth-check-control">
            <input
              className="member-auth-input"
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailCheck({ message: "", status: "idle" });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
              placeholder="이메일 입력"
              required
              type="email"
              value={email}
            />
            <button
              className="button-secondary member-auth-check-button"
              disabled={emailCheck.status === "checking"}
              onClick={() => void checkDuplicate("email")}
              type="button"
            >
              중복확인
            </button>
          </div>
          {emailCheck.message ? (
            <p className={`member-auth-check-message is-${emailCheck.status === "success" ? "success" : emailCheck.status === "checking" ? "muted" : "error"}`}>
              {emailCheck.message}
            </p>
          ) : null}
        </label>

        <label className="member-auth-field">
          <span>생년월일</span>
          <input
            className="member-auth-input"
            onChange={(event) => setBirthDate(event.target.value)}
            required
            type="date"
            value={birthDate}
          />
          <small className="member-auth-field-help">연령 확인에만 사용하며, 만 14세 이상만 가입할 수 있습니다.</small>
        </label>

        <div className="member-auth-alert is-muted">
          가입이 완료되면 입력한 이메일 또는 휴대폰 번호로 바로 로그인할 수 있습니다.
        </div>

        <label className="member-auth-field">
          <span>비밀번호</span>
          <input
            className="member-auth-input"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상 입력"
            type="password"
            value={password}
          />
        </label>

        <label className="member-auth-field">
          <span>비밀번호 확인</span>
          <input
            className="member-auth-input"
            onChange={(event) => setPasswordConfirm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
            placeholder="비밀번호 다시 입력"
            type="password"
            value={passwordConfirm}
          />
        </label>

        <fieldset className="member-consent-section">
          <legend>약관 및 개인정보 동의</legend>

          <div className="member-consent-group">
            <label className="member-consent-all">
              <input
                checked={allAgreed}
                onChange={(event) => setAllAgreements(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>전체 동의</strong>
                <small>필수 및 선택 항목을 모두 포함합니다.</small>
              </span>
            </label>

            <div className="member-consent-list">
              <label className="member-consent-row">
                <input
                  checked={termsAgreed}
                  onChange={(event) => setTermsAgreed(event.target.checked)}
                  type="checkbox"
                />
                <span><b>필수</b> 건강창고 딜러몰 이용약관에 동의합니다.</span>
              </label>

              <div className="member-consent-item">
                <label className="member-consent-row">
                  <input
                    checked={privacyAgreed}
                    onChange={(event) => setPrivacyAgreed(event.target.checked)}
                    type="checkbox"
                  />
                  <span><b>필수</b> 개인정보 수집·이용 동의</span>
                </label>
                <details className="member-consent-details">
                  <summary>내용보기</summary>
                  <div>
                    <p>「개인정보 보호법」 제15조에 따라 아래와 같이 개인정보를 수집·이용합니다.</p>
                    <ul>
                      <li><strong>수집 항목:</strong> 이름, 휴대전화번호, 이메일, 생년월일(연령 확인용)</li>
                      <li><strong>수집 목적:</strong> 회원 가입 및 관리, 서비스 제공, 본인 확인, 고객 문의 응대</li>
                      <li><strong>보유 기간:</strong> 회원 탈퇴 시까지(단, 관련 법령에 따라 보존이 필요한 경우 해당 기간까지)</li>
                    </ul>
                    <p>위 개인정보 수집·이용에 동의하십니까?</p>
                    <p className="member-consent-note">동의를 거부하실 수 있으나, 거부 시 회원가입이 제한됩니다.</p>
                  </div>
                </details>
              </div>

              <div className="member-consent-item">
                <label className="member-consent-row">
                  <input
                    checked={thirdPartyAgreed}
                    onChange={(event) => setThirdPartyAgreed(event.target.checked)}
                    type="checkbox"
                  />
                  <span><b>필수</b> 개인정보 제3자 제공 동의</span>
                </label>
                <details className="member-consent-details">
                  <summary>내용보기</summary>
                  <div>
                    <ul>
                      <li><strong>제공받는 자:</strong> 결제대행사(예: 토스페이먼츠), 배송업체</li>
                      <li><strong>제공 항목:</strong> 이름, 연락처, 배송지 주소</li>
                      <li><strong>제공 목적:</strong> 결제 처리 및 상품 배송</li>
                      <li><strong>보유·이용 기간:</strong> 결제·배송 완료 후 즉시 파기(단, 전자상거래법상 보존 의무 기간 제외)</li>
                    </ul>
                    <p>위 제3자 제공에 동의하십니까?</p>
                  </div>
                </details>
              </div>

              <div className="member-consent-item">
                <label className="member-consent-row">
                  <input
                    checked={marketingAgreed}
                    onChange={(event) => setMarketingAgreed(event.target.checked)}
                    type="checkbox"
                  />
                  <span><b className="is-optional">선택</b> 마케팅 정보 수신 동의</span>
                </label>
                <details className="member-consent-details">
                  <summary>내용보기</summary>
                  <div>
                    <p>신제품 소식, 이벤트, 할인 혜택 등의 정보를 SMS·이메일·앱 푸시로 받아보시겠습니까?</p>
                    <p className="member-consent-note">동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <p className="member-consent-age-notice">
            본 서비스는 만 14세 이상만 회원가입이 가능합니다. 만 14세 미만은 법정대리인의 동의 없이 가입할 수 없습니다.
          </p>
        </fieldset>

        {error ? <div className="member-auth-alert is-error">{error}</div> : null}

        <div className="member-auth-actions">
          <button className="button-primary" disabled={loading} onClick={() => void handleSubmit()} type="button">
            {loading ? "가입 중..." : "회원가입"}
          </button>
          <Link className="button-secondary" href={`/login?next=${encodeURIComponent(safeNextPath)}`}>
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
