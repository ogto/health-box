import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminProductThumbPreview } from "../../_components/admin/admin-product-thumb-preview";
import { AdminTableScrollMirror } from "../../_components/admin/admin-table-scroll-mirror";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { fetchAdminCategories, fetchAdminProducts, hasHealthBoxApi } from "../../_lib/health-box-api";
import { buildProductMetrics, mapProductRows } from "../../_lib/health-box-presenters";

const PRODUCTS_PER_PAGE = 10;
const productTableScrollerId = "admin-product-table-scroller";

type ProductSearchParams = {
  page?: string;
  q?: string;
  category?: string;
  status?: string;
};

function buildPageHref(
  page: number,
  filters: {
    keyword: string;
    category: string;
    status: string;
  },
) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (filters.keyword) {
    params.set("q", filters.keyword);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const params = await searchParams;
  const keyword = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const status = (params.status ?? "").trim();
  const currentPage = Math.max(1, Number(params.page) || 1);

  const [livePage, categories] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminProducts({
          q: keyword || undefined,
          category: category || undefined,
          status: status || undefined,
          page: currentPage,
          size: PRODUCTS_PER_PAGE,
        }),
        fetchAdminCategories(),
      ])
    : [null, []];

  const liveRows = mapProductRows(livePage);
  const categoryOptions = categories?.length
    ? categories.map((item) => item.name || item.categoryCode || "").filter(Boolean)
    : Array.from(new Set(liveRows.items.map((product) => product.categoryQueryValue).filter(Boolean)));
  const statusOptions = ["메인 노출중", "정상 판매", "재고 주의", "추천 운영"];
  const hasLivePage = Boolean(livePage);
  const totalPages = hasLivePage ? Math.max(liveRows.totalPages, 0) : 0;
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = liveRows.items;
  const totalElements = liveRows.totalElements;
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const hasFilters = Boolean(keyword || category || status);
  const filterState = { keyword, category, status };
  const metrics = hasLivePage ? buildProductMetrics(livePage) : buildProductMetrics(null);

  return (
    <div className="admin-page">
      <AdminHeader
        title="상품관리"
        actions={
          <Link className="admin-button" href="/admin/products/new">
            상품 등록
          </Link>
        }
      />

      <AdminMetrics items={metrics} />

      <AdminPanel title="검색 / 필터">
        <form className="admin-product-filter-bar" method="get">
          <label className="admin-field admin-product-filter-search">
            <span>검색</span>
            <input
              className="admin-input"
              defaultValue={keyword}
              name="q"
              placeholder="상품명, 브랜드명, 상품코드를 검색하세요"
              type="search"
            />
          </label>

          <label className="admin-field">
            <span>카테고리</span>
            <select className="admin-select" defaultValue={category} name="category">
              <option value="">전체 카테고리</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span>상태</span>
            <select className="admin-select" defaultValue={status} name="status">
              <option value="">전체 상태</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-product-filter-actions">
            <button className="admin-button small" type="submit">
              조회
            </button>
            <Link className="admin-button secondary small" href="/admin/products">
              초기화
            </Link>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel
        title="상품 목록"
        action={
          <div className="admin-table-toolbar-meta">
            <span>총 {totalElements}개</span>
            <span>
              {visibleProducts.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + visibleProducts.length, totalElements)} / {totalElements}
            </span>
          </div>
        }
      >
        <div className="admin-product-table-wrap">
          <AdminTable
            alignments={["center", "center", "center", "center", "center", "center", "center", "center", "center"]}
            columns="90px minmax(300px, 2fr) 118px 118px 136px 94px 108px 108px 96px"
            emptyAction={
              hasFilters ? (
                <Link className="admin-button secondary small" href="/admin/products">
                  전체 상품
                </Link>
              ) : null
            }
            emptyDescription={
              hasHealthBoxApi()
                ? "등록된 상품이 없거나 검색 결과가 비었습니다."
                : "API를 연결하면 상품 목록을 조회할 수 있습니다."
            }
            headers={["상품 ID", "상품명", "브랜드", "카테고리", "노출상태", "재고", "월 매출", "수정일", "관리"]}
            isEmpty={!visibleProducts.length}
            scrollerId={productTableScrollerId}
          >
            {visibleProducts.map((product) => (
              <div className="admin-table-row admin-product-table-row" key={product.slug}>
                <span className="admin-row-muted admin-product-table-id">{product.id}</span>

                <div className="admin-product-table-main">
                  <AdminProductThumbPreview alt={product.title} src={product.image} title={product.title} />

                  <div className="admin-product-table-copy">
                    <Link className="admin-product-table-title" href={product.adminHref}>
                      {product.title}
                    </Link>
                    <p>{product.subtitle}</p>
                  </div>
                </div>

                <span className="admin-row-muted admin-product-table-brand">{product.brand}</span>
                <span className="admin-row-muted admin-product-table-category">{product.category}</span>

                <div className="admin-product-table-badges">
                  <AdminBadge tone={product.publishTone}>{product.publishStatus}</AdminBadge>
                  {product.badge ? <AdminBadge tone={product.statusTone}>{product.badge}</AdminBadge> : null}
                </div>

                <div className="admin-row-stack admin-product-table-stock">
                  <strong>{product.inventoryCount}</strong>
                  <span>{product.stockNote}</span>
                </div>

                <strong className="admin-row-price admin-product-table-price">{product.monthlySales}</strong>
                <span className="admin-row-muted admin-product-table-updated">{product.updatedAt}</span>

                <div className="admin-product-table-actions">
                  <Link className="admin-button small" href={product.adminHref}>
                    관리
                  </Link>
                </div>
              </div>
            ))}
          </AdminTable>
          <AdminTableScrollMirror className="admin-table-scroll-mirror-full" targetId={productTableScrollerId} />
        </div>

        {visibleProducts.length > 0 ? (
          <div className="admin-pagination">
            <Link
              aria-disabled={safePage === 1}
              className={`admin-pagination-button${safePage === 1 ? " is-disabled" : ""}`}
              href={buildPageHref(Math.max(1, safePage - 1), filterState)}
            >
              이전
            </Link>

            <div className="admin-pagination-pages">
              {pageNumbers.map((pageNumber) => (
                <Link
                  className={`admin-pagination-page${pageNumber === safePage ? " is-active" : ""}`}
                  href={buildPageHref(pageNumber, filterState)}
                  key={pageNumber}
                >
                  {pageNumber}
                </Link>
              ))}
            </div>

            <Link
              aria-disabled={safePage === totalPages}
              className={`admin-pagination-button${safePage === totalPages ? " is-disabled" : ""}`}
              href={buildPageHref(Math.min(totalPages, safePage + 1), filterState)}
            >
              다음
            </Link>
          </div>
        ) : null}
      </AdminPanel>
    </div>
  );
}
