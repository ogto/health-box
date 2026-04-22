"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

import { AdminLogoutButton } from "./admin-logout-button";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: DashboardIcon },
  { href: "/admin/storefront", label: "홈페이지관리", icon: StorefrontIcon },
  { href: "/admin/products", label: "상품관리", icon: ProductIcon },
  { href: "/admin/orders", label: "주문관리", icon: OrderIcon },
  { href: "/admin/sales", label: "매출관리", icon: SalesIcon },
  { href: "/admin/members", label: "회원관리", icon: MemberIcon },
  { href: "/admin/notices", label: "공지관리", icon: NoticeIcon },
  { href: "/admin/dealers", label: "딜러/조직", icon: DealerIcon },
  { href: "/admin/settlements", label: "정산관리", icon: SettlementIcon },
  { href: "/admin/operation-settings", label: "운영설정", icon: SettingsIcon },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="admin-sidebar-inner">
      <Link className="admin-sidebar-brand" href="/admin/dashboard" onClick={onNavigate}>
        <div className="admin-sidebar-brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="admin-sidebar-brand-copy">
          <p className="admin-sidebar-brand-kicker">HEALTH-BOX ADMIN</p>
          <strong className="admin-sidebar-brand-title">건강창고 관리자</strong>
          <span className="admin-sidebar-brand-summary">상품 · 주문 · 회원 · 조직 통합 관리</span>
        </div>
      </Link>

      <nav className="admin-sidebar-nav" aria-label="관리자 메뉴">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              className={`admin-sidebar-link${active ? " is-active" : ""}`}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
            >
              <Icon className="admin-sidebar-link-icon" />
              <span className="admin-sidebar-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <p className="admin-sidebar-footer-copy">쇼핑몰과 분리된 관리자 운영 영역입니다.</p>
        <div className="admin-sidebar-footer-actions">
          <Link className="admin-sidebar-home-link" href="/" onClick={onNavigate}>
            쇼핑몰 보기
          </Link>
          <AdminLogoutButton onDone={onNavigate} />
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <SidebarContent />
    </aside>
  );
}

export function AdminMobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="admin-mobile-sidebar-wrap">
      <button
        aria-label="메뉴 닫기"
        className="admin-mobile-sidebar-backdrop"
        onClick={onClose}
        type="button"
      />
      <aside className="admin-mobile-sidebar">
        <div className="admin-mobile-sidebar-head">
          <strong>관리자 메뉴</strong>
          <button className="admin-mobile-close" onClick={onClose} type="button">
            닫기
          </button>
        </div>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 12.5h6v7H4v-7Zm10-8h6v15h-6v-15ZM4 4.5h6v5H4v-5Zm10 8h6v7h-6v-7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ProductIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18m8-13.5-8 4.5-8-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function StorefrontIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 7.5h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11Zm0 0 2-4h12l2 4M9 12h6M9 16h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function OrderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M7 5h10m-10 5h10M7 15h6m6 4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MemberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M16 19a4 4 0 0 0-8 0m11 0a3 3 0 0 0-3-3m-8 3a3 3 0 0 0-3-3m11-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SalesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 19.5h16M7 16l3-3 3 2 4-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M16.5 10H18v1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function NoticeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M6 7.5h12M6 12h12M6 16.5h8M5 3h14a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function DealerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 20v-8h5v8M10 20V6h5v14M16 20v-5h4v5M3 20h18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SettlementIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 4v16m4-12h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5-3.5a7.7 7.7 0 0 0-.08-1l2.08-1.62-2-3.46-2.5 1a8.1 8.1 0 0 0-1.74-1l-.38-2.66H9.12L8.74 5.9c-.62.24-1.2.57-1.74.98l-2.5-1-2 3.46L4.58 11a7.7 7.7 0 0 0 0 2l-2.08 1.62 2 3.46 2.5-1c.54.41 1.12.74 1.74.98l.38 2.66h5.76l.38-2.66c.62-.24 1.2-.57 1.74-.98l2.5 1 2-3.46L19.42 13c.05-.33.08-.66.08-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
