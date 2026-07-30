import { StoreProductPagination } from "../../_components/store-product-pagination";
import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { getMemberSession } from "../../_lib/member-auth";
import { fetchStoreProductPage } from "../../_lib/storefront-content";

const PRODUCT_PAGE_SIZE = 20;

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params?.page) || 1);
  const [productPage, session] = await Promise.all([
    fetchStoreProductPage({ page: requestedPage, size: PRODUCT_PAGE_SIZE }),
    getMemberSession(),
  ]);
  const showPrice = Boolean(session);

  return (
    <StoreShell activeKey="all-products">
      <section className="subpage-block">
        <Breadcrumbs items={[{ label: "홈", href: "/" }, { label: "전체상품" }]} />

        <div className="content-panel">
          <h2 className="detail-title">전체상품</h2>
          <p className="detail-copy">
            건강창고에 등록된 전체 상품을 확인할 수 있습니다.
          </p>
          <div className="detail-chip-row">
            <span className="detail-chip primary">
              총 {productPage.totalElements.toLocaleString("ko-KR")}개 상품
            </span>
          </div>
        </div>

        <section className="subpage-section">
          <div className="section-head">
            <div>
              <h3>전체 상품 목록</h3>
            </div>
          </div>

          <div className="product-grid">
            {productPage.items.map((product, index) => (
              <ProductCard
                eager={index === 0}
                key={product.slug}
                product={product}
                showPrice={showPrice}
              />
            ))}
            {!productPage.items.length ? (
              <div className="content-panel">
                <p className="detail-copy">등록된 상품이 아직 없습니다.</p>
              </div>
            ) : null}
          </div>

          <StoreProductPagination
            baseHref="/products/all"
            currentPage={productPage.page}
            totalPages={productPage.totalPages}
          />
        </section>
      </section>
    </StoreShell>
  );
}
