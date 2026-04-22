import Image from "next/image";
import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminInfoPopover } from "../../_components/admin/admin-info-popover";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  managedProducts,
  productChecklist,
  productExposureSlots,
  productMetrics,
  productOperatorNotes,
  productUploadFlow,
} from "../../_lib/admin-data";

const PRODUCTS_PER_PAGE = 10;

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
  const normalizedKeyword = keyword.toLowerCase();

  const categoryOptions = Array.from(new Set(managedProducts.map((product) => product.category)));
  const statusOptions = Array.from(new Set(managedProducts.map((product) => product.publishStatus)));

  const filteredProducts = managedProducts.filter((product) => {
    if (keyword) {
      const target = [product.title, product.subtitle, product.brand, product.id].join(" ").toLowerCase();
      if (!target.includes(normalizedKeyword)) {
        return false;
      }
    }

    if (category && product.category !== category) {
      return false;
    }

    if (status && product.publishStatus !== status) {
      return false;
    }

    return true;
  });

  const currentPage = Math.max(1, Number(params.page) || 1);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(startIndex, endIndex);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const hasFilters = Boolean(keyword || category || status);

  const filterState = {
    keyword,
    category,
    status,
  };

  return (
    <div className="admin-page">
      <AdminHeader
        title="상품관리"
        description="상품 목록을 더 압축된 테이블형으로 정리하고, 페이지 단위로 빠르게 훑을 수 있도록 구성한 상품 운영 화면입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/products/best">
              공개 상품 보기
            </Link>
            <Link className="admin-button" href="/admin/products/new">
              신규 상품 등록
            </Link>
          </>
        }
      />

      <AdminMetrics items={productMetrics} />

      <AdminPanel
        kicker="Product Workspace"
        title="상품 운영 보드"
        action={
          <AdminInfoPopover>
            <div className="admin-info-popover-sections">
              <section className="admin-info-popover-section">
                <strong>상품 등록 흐름</strong>
                <ul className="admin-info-popover-list">
                  {productUploadFlow.map((step) => (
                    <li key={step.title}>{step.title}</li>
                  ))}
                </ul>
              </section>

              <section className="admin-info-popover-section">
                <strong>노출 슬롯 현황</strong>
                <div className="admin-info-popover-chip-row">
                  {productExposureSlots.map((slot) => (
                    <span className="admin-info-popover-chip" key={slot.title}>
                      {slot.title}: {slot.value}
                    </span>
                  ))}
                </div>
              </section>

              <section className="admin-info-popover-section">
                <strong>운영 체크포인트</strong>
                <ul className="admin-info-popover-list">
                  {productChecklist.map((item) => (
                    <li key={item.title}>{item.title}</li>
                  ))}
                </ul>
              </section>

              <section className="admin-info-popover-section">
                <strong>상품 운영 메모</strong>
                <ul className="admin-info-popover-list">
                  {productOperatorNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          </AdminInfoPopover>
        }
      >
        <form className="admin-product-filter-bar" method="get">
          <label className="admin-field admin-product-filter-search">
            <span>상품 검색</span>
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
            <span>노출 상태</span>
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
              검색 적용
            </button>
            <Link
              className="admin-button secondary small"
              href="/admin/products"
            >
              초기화
            </Link>
          </div>
        </form>

      </AdminPanel>

      <AdminPanel
        kicker="Catalog"
        title="운영 상품 목록"
        description="한 페이지에 10개씩 표시되며, 썸네일·노출상태·재고·매출·수정일을 한 줄에서 확인할 수 있습니다."
        action={
          <div className="admin-table-toolbar-meta">
            <span>총 {filteredProducts.length}개</span>
            <span>
              {filteredProducts.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length}
            </span>
          </div>
        }
      >
        {visibleProducts.length > 0 ? (
          <AdminTable
            columns="minmax(0, 1.9fr) 110px 170px 110px 120px 110px 120px"
            headers={["상품", "카테고리", "노출상태", "재고", "월 매출", "수정일", "관리"]}
          >
            {visibleProducts.map((product) => (
              <div className="admin-table-row admin-product-table-row" key={product.slug}>
                <div className="admin-product-table-main">
                  <Link className="admin-product-table-thumb" href={product.adminHref}>
                    <Image
                      alt={product.title}
                      className="object-cover"
                      fill
                      sizes="56px"
                      src={product.image}
                    />
                  </Link>

                  <div className="admin-product-table-copy">
                    <Link className="admin-product-table-title" href={product.adminHref}>
                      {product.title}
                    </Link>
                    <p>{product.subtitle}</p>
                    <span>
                      {product.id} · {product.brand}
                    </span>
                  </div>
                </div>

                <span className="admin-row-muted">{product.category}</span>

                <div className="admin-product-table-badges">
                  <AdminBadge tone={product.publishTone}>{product.publishStatus}</AdminBadge>
                  <AdminBadge tone={product.statusTone}>{product.badge}</AdminBadge>
                </div>

                <div className="admin-row-stack">
                  <strong>{product.inventoryCount}</strong>
                  <span>{product.stockNote}</span>
                </div>

                <strong className="admin-row-price">{product.monthlySales}</strong>
                <span className="admin-row-muted">{product.updatedAt}</span>

                <div className="admin-product-table-actions">
                  <Link className="admin-button secondary small" href={product.previewHref}>
                    보기
                  </Link>
                  <Link className="admin-button small" href={product.adminHref}>
                    관리
                  </Link>
                </div>
              </div>
            ))}
          </AdminTable>
        ) : (
          <div className="admin-empty-state">
            <strong>조건에 맞는 상품이 없습니다.</strong>
            <p>검색어 또는 필터를 조정해서 다시 확인해보세요.</p>
            {hasFilters ? (
              <Link className="admin-button secondary small" href="/admin/products">
                전체 상품 다시 보기
              </Link>
            ) : null}
          </div>
        )}

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
