import Link from "next/link";

function buildPageHref(baseHref: string, page: number) {
  const [pathname, query = ""] = baseHref.split("?");
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  return `${pathname}?${params.toString()}`;
}

function pageNumbers(currentPage: number, totalPages: number) {
  const visibleCount = Math.min(totalPages, 5);
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - visibleCount + 1));
  return Array.from({ length: visibleCount }, (_, index) => start + index);
}

export function StoreProductPagination({
  baseHref,
  currentPage,
  totalPages,
}: {
  baseHref: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  return (
    <nav aria-label="상품 목록 페이지" className="store-product-pagination">
      <Link
        aria-disabled={safePage === 1}
        className={`store-product-pagination-arrow${safePage === 1 ? " is-disabled" : ""}`}
        href={buildPageHref(baseHref, Math.max(1, safePage - 1))}
      >
        이전
      </Link>

      <div className="store-product-pagination-pages">
        {pageNumbers(safePage, totalPages).map((page) => (
          <Link
            aria-current={page === safePage ? "page" : undefined}
            className={page === safePage ? "is-active" : ""}
            href={buildPageHref(baseHref, page)}
            key={page}
          >
            {page}
          </Link>
        ))}
      </div>

      <Link
        aria-disabled={safePage === totalPages}
        className={`store-product-pagination-arrow${safePage === totalPages ? " is-disabled" : ""}`}
        href={buildPageHref(baseHref, Math.min(totalPages, safePage + 1))}
      >
        다음
      </Link>
    </nav>
  );
}
