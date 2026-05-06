"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MemberProfileForm({
  email,
  name,
  phone,
}: {
  email?: string;
  name?: string;
  phone?: string;
}) {
  const router = useRouter();
  const [formName, setFormName] = useState(name || "");
  const [formPhone, setFormPhone] = useState(phone || "");
  const [formEmail, setFormEmail] = useState(email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setMessage("");
    setError("");

    if (!formName.trim() || !formPhone.trim() || !formEmail.trim()) {
      setError("이름, 휴대폰 번호, 이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/member/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail,
        }),
      });
      const data = await response.json();

      if (response.ok && data.ok) {
        setMessage(data.message || "회원정보가 수정되었습니다.");
        router.refresh();
        return;
      }

      setError(data?.message || "회원정보 수정에 실패했습니다.");
    } catch {
      setError("회원정보 수정 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="member-profile-form">
      <label className="member-auth-field">
        <span>이름</span>
        <input
          className="member-auth-input"
          onChange={(event) => setFormName(event.target.value)}
          type="text"
          value={formName}
        />
      </label>
      <label className="member-auth-field">
        <span>휴대폰</span>
        <input
          className="member-auth-input"
          inputMode="tel"
          onChange={(event) => setFormPhone(event.target.value)}
          type="tel"
          value={formPhone}
        />
      </label>
      <label className="member-auth-field">
        <span>이메일</span>
        <input
          className="member-auth-input"
          onChange={(event) => setFormEmail(event.target.value)}
          type="email"
          value={formEmail}
        />
      </label>

      {message ? <div className="member-auth-alert is-success">{message}</div> : null}
      {error ? <div className="member-auth-alert is-error">{error}</div> : null}

      <button className="button-primary full-width-button" disabled={loading} onClick={() => void handleSubmit()} type="button">
        {loading ? "저장 중..." : "회원정보 저장"}
      </button>
    </div>
  );
}
