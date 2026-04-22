"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { AdminMobileSidebar, AdminSidebar } from "./admin-sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <AdminMobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="admin-frame">
        <AdminSidebar />

        <main className="admin-main">
          <div className="admin-mobile-bar">
            <button
              className="admin-mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
            >
              메뉴
            </button>
            <div className="admin-mobile-brand">
              <p>HEALTH-BOX ADMIN</p>
              <strong>건강창고 관리자</strong>
            </div>
            <Link className="admin-mobile-home-link" href="/">
              쇼핑몰
            </Link>
          </div>

          <div className="admin-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
