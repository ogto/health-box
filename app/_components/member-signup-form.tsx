"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phoneCheck, setPhoneCheck] = useState<DuplicateCheckState>({ message: "", status: "idle" });
  const [emailCheck, setEmailCheck] = useState<DuplicateCheckState>({ message: "", status: "idle" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          password,
          hqMall,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        router.replace(`/login?next=${encodeURIComponent(safeNextPath)}&signup=success`);
        router.refresh();
        return;
      }

      setError(data?.message || "회원가입 신청에 실패했습니다.");
    } catch {
      setError("회원가입 신청 중 오류가 발생했습니다.");
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
            ? "본사몰 구매 회원가입을 신청합니다."
            : dealerName
              ? `${dealerName} 딜러몰 회원가입 신청`
              : "구매 회원가입 신청"}
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

        <div className="member-auth-alert is-muted">
          {hqMall
            ? "승인 후 본사몰에서 로그인할 수 있습니다."
            : "승인 후 로그인할 때는 가입한 이메일을 사용합니다."}
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

        {error ? <div className="member-auth-alert is-error">{error}</div> : null}

        <div className="member-auth-actions">
          <button className="button-primary" disabled={loading} onClick={() => void handleSubmit()} type="button">
            {loading ? "접수 중..." : "가입 신청"}
          </button>
          <Link className="button-secondary" href={`/login?next=${encodeURIComponent(safeNextPath)}`}>
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
