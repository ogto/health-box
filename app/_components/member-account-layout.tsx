import Link from "next/link";
import type { ReactNode } from "react";

import type { MemberSession } from "../_lib/member-auth";
import type { StorefrontRuntime } from "../_lib/storefront-runtime";
import { MemberLogoutButton } from "./member-logout-button";

type MemberAccountKey = "addresses" | "cart" | "notice" | "orders" | "profile";

const accountMenu: Array<{ key: MemberAccountKey | "home"; href: string; label: string }> = [
  { key: "orders", href: "/mypage", label: "주문/배송 조회" },
  { key: "profile", href: "/mypage/profile", label: "회원 정보" },
  { key: "addresses", href: "/mypage/addresses", label: "배송지 설정" },
  { key: "cart", href: "/cart", label: "장바구니" },
  { key: "notice", href: "/notice", label: "공지사항" },
  { key: "home", href: "/", label: "메인으로 돌아가기" },
];

export function MemberAccountLayout({
  activeKey,
  children,
  runtime,
  session,
}: {
  activeKey: MemberAccountKey;
  children: ReactNode;
  runtime: StorefrontRuntime;
  session: MemberSession;
}) {
  const dealer = runtime.dealer;
  const brand = runtime.brand;

  return (
    <div className="account-layout">
      <aside className="account-sidebar">
        <div className="account-profile">
          <h2>{session.name || session.loginId || brand.memberLabel}님</h2>
          <p>{dealer ? `${dealer.mallName} 승인 회원` : "승인 회원"}</p>
        </div>

        <nav className="account-menu" aria-label="마이페이지 메뉴">
          {accountMenu.map((item) => (
            <Link aria-current={item.key === activeKey ? "page" : undefined} className={item.key === activeKey ? "is-active" : ""} href={item.href} key={item.key}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="member-auth-inline-action">
          <MemberLogoutButton />
        </div>
      </aside>

      <div className="account-main">{children}</div>
    </div>
  );
}
