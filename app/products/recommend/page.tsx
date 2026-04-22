import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { products, recommendedProducts } from "../../_lib/store-data";

const recommendedList = recommendedProducts
  .map((item) => {
    const product = products.find((entry) => entry.slug === item.slug);

    if (!product) {
      return null;
    }

    return { product, tag: item.tag };
  })
  .filter((item): item is { product: (typeof products)[number]; tag: string } => item !== null);

export default function RecommendedProductsPage() {
  return (
    <StoreShell activeKey="recommend">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "추천상품" },
          ]}
        />

        <div className="content-panel">
          <p className="section-kicker">Recommended Picks</p>
          <h2 className="detail-title">추천상품</h2>
          <p className="detail-copy">
            건강 루틴과 고객 성향에 맞춰 지금 우선적으로 제안하는 상품입니다. 기본 루틴,
            장 건강, 운동 루틴, 중장년 케어 흐름으로 자연스럽게 둘러볼 수 있습니다.
          </p>
          <div className="detail-chip-row">
            <span className="detail-chip primary">루틴별 추천</span>
            <span className="detail-chip">함께 보는 상품</span>
            <span className="detail-chip">지금 제안하는 조합</span>
          </div>
        </div>

        <section className="subpage-section">
          <div className="section-head">
            <div>
              <p className="section-kicker">Recommended List</p>
              <h3>지금 추천하는 상품</h3>
            </div>
          </div>

          <div className="product-grid">
            {recommendedList.map(({ product, tag }) => (
              <ProductCard key={product.slug} label={tag} light product={product} showMeta={false} />
            ))}
          </div>
        </section>
      </section>
    </StoreShell>
  );
}
