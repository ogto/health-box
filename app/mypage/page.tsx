import Link from "next/link";
import { redirect } from "next/navigation";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { MemberLogoutButton } from "../_components/member-logout-button";
import { getMemberSession } from "../_lib/member-auth";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export default async function MyPage() {
  const [runtime, session] = await Promise.all([getStorefrontRuntime(), getMemberSession()]);
  const { brand, dealer } = runtime;

  if (!session) {
    redirect("/login?next=/mypage");
  }

  const dealerMismatch =
    (dealer?.dealerMallId && session.dealerMallId !== dealer.dealerMallId) ||
    (dealer?.slug && session.dealerSlug && session.dealerSlug !== dealer.slug);

  if (dealerMismatch) {
    redirect("/login?next=/mypage");
  }

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "마이페이지" },
          ]}
        />

        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-profile">
              <p className="section-kicker">Member</p>
              <h2>{session.name || session.loginId || brand.memberLabel}님</h2>
              <p>
                {dealer
                  ? `${dealer.mallName} 승인 회원`
                  : "승인 회원"}
              </p>
            </div>

            <nav className="account-menu">
              <Link className="is-active" href="/mypage">
                주문/배송 조회
              </Link>
              <Link href="/cart">장바구니</Link>
              <Link href="/notice/membership-price-policy">공지사항</Link>
              <Link href="/">메인으로 돌아가기</Link>
            </nav>

            <div className="member-auth-inline-action">
              <MemberLogoutButton />
            </div>
          </aside>

          <div className="account-main">
            <div className="dashboard-grid account-dashboard-grid">
              <section className="content-panel account-orders-panel">
                <p className="section-kicker">주문</p>
                <h3 className="section-panel-title">주문 내역</h3>
                <div className="info-panel compact">
                  <p className="member-auth-empty">아직 주문 내역이 없습니다.</p>
                </div>
              </section>

              <section className="content-panel account-address-panel">
                <p className="section-kicker">회원 정보</p>
                <div className="panel-head">
                  <h3 className="section-panel-title">기본 정보</h3>
                </div>
                <div className="info-panel compact">
                  <div className="info-row">
                    <strong>이름</strong>
                    <span>{session.name}</span>
                  </div>
                  <div className="info-row">
                    <strong>휴대폰</strong>
                    <span>{session.phone || "등록된 연락처가 없습니다."}</span>
                  </div>
                  <div className="info-row">
                    <strong>이메일</strong>
                    <span>{session.email || "등록된 이메일이 없습니다."}</span>
                  </div>
                  <div className="info-row">
                    <strong>소속</strong>
                    <span>{dealer?.mallName || brand.memberLabel}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
