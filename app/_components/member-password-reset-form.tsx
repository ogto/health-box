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

export function MemberPasswordResetForm({
  dealerMallId,
  dealerName,
  dealerSlug,
  host,
  hqMall = false,
  nextPath,
}: {
  dealerMallId?: number;
  dealerName?: string;
  dealerSlug?: string;
  host?: string;
  hqMall?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const safeNextPath = useMemo(() => resolveNextPath(nextPath), [nextPath]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function buildIdentityPayload() {
    return {
      dealerMallId: hqMall ? undefined : dealerMallId,
      dealerSlug: hqMall ? undefined : dealerSlug,
      host,
      hqMall,
      name,
      phone,
      email,
    };
  }

  async function handleVerify() {
    setError("");

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("이름, 휴대폰 번호, 이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/member/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(buildIdentityPayload()),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setIdentityVerified(true);
        return;
      }

      setError(data?.message || "본인확인에 실패했습니다.");
    } catch {
      setError("본인확인 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");

    if (!identityVerified) {
      setError("먼저 본인확인을 완료해주세요.");
      return;
    }

    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/member/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...buildIdentityPayload(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        router.replace(`/login?passwordReset=success&next=${encodeURIComponent(safeNextPath)}`);
        router.refresh();
        return;
      }

      setError(data?.message || "비밀번호 변경에 실패했습니다.");
    } catch {
      setError("비밀번호 변경 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="member-auth-card content-panel">
      <div className="member-auth-head">
        <h1 className="section-panel-title">비밀번호 찾기</h1>
        <p className="member-auth-copy">
          {hqMall
            ? "본사몰에서 로그인할 구매 회원 정보를 입력해주세요."
            : dealerName
              ? `${dealerName}에 가입된 구매 회원 정보를 입력해주세요.`
              : "가입된 구매 회원 정보를 입력해주세요."}
        </p>
      </div>

      <div className="member-auth-form">
        <label className="member-auth-field">
          <span>이름</span>
          <input
            className="member-auth-input"
            disabled={identityVerified}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름 입력"
            type="text"
            value={name}
          />
        </label>

        <label className="member-auth-field">
          <span>휴대폰 번호</span>
          <input
            className="member-auth-input"
            disabled={identityVerified}
            inputMode="tel"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="010-0000-0000"
            type="tel"
            value={phone}
          />
        </label>

        <label className="member-auth-field">
          <span>이메일</span>
          <input
            className="member-auth-input"
            disabled={identityVerified}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="가입한 이메일"
            type="email"
            value={email}
          />
        </label>

        {identityVerified ? (
          <>
            <div className="member-auth-alert is-success">본인확인이 완료되었습니다. 새 비밀번호를 입력해주세요.</div>

            <label className="member-auth-field">
              <span>새 비밀번호</span>
              <input
                className="member-auth-input"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="8자 이상 입력"
                type="password"
                value={newPassword}
              />
            </label>

            <label className="member-auth-field">
              <span>새 비밀번호 확인</span>
              <input
                className="member-auth-input"
                onChange={(event) => setConfirmPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSubmit();
                  }
                }}
                placeholder="새 비밀번호 다시 입력"
                type="password"
                value={confirmPassword}
              />
            </label>
          </>
        ) : null}

        {error ? <div className="member-auth-alert is-error">{error}</div> : null}

        <div className="member-auth-actions">
          {identityVerified ? (
            <button className="button-primary" disabled={loading} onClick={() => void handleSubmit()} type="button">
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          ) : (
            <button className="button-primary" disabled={loading} onClick={() => void handleVerify()} type="button">
              {loading ? "확인 중..." : "본인확인"}
            </button>
          )}
          <Link className="button-secondary" href={`/login?next=${encodeURIComponent(safeNextPath)}`}>
            로그인으로
          </Link>
        </div>

        {identityVerified ? (
          <div className="member-auth-helper-actions">
            <button
              className="member-auth-text-button"
              onClick={() => {
                setIdentityVerified(false);
                setNewPassword("");
                setConfirmPassword("");
                setError("");
              }}
              type="button"
            >
              정보 다시 입력
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
