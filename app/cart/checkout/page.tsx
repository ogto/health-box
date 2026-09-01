import { Breadcrumbs, StoreShell } from "../../_components/store-ui";
import { MemberAccountLayout } from "../../_components/member-account-layout";
import { MemberCartPanel } from "../../_components/member-cart-panel";
import { getMemberSession } from "../../_lib/member-auth";
import { fetchStoreProducts } from "../../_lib/storefront-content";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";
import { buildTossCustomerKey } from "../../_lib/toss-payments";

export default async function CheckoutPage() {
  const [runtime, session, products] = await Promise.all([
    getStorefrontRuntime(),
    getMemberSession(),
    fetchStoreProducts(),
  ]);

  const content = (
    <MemberCartPanel
      baseShippingFee={runtime.commerce.baseShippingFee}
      customerEmail={session?.email}
      customerKey={session?.memberId ? buildTossCustomerKey(session.memberId) : undefined}
      defaultName={session?.name}
      defaultPhone={session?.phone}
      freeShippingThreshold={runtime.commerce.freeShippingThreshold}
      loggedIn={Boolean(session)}
      mode="checkout"
      orderSessionReady={Boolean(session?.sessionToken)}
      productCatalog={products}
      remoteAreaFee={runtime.commerce.remoteAreaFee}
      remoteAreaZipRanges={runtime.commerce.remoteAreaZipRanges}
    />
  );

  return (
    <StoreShell activeKey="cart">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "장바구니", href: "/cart" },
            { label: "주문/결제" },
          ]}
        />

        {session ? (
          <MemberAccountLayout activeKey="cart" runtime={runtime} session={session}>
            {content}
          </MemberAccountLayout>
        ) : (
          content
        )}
      </section>
    </StoreShell>
  );
}
