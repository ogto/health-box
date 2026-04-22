import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { bestProducts } from "../../_lib/store-data";

export default function BestProductsPage() {
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
          </div>
        </section>
      </section>
    </StoreShell>
  );
}
