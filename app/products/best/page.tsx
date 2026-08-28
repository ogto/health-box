import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { StoreCategoryFilter } from "../../_components/store-category-filter";
import { StoreProductPagination } from "../../_components/store-product-pagination";
import { getMemberSession } from "../../_lib/member-auth";
import { findNavigationItemByKey, resolveNavigationProducts } from "../../_lib/storefront-config";
import { fetchStoreCategories, fetchStoreProductPage, fetchStoreProducts } from "../../_lib/storefront-content";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";

const PRODUCT_PAGE_SIZE = 20;

export default async function BestProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    category?: string | string[];
    categoryId?: string | string[];
    menu?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const categoryValues = Array.isArray(params?.category)
    ? params.category
    : params?.category
      ? [params.category]
      : [];
  const selectedCategories = Array.from(
    new Set(categoryValues.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean)),
  );
  const selectedCategory = selectedCategories[0] || "";
  const categoryIdValues = Array.isArray(params?.categoryId)
    ? params.categoryId
    : params?.categoryId
      ? [params.categoryId]
      : [];
  const selectedCategoryIds = Array.from(
    new Set(
      categoryIdValues
        .flatMap((value) => value.split(","))
        .map(Number)
        .filter((value) => Number.isSafeInteger(value) && value > 0),
      ),
  );
  const selectedMenu = selectedCategories.length || selectedCategoryIds.length ? "category" : params?.menu?.trim() || "best";
  const requestedPage = Math.max(1, Number(params?.page) || 1);
  const [runtime, productResult, session, categories] = await Promise.all([
    getStorefrontRuntime(),
    selectedCategories.length || selectedCategoryIds.length
      ? fetchStoreProductPage({
          category: selectedCategoryIds.length ? undefined : selectedCategory,
          categoryIds: selectedCategoryIds,
          categoryNames: selectedCategories,
          page: requestedPage,
          size: PRODUCT_PAGE_SIZE,
        })
      : fetchStoreProducts(),
    getMemberSession(),
    fetchStoreCategories(),
  ]);
  const bestProducts = Array.isArray(productResult) ? productResult : productResult.items;
  const showPrice = Boolean(session);
  const activeNavigationItem = findNavigationItemByKey(runtime.navigation, selectedMenu);
  const activeKey = activeNavigationItem?.key || (selectedCategories.length ? "category" : "best");
  const selectedCategoryLabels = categories
    .filter((category) => selectedCategoryIds.includes(Number(category.key)))
    .map((category) => category.label);
  const pageTitle = selectedCategoryLabels.length
    ? selectedCategoryLabels.join(" · ")
    : selectedCategories.length
      ? selectedCategories.join(" · ")
      : activeNavigationItem?.label || "베스트상품";
  const menuProducts = resolveNavigationProducts(
    bestProducts,
    activeNavigationItem?.style === "category" ? null : activeNavigationItem,
  );
  const filteredProducts = selectedCategories.length || selectedCategoryIds.length
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
            {selectedCategories.length
              ? `${pageTitle} 카테고리에 등록된 상품을 확인할 수 있습니다.`
              : selectedCategoryIds.length
                ? `${pageTitle} 중 하나 이상에 등록된 상품을 확인할 수 있습니다.`
              : "건강창고에서 가장 많이 찾는 대표 상품만 모아 둔 페이지입니다. 첫 구매가 많은 기본 영양 루틴 상품과 재구매가 꾸준한 스테디셀러를 중심으로 확인할 수 있습니다."}
          </p>
          <div className="detail-chip-row">
            <span className="detail-chip primary">첫 구매 추천</span>
            <span className="detail-chip">재구매율 높은 상품</span>
            <span className="detail-chip">회원 선호 루틴</span>
          </div>
          {categories.length ? (
            <StoreCategoryFilter
              categories={categories.map(({ key, label }) => ({ key, label }))}
              selectedCategories={selectedCategories}
              selectedCategoryIds={selectedCategoryIds}
            />
          ) : null}
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
              baseHref={selectedCategoryIds.length
                ? `/products/best?menu=category&categoryId=${encodeURIComponent(selectedCategoryIds.join(","))}`
                : `/products/best?menu=category&category=${encodeURIComponent(selectedCategories.join(","))}`}
              currentPage={categoryPage.page}
              totalPages={categoryPage.totalPages}
            />
          ) : null}
        </section>
      </section>
    </StoreShell>
  );
}
