import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { fetchStoreProducts } from "../../_lib/storefront-content";

export default async function BestProductsPage() {
  const bestProducts = await fetchStoreProducts();

  return (
    <StoreShell activeKey="best">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "베스트상품" },
          ]}
        />

        <div className="content-panel">
          <p className="section-kicker">Best Products</p>
          <h2 className="detail-title">베스트상품</h2>
          <p className="detail-copy">
            건강창고에서 가장 많이 찾는 대표 상품만 모아 둔 페이지입니다. 첫 구매가 많은
            기본 영양 루틴 상품과 재구매가 꾸준한 스테디셀러를 중심으로 확인할 수 있습니다.
          </p>
          <div className="detail-chip-row">
            <span className="detail-chip primary">첫 구매 인기</span>
            <span className="detail-chip">재구매율 높은 상품</span>
            <span className="detail-chip">회원 선호 루틴</span>
          </div>
        </div>

        <section className="subpage-section">
          <div className="section-head">
            <div>
              <p className="section-kicker">Product List</p>
              <h3>많이 찾는 상품</h3>
            </div>
          </div>

          <div className="product-grid">
            {bestProducts.map((product) => (
              <ProductCard key={product.slug} label={product.badge} product={product} />
            ))}
            {!bestProducts.length ? (
              <div className="content-panel">
                <p className="detail-copy">베스트상품으로 노출할 상품이 아직 없습니다.</p>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </StoreShell>
  );
}
