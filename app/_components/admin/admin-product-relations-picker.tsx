"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type RelatedProductOption = {
  brand?: string;
  image?: string;
  slug: string;
  title: string;
};

export function AdminProductRelationsPicker({
  currentSlug,
  products,
  selectedSlugs = [],
}: {
  currentSlug?: string;
  products: RelatedProductOption[];
  selectedSlugs?: string[];
}) {
  const options = useMemo(
    () => products
      .filter((product) => product.slug !== currentSlug)
      .sort((left, right) => {
        const brandComparison = (left.brand || "").localeCompare(right.brand || "", "ko-KR");
        return brandComparison || left.title.localeCompare(right.title, "ko-KR");
      }),
    [currentSlug, products],
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(selectedSlugs.filter((slug) => options.some((product) => product.slug === slug))),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const visibleOptions = normalizedQuery
    ? options.filter((product) => `${product.brand || ""} ${product.title}`.toLocaleLowerCase("ko-KR").includes(normalizedQuery))
    : options;

  const toggleProduct = (slug: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(slug);
      } else {
        next.delete(slug);
      }
      return next;
    });
  };

  return (
    <fieldset className="admin-product-relations-picker">
      <legend>함께 구매할 묶음 구성 상품</legend>
      {Array.from(selected).map((slug) => (
        <input key={slug} name="bundleProductSlugs" type="hidden" value={slug} />
      ))}

      <div className="admin-product-relations-toolbar">
        <div className="admin-product-relations-summary">
          <strong>상품 선택</strong>
          <span>현재 상품을 제외한 {options.length}개 상품</span>
        </div>
        <div className="admin-product-relations-actions">
          <span className="admin-product-relations-count">선택 {selected.size}개</span>
          <label className="admin-product-relations-search">
            <SearchIcon />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품명 또는 브랜드 검색"
              type="search"
              value={query}
            />
          </label>
        </div>
      </div>

      {visibleOptions.length ? (
        <div className="admin-product-relations-grid">
          {visibleOptions.map((product) => {
            const isSelected = selected.has(product.slug);

            return (
              <label
                className={`admin-product-relation-card${isSelected ? " is-selected" : ""}`}
                key={product.slug}
              >
                <input
                  checked={isSelected}
                  className="admin-product-relation-input"
                  onChange={(event) => toggleProduct(product.slug, event.target.checked)}
                  type="checkbox"
                />
                <span className="admin-product-relation-thumb" aria-hidden="true">
                  {product.image ? (
                    <Image alt="" fill sizes="56px" src={product.image} />
                  ) : (
                    <b>{product.title.trim().charAt(0) || "상"}</b>
                  )}
                </span>
                <span className="admin-product-relation-copy">
                  <small>{product.brand || "브랜드 미지정"}</small>
                  <strong>{product.title}</strong>
                </span>
                <span className="admin-product-relation-check" aria-hidden="true">
                  {isSelected ? "✓" : "+"}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="admin-product-relations-empty">
          <strong>{options.length ? "검색 결과가 없습니다." : "연결할 다른 상품이 없습니다."}</strong>
          <span>{options.length ? "다른 상품명이나 브랜드로 검색해보세요." : "상품을 먼저 추가한 뒤 묶음 구성을 선택할 수 있습니다."}</span>
        </div>
      )}
    </fieldset>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
