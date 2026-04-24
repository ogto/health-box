"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MemberLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/member/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button className="button-secondary" disabled={loading} onClick={() => void handleLogout()} type="button">
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
