import Link from "next/link";
import type { Metadata } from "next";

import { Breadcrumbs, StoreShell } from "../../../_components/store-ui";

export const metadata: Metadata = {
  title: "테스트 결제 실패",
};

export default async function CartPaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <StoreShell activeKey="cart">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "장바구니", href: "/cart" },
            { label: "테스트 결제 실패" },
          ]}
        />
        <div className="member-auth-screen">
          <div className="member-auth-card content-panel payment-result-panel">
            <h1 className="section-panel-title">결제 실패</h1>
            <div className="member-auth-alert is-error">
              {params.message || "테스트 결제가 완료되지 않았습니다."}
              {params.code ? ` (${params.code})` : ""}
            </div>
            <div className="member-auth-actions">
              <Link className="button-primary" href="/cart">
                다시 시도
              </Link>
              <Link className="button-secondary" href="/">
                계속 쇼핑하기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
