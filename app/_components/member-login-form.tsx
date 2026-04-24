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
  nextPath,
  signupSuccess = false,
}: {
  dealerMallId?: number;
  dealerName?: string;
  dealerSlug?: string;
  nextPath?: string;
  signupSuccess?: boolean;
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
          dealerMallId,
          dealerSlug,
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
        <p className="section-kicker">Member Login</p>
        <h1 className="section-panel-title">회원 로그인</h1>
        <p className="member-auth-copy">
          {dealerName ? `${dealerName} 회원만 로그인할 수 있습니다.` : "승인된 회원만 로그인할 수 있습니다."}
        </p>
      </div>

      {signupSuccess ? (
        <div className="member-auth-alert is-success">
          가입 신청이 접수되었습니다. 승인 후 같은 정보로 로그인해주세요.
        </div>
      ) : null}

      <div className="member-auth-form">
        <label className="member-auth-field">
          <span>아이디</span>
          <input
            className="member-auth-input"
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="아이디 입력"
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
          <Link className="button-secondary" href="/signup">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
