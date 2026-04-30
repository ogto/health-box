"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

import { BrandLogo } from "../brand-logo";
import { AdminLogoutButton } from "./admin-logout-button";

const navItems = [
  { href: "/admin/dashboard", label: "대시보드", icon: DashboardIcon },
  { href: "/admin/storefront", label: "홈페이지", icon: StorefrontIcon },
  { href: "/admin/products", label: "상품", icon: ProductIcon },
  { href: "/admin/categories", label: "카테고리", icon: CategoryIcon },
  { href: "/admin/orders", label: "주문", icon: OrderIcon },
  { href: "/admin/sales", label: "매출/정산", icon: SalesIcon },
  { href: "/admin/members", label: "회원", icon: MemberIcon },
  { href: "/admin/notices", label: "공지", icon: NoticeIcon },
  { href: "/admin/dealers", label: "딜러/조직", icon: DealerIcon },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="admin-sidebar-inner">
      <Link className="admin-sidebar-brand" href="/admin/dashboard" onClick={onNavigate}>
        <BrandLogo alt="건강창고 관리자 로고" className="admin-sidebar-brand-mark" variant="square" />
        <div className="admin-sidebar-brand-copy">
          <p className="admin-sidebar-brand-kicker">HEALTH-BOX</p>
          <strong className="admin-sidebar-brand-title">건강창고 관리자</strong>
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
        <div className="admin-sidebar-footer-actions">
          <Link className="admin-sidebar-home-link" href="/" onClick={onNavigate}>
            쇼핑몰
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
          <div className="admin-mobile-sidebar-title">
            <BrandLogo alt="건강창고 관리자 로고" className="admin-sidebar-brand-mark" variant="square" />
            <div>
              <p>HEALTH-BOX ADMIN</p>
              <strong>건강창고 관리자</strong>
            </div>
          </div>

          <button aria-label="관리자 메뉴 닫기" className="admin-mobile-close" onClick={onClose} type="button">
            <CloseIcon />
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

function CategoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 5.5h7v6H4v-6Zm9 0h7v6h-7v-6ZM4 13.5h7v5H4v-5Zm9 0h7v5h-7v-5Z"
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

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
