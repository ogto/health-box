import type { Metadata } from "next";

import { MemberPaymentSuccess } from "../../../_components/member-payment-success";
import { Breadcrumbs, StoreShell } from "../../../_components/store-ui";

export const metadata: Metadata = {
  title: "테스트 결제 확인",
};

export default function CartPaymentSuccessPage() {
  return (
    <StoreShell activeKey="cart">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "장바구니", href: "/cart" },
            { label: "테스트 결제 확인" },
          ]}
        />
        <div className="member-auth-screen">
          <MemberPaymentSuccess />
        </div>
      </section>
    </StoreShell>
  );
}
