import { Breadcrumbs, ProductCard, StoreShell } from "../_components/store-ui";
import { MemberAccountLayout } from "../_components/member-account-layout";
import { MemberCartPanel } from "../_components/member-cart-panel";
import { getMemberSession } from "../_lib/member-auth";
import { fetchStoreProducts } from "../_lib/storefront-content";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export default async function CartPage() {
  const [runtime, session, products] = await Promise.all([getStorefrontRuntime(), getMemberSession(), fetchStoreProducts()]);

  const cartContent = (
    <>
      <MemberCartPanel
        customerEmail={session?.email}
        customerKey={session?.memberId ? `healthbox-member-${session.memberId}` : undefined}
        defaultName={session?.name}
        defaultPhone={session?.phone}
        loggedIn={Boolean(session)}
        orderSessionReady={Boolean(session?.sessionToken)}
        productCatalog={products}
      />

      <section className="section-block account-recommend-section">
        <div className="section-head">
          <div>
            <h3>장바구니와 함께 보면 좋은 상품</h3>
          </div>
        </div>

        <div className="product-grid product-grid-three">
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.slug} label={product.badge} product={product} />
          ))}
        </div>
      </section>
    </>
  );

  return (
    <StoreShell activeKey="cart">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "장바구니" },
          ]}
        />

        {session ? (
          <MemberAccountLayout activeKey="cart" runtime={runtime} session={session}>
            {cartContent}
          </MemberAccountLayout>
        ) : (
          cartContent
        )}
      </section>
    </StoreShell>
  );
}
