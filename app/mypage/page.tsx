import Link from "next/link";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { storefrontConfig } from "../_lib/storefront-config";

const orderItems = [
  {
    number: "HB240422-0012",
    title: "데일리 멀티비타민 코어 외 1건",
    status: "배송 준비중",
    date: "2026.04.22",
  },
  {
    number: "HB240419-0047",
    title: "유산균 밸런스 박스",
    status: "배송 완료",
    date: "2026.04.19",
  },
  {
    number: "HB240414-0025",
    title: "오메가 · 루테인 더블 케어",
    status: "구매 확정",
    date: "2026.04.14",
  },
] as const;

const stats = [
  { label: "진행중 주문", value: "2" },
  { label: "배송 완료", value: "18" },
  { label: "보유 쿠폰", value: "3" },
  { label: "적립 예정", value: "12,400P" },
] as const;

export default function MyPage() {
  const { brand } = storefrontConfig;

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
              <h2>{brand.memberLabel}님</h2>
              <p>회원 승인 완료 · 회원 전용가 이용 가능</p>
            </div>

            <nav className="account-menu">
              <Link className="is-active" href="/mypage">
                주문/배송 조회
              </Link>
              <Link href="/cart">장바구니</Link>
              <Link href="/notice/membership-price-policy">공지사항</Link>
              <Link href="/">메인으로 돌아가기</Link>
            </nav>
          </aside>

          <div className="account-main">
            <div className="stats-grid">
              {stats.map((stat) => (
                <div className="stats-card" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="dashboard-grid">
              <section className="content-panel">
                <p className="section-kicker">최근 주문</p>
                <h3 className="section-panel-title">주문 / 배송 현황</h3>
                <div className="line-list">
                  {orderItems.map((item) => (
                    <div className="line-row" key={item.number}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>
                          주문번호 {item.number} · {item.date}
                        </p>
                      </div>
                      <span className="detail-chip primary">{item.status}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="content-panel">
                <p className="section-kicker">회원 정보</p>
                <h3 className="section-panel-title">등급 및 혜택</h3>
                <div className="info-panel compact">
                  <div className="info-row">
                    <strong>회원 상태</strong>
                    <span>승인 완료</span>
                  </div>
                  <div className="info-row">
                    <strong>회원 전용가</strong>
                    <span>전 상품 열람 가능</span>
                  </div>
                  <div className="info-row">
                    <strong>정기배송</strong>
                    <span>일부 상품군 이용 가능</span>
                  </div>
                </div>
              </section>

              <section className="content-panel span-two">
                <p className="section-kicker">기본 배송지</p>
                <h3 className="section-panel-title">배송 / 정산 정보</h3>
                <div className="info-panel compact">
                  <div className="info-row">
                    <strong>수령인</strong>
                    <span>{brand.memberLabel}</span>
                  </div>
                  <div className="info-row">
                    <strong>주소</strong>
                    <span>서울시 강남구 테헤란로 100, 10층</span>
                  </div>
                  <div className="info-row">
                    <strong>연락처</strong>
                    <span>010-1234-5678</span>
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
