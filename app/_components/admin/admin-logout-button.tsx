"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton({ onDone }: { onDone?: () => void }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      onDone?.();
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button className="admin-sidebar-logout-button" onClick={() => void handleLogout()} type="button">
      로그아웃
    </button>
  );
}

