"use client";

import Link from "next/link";
import { useState, type ReactNode, type SVGProps } from "react";

import { BrandLogo } from "../brand-logo";
import { AdminMobileSidebar, AdminSidebar } from "./admin-sidebar";
import { AdminToastViewport } from "./admin-toast";

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
              aria-label="관리자 메뉴 열기"
              className="admin-mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
            >
              <MenuIcon />
            </button>

            <Link className="admin-mobile-brand" href="/admin/dashboard">
              <BrandLogo
                alt="건강창고 관리자 로고"
                className="admin-sidebar-brand-mark"
                variant="square"
              />
              <div>
                <p>HEALTH-BOX ADMIN</p>
                <strong>건강창고 관리자</strong>
              </div>
            </Link>

            <Link aria-label="쇼핑몰 이동" className="admin-mobile-home-link" href="/">
              <StoreIcon />
            </Link>
          </div>

          <div className="admin-content">{children}</div>
          <AdminToastViewport />
        </main>
      </div>
    </div>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Zm0 0 1.8-4h12.4L20 9M9 13h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
