"use client";

import { dispatchAdminToast } from "./admin-toast";

export function AdminComingSoonButton({ children }: { children: string }) {
  return (
    <button
      className="admin-coming-soon-button"
      onClick={() => dispatchAdminToast(`${children} 기능은 준비 중입니다.`, "info")}
      type="button"
    >
      {children}
    </button>
  );
}
