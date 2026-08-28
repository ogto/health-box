"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import type { SVGProps } from "react";

import { BrandLogo } from "../brand-logo";
import { AdminLogoutButton } from "./admin-logout-button";
import { canAccessAdminPermission, type AdminSession } from "../../_lib/admin-session";

const navGroups = [
  {
    label: "운영",
    items: [
      { href: "/admin/dashboard", label: "대시보드", icon: DashboardIcon, keys: ["", "dashboard"], permission: "DASHBOARD_VIEW" },
      { href: "/admin/orders", label: "주문관리", icon: OrderIcon, keys: ["orders"], permission: "ORDER_VIEW" },
      { href: "/admin/sales", label: "매출/정산", icon: SalesIcon, keys: ["sales", "settlements"], permission: "SALES_VIEW" },
    ],
  },
  {
    label: "상품",
    items: [
      { href: "/admin/products", label: "상품관리", icon: ProductIcon, keys: ["products", "product"], permission: "PRODUCT_VIEW", hqOnly: true },
      { href: "/admin/categories", label: "카테고리", icon: CategoryIcon, keys: ["categories"], permission: "CATEGORY_MANAGE", hqOnly: true },
    ],
  },
  {
    label: "회원·조직",
    items: [
      { href: "/admin/members", label: "회원관리", icon: MemberIcon, keys: ["members"], permission: "MEMBER_VIEW" },
      { href: "/admin/dealers", label: "딜러관리", icon: DealerIcon, keys: ["dealers"], permission: "DEALER_VIEW", hqOnly: true },
      { href: "/admin/staff", label: "직원관리", icon: StaffIcon, keys: ["staff"], permission: "STAFF_MANAGE" },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      {
        href: "/admin/storefront",
        label: "홈페이지관리",
        icon: StorefrontIcon,
        keys: ["storefront", "settings", "operation-settings"],
        permission: "STOREFRONT_MANAGE",
      },
      { href: "/admin/notices", label: "공지관리", icon: NoticeIcon, keys: ["notices", "notice"], permission: "NOTICE_MANAGE" },
    ],
  },
  {
    label: "시스템",
    items: [
      { href: "/admin/logs", label: "로그관리", icon: LogIcon, keys: ["logs"], permission: "AUDIT_LOG_VIEW" },
    ],
  },
] as const;

const dealerReadOnlyLabels: Record<string, string> = {
  "/admin/orders": "주문조회",
  "/admin/members": "회원조회",
  "/admin/staff": "직원조회",
  "/admin/storefront": "홈페이지조회",
  "/admin/notices": "공지조회",
};

function getAdminMenuKeyFromPath(pathname: string | null) {
  const normalizedPath = (pathname || "").split("?")[0].replace(/\/+$/, "");
  const segments = normalizedPath.split("/").filter(Boolean);

  if (segments[0] !== "admin") {
    return "";
  }

  return segments[1] || "";
}

function SidebarContent({ onNavigate, session }: { onNavigate?: () => void; session: AdminSession }) {
  const pathname = usePathname();
  const selectedSegment = useSelectedLayoutSegment();
  const activeMenuKey = selectedSegment || getAdminMenuKeyFromPath(pathname);

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
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            (!("hqOnly" in item) || !item.hqOnly || session.scopeType === "HQ") &&
            canAccessAdminPermission(session, item.permission),
          );
          if (!visibleItems.length) return null;
          return (
          <div aria-label={group.label} className="admin-sidebar-group" key={group.label} role="group">
            <p className="admin-sidebar-group-label">{group.label}</p>
            <div className="admin-sidebar-group-links">
              {visibleItems.map((item) => {
                const active = (item.keys as readonly string[]).includes(activeMenuKey);
                const Icon = item.icon;
                const itemLabel = session.scopeType === "DEALER"
                  ? dealerReadOnlyLabels[item.href] || item.label
                  : item.label;

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`admin-sidebar-link${active ? " is-active" : ""}`}
                    data-active={active ? "true" : undefined}
                    href={item.href}
                    key={item.href}
                    onClick={onNavigate}
                  >
                    <Icon className="admin-sidebar-link-icon" />
                    <span className="admin-sidebar-link-label">{itemLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-session">
          <strong>{session.scopeName}</strong>
          <span>{session.name} · {session.roleType === "OWNER" ? "대표자" : "직원"}</span>
        </div>
        <div className="admin-sidebar-footer-actions">
          <AdminLogoutButton onDone={onNavigate} />
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ session }: { session: AdminSession }) {
  return (
    <aside className="admin-sidebar">
      <SidebarContent session={session} />
    </aside>
  );
}

export function AdminMobileSidebar({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: AdminSession;
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
        <SidebarContent onNavigate={onClose} session={session} />
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

function StaffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a2.75 2.75 0 1 0 0-5.5A2.75 2.75 0 0 0 15.5 10ZM3 20a5.5 5.5 0 0 1 11 0m0-6.5a4.5 4.5 0 0 1 7 3.75V20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function LogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M6 3.5h9l3 3V20H6V3.5Zm9 0v3h3M9 10h6M9 13.5h6M9 17h4"
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
