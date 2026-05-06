import { Breadcrumbs, ProductCard, StoreShell } from "../_components/store-ui";
import { getMemberSession } from "../_lib/member-auth";
import { fetchStoreProducts } from "../_lib/storefront-content";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const keyword = params?.q?.trim() || "";
  const canSearch = keyword.length >= 2;
  const [runtime, products, session] = await Promise.all([
    getStorefrontRuntime(),
    canSearch ? fetchStoreProducts({ q: keyword, size: 80 }) : Promise.resolve([]),
    getMemberSession(),
  ]);
  const showPrice = Boolean(session);

  return (
    <StoreShell activeKey="search">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "검색" },
          ]}
        />

        <div className="content-panel search-result-head">
          <h2 className="detail-title">상품 검색</h2>
          <form action="/search" className="search-page-form" role="search">
            <label className="search-page-field">
              <span>검색어</span>
              <input
                autoFocus
                defaultValue={keyword}
                minLength={2}
                name="q"
                placeholder={runtime.brand.searchPlaceholder}
                type="search"
              />
            </label>
            <button className="button-primary" type="submit">
              검색
            </button>
          </form>
          <p className="detail-copy">
            {canSearch
              ? `"${keyword}" 검색 결과 ${products.length}건입니다.`
              : keyword
                ? "검색어는 2글자 이상 입력해 주세요."
                : "찾고 싶은 상품명, 브랜드명, 기능성 키워드를 2글자 이상 입력하세요."}
          </p>
        </div>

        {canSearch ? (
          <section className="subpage-section">
            <div className="section-head">
              <div>
                <h3>검색 결과</h3>
              </div>
            </div>

            <div className="product-grid">
              {products.map((product, index) => (
                <ProductCard key={`${product.slug}-${index}`} product={product} showPrice={showPrice} />
              ))}
              {!products.length ? (
                <div className="content-panel">
                  <p className="detail-copy">검색어에 맞는 상품이 없습니다.</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </section>
    </StoreShell>
  );
}
