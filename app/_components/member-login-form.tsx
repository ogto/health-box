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

export function MemberLoginForm({
  dealerMallId,
  dealerName,
  dealerSlug,
  host,
  hqMall = false,
  nextPath,
  signupSuccess = false,
  passwordResetSuccess = false,
}: {
  dealerMallId?: number;
  dealerName?: string;
  dealerSlug?: string;
  host?: string;
  hqMall?: boolean;
  nextPath?: string;
  signupSuccess?: boolean;
  passwordResetSuccess?: boolean;
}) {
  const router = useRouter();
  const safeNextPath = useMemo(() => resolveNextPath(nextPath), [nextPath]);

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          dealerMallId: hqMall ? undefined : dealerMallId,
          dealerSlug: hqMall ? undefined : dealerSlug,
          host,
          hqMall,
          loginId,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        router.replace(safeNextPath);
        router.refresh();
        return;
      }

      setError(data?.message || "로그인에 실패했습니다.");
    } catch {
      setError("로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="member-auth-card content-panel">
      <div className="member-auth-head">
        <h1 className="section-panel-title">회원 로그인</h1>
        <p className="member-auth-copy">
          {hqMall
            ? "승인된 구매 회원은 본사몰에 로그인할 수 있습니다."
            : dealerName
              ? `${dealerName} 회원만 로그인할 수 있습니다.`
              : "승인된 회원만 로그인할 수 있습니다."}
        </p>
      </div>

      {signupSuccess ? (
        <div className="member-auth-alert is-success">
          가입 신청이 접수되었습니다. 승인 후 같은 정보로 로그인해주세요.
        </div>
      ) : null}

      {passwordResetSuccess ? (
        <div className="member-auth-alert is-success">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.</div>
      ) : null}

      <div className="member-auth-form">
        <label className="member-auth-field">
          <span>이메일 또는 휴대폰 번호</span>
          <input
            className="member-auth-input"
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="가입한 이메일 또는 휴대폰 번호"
            type="text"
            value={loginId}
          />
        </label>

        <label className="member-auth-field">
          <span>비밀번호</span>
          <input
            className="member-auth-input"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSubmit();
              }
            }}
            placeholder="비밀번호 입력"
            type="password"
            value={password}
          />
        </label>

        {error ? <div className="member-auth-alert is-error">{error}</div> : null}

        <div className="member-auth-actions">
          <button className="button-primary" disabled={loading} onClick={() => void handleSubmit()} type="button">
            {loading ? "확인 중..." : "로그인"}
          </button>
          <Link className="button-secondary" href={`/signup?next=${encodeURIComponent(safeNextPath)}`}>
            회원가입
          </Link>
        </div>

        <div className="member-auth-helper-actions">
          <Link href={`/password-reset?next=${encodeURIComponent(safeNextPath)}`}>비밀번호 찾기</Link>
        </div>
      </div>
    </div>
  );
}
