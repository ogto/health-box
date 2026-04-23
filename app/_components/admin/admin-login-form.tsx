"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BrandLogo } from "../brand-logo";

function resolveNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/admin")) {
    return "/admin/dashboard";
  }

  return nextPath;
}

export function AdminLoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const safeNextPath = useMemo(() => resolveNextPath(nextPath), [nextPath]);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setPassword("");
        router.replace(safeNextPath);
        router.refresh();
        return;
      }

      setError(data?.message || "비밀번호가 올바르지 않습니다.");
    } catch {
      setError("로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <BrandLogo
            alt="건강창고 관리자 로고"
            className="admin-sidebar-brand-mark admin-login-brand-mark"
            variant="square"
          />

          <div className="admin-login-brand-copy">
            <p>HEALTH-BOX ADMIN</p>
            <h1>건강창고 관리자</h1>
            <span>운영 화면 접근을 위해 관리자 비밀번호를 입력해주세요.</span>
          </div>
        </div>

        <div className="admin-login-form">
          <label className="admin-field">
            <span>관리자 비밀번호</span>
            <input
              className="admin-input admin-login-input"
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

          {error ? <div className="admin-login-error">{error}</div> : null}

          <button className="admin-button admin-login-button" disabled={loading} onClick={() => void handleSubmit()} type="button">
            {loading ? "확인 중..." : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}
