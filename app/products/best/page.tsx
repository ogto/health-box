import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { StoreProductPagination } from "../../_components/store-product-pagination";
import { getMemberSession } from "../../_lib/member-auth";
import { findNavigationItemByKey, resolveNavigationProducts } from "../../_lib/storefront-config";
import { fetchStoreProductPage, fetchStoreProducts } from "../../_lib/storefront-content";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";

const PRODUCT_PAGE_SIZE = 20;

export default async function BestProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; menu?: string; page?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params?.category?.trim() || "";
  const selectedMenu = selectedCategory ? "category" : params?.menu?.trim() || "best";
  const requestedPage = Math.max(1, Number(params?.page) || 1);
  const [runtime, productResult, session] = await Promise.all([
    getStorefrontRuntime(),
    selectedCategory
      ? fetchStoreProductPage({
          category: selectedCategory,
          page: requestedPage,
          size: PRODUCT_PAGE_SIZE,
        })
      : fetchStoreProducts(),
    getMemberSession(),
  ]);
  const bestProducts = Array.isArray(productResult) ? productResult : productResult.items;
  const showPrice = Boolean(session);
  const activeNavigationItem = findNavigationItemByKey(runtime.navigation, selectedMenu);
  const activeKey = activeNavigationItem?.key || (selectedCategory ? "category" : "best");
  const pageTitle = selectedCategory || activeNavigationItem?.label || "베스트상품";
  const menuProducts = resolveNavigationProducts(
    bestProducts,
    activeNavigationItem?.style === "category" ? null : activeNavigationItem,
  );
  const filteredProducts = selectedCategory
    ? bestProducts
    : menuProducts;
  const categoryPage = Array.isArray(productResult) ? null : productResult;

  return (
    <StoreShell activeKey={activeKey}>
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: pageTitle },
          ]}
        />

        <div className="content-panel">
          <h2 className="detail-title">{pageTitle}</h2>
          <p className="detail-copy">
            {selectedCategory
              ? `${selectedCategory} 카테고리에 등록된 상품을 확인할 수 있습니다.`
              : "건강창고에서 가장 많이 찾는 대표 상품만 모아 둔 페이지입니다. 첫 구매가 많은 기본 영양 루틴 상품과 재구매가 꾸준한 스테디셀러를 중심으로 확인할 수 있습니다."}
          </p>
          <div className="detail-chip-row">
            <span className="detail-chip primary">첫 구매 추천</span>
            <span className="detail-chip">재구매율 높은 상품</span>
            <span className="detail-chip">회원 선호 루틴</span>
          </div>
        </div>

        <section className="subpage-section">
          <div className="section-head">
            <div>
              <h3>많이 찾는 상품</h3>
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product, index) => (
              <ProductCard
                eager={index === 0}
                key={`${product.slug}-${index}`}
                product={product}
                showPrice={showPrice}
              />
            ))}
            {!filteredProducts.length ? (
              <div className="content-panel">
                <p className="detail-copy">조건에 맞는 상품이 아직 없습니다.</p>
              </div>
            ) : null}
          </div>
          {categoryPage ? (
            <StoreProductPagination
              baseHref={`/products/best?menu=category&category=${encodeURIComponent(selectedCategory)}`}
              currentPage={categoryPage.page}
              totalPages={categoryPage.totalPages}
            />
          ) : null}
        </section>
      </section>
    </StoreShell>
  );
}
