import { redirect } from "next/navigation";

import { MemberAccountLayout } from "../../_components/member-account-layout";
import { MemberAddressManager } from "../../_components/member-address-manager";
import { Breadcrumbs, StoreShell } from "../../_components/store-ui";
import { getMemberSession } from "../../_lib/member-auth";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";

export default async function MemberAddressesPage() {
  const [runtime, session] = await Promise.all([getStorefrontRuntime(), getMemberSession()]);

  if (!session) {
    redirect("/login?next=/mypage/addresses");
  }

  const dealerMismatch =
    (runtime.dealer?.dealerMallId && session.dealerMallId !== runtime.dealer.dealerMallId) ||
    (runtime.dealer?.slug && session.dealerSlug && session.dealerSlug !== runtime.dealer.slug);

  if (dealerMismatch) {
    redirect("/login?next=/mypage/addresses");
  }

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "마이페이지", href: "/mypage" },
            { label: "배송지 설정" },
          ]}
        />

        <MemberAccountLayout activeKey="addresses" runtime={runtime} session={session}>
          <section className="content-panel account-address-panel">
            <div className="panel-head">
              <h1 className="section-panel-title">배송지 설정</h1>
            </div>
            <MemberAddressManager />
          </section>
        </MemberAccountLayout>
      </section>
    </StoreShell>
  );
}
