"use client";

export function AdminComingSoonButton({ children }: { children: string }) {
  return (
    <button className="admin-coming-soon-button" onClick={() => alert("준비중입니다.")} type="button">
      {children}
    </button>
  );
}
