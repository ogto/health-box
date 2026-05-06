"use client";

import { useMemo, useState } from "react";

import type { StorefrontNavigationItem } from "../../_lib/storefront-config";

type EditableNavigationItem = StorefrontNavigationItem & {
  label: string;
  productSlugs: string[];
};

export function AdminStorefrontMenuEditor({
  items,
  products,
}: {
  items: ReadonlyArray<StorefrontNavigationItem>;
  products: ReadonlyArray<{
    brand: string;
    category: string;
    slug: string;
    sourceSlug?: string;
    title: string;
  }>;
}) {
  const [rows, setRows] = useState<EditableNavigationItem[]>(() =>
    items.map((item, index) => ({
      ...item,
      label: item.label || `메뉴 ${index + 1}`,
      productSlugs: item.productSlugs || [],
      sortOrder: index + 1,
      visible: true,
    })),
  );
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.key, products[0] ? productValue(products[0]) : ""])),
  );

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row, index) => ({
          href: row.href,
          key: row.key,
          label: row.label.trim() || `메뉴 ${index + 1}`,
          productSlugs: row.style === "category" ? [] : row.productSlugs,
          sortOrder: index + 1,
          style: row.style || "link",
          visible: true,
        })),
      ),
    [rows],
  );

  function patchLabel(key: string, label: string) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, label } : row)));
  }

  function patchSelectedProduct(key: string, slug: string) {
    setSelectedProducts((current) => ({ ...current, [key]: slug }));
  }

  function addProduct(key: string) {
    const slug = selectedProducts[key] || (products[0] ? productValue(products[0]) : "");
    if (!slug) {
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, productSlugs: [...row.productSlugs, slug] } : row,
      ),
    );
  }

  function removeProduct(key: string, productIndex: number) {
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? { ...row, productSlugs: row.productSlugs.filter((_, index) => index !== productIndex) }
          : row,
      ),
    );
  }

  function productValue(product: { slug: string; sourceSlug?: string }) {
    return product.sourceSlug || product.slug;
  }

  function productLabel(slug: string) {
    const product = products.find((item) => item.slug === slug || item.sourceSlug === slug);
    return product ? `${product.title} · ${product.brand}` : slug;
  }

  return (
    <div className="admin-storefront-menu-editor">
      <input name="mainNavigationJson" type="hidden" value={payload} />

      <div className="admin-storefront-menu-toolbar">
        <p>메뉴명과 메뉴별 노출 상품을 설정합니다. 같은 상품도 여러 번 추가할 수 있습니다.</p>
      </div>

      {rows.map((item, index) => (
        <div className="admin-storefront-menu-card" key={item.key}>
          <div className="admin-storefront-menu-row is-fixed">
            <span className="admin-storefront-menu-index">{index + 1}</span>
            <label className="admin-field">
              <span>메뉴명</span>
              <input
                className="admin-input"
                onChange={(event) => patchLabel(item.key, event.target.value)}
                type="text"
                value={item.label}
              />
            </label>
            <div className="admin-storefront-menu-fixed-info">
              <span>유형</span>
              <strong>{item.style === "category" ? "카테고리 메뉴" : "일반 메뉴"}</strong>
            </div>
            <div className="admin-storefront-menu-fixed-info">
              <span>링크</span>
              <strong>{item.href}</strong>
            </div>
          </div>
          {item.style === "category" ? (
            <p className="admin-storefront-menu-product-empty is-category">
              카테고리 메뉴는 상품을 직접 연결하지 않고 카테고리별 등록 상품을 자동으로 표시합니다.
            </p>
          ) : (
            <div className="admin-storefront-menu-products">
              <div className="admin-storefront-menu-product-picker">
                <label className="admin-field">
                  <span>상품 추가</span>
                  <select
                    className="admin-select"
                    onChange={(event) => patchSelectedProduct(item.key, event.target.value)}
                    value={selectedProducts[item.key] || (products[0] ? productValue(products[0]) : "")}
                  >
                    {products.map((product) => (
                    <option key={`${item.key}-${product.slug}`} value={productValue(product)}>
                      {product.title} · {product.brand} · {product.category}
                    </option>
                    ))}
                  </select>
                </label>
                <button
                  className="admin-button secondary small"
                  disabled={!products.length}
                  onClick={() => addProduct(item.key)}
                  type="button"
                >
                  추가
                </button>
              </div>
              {item.productSlugs.length ? (
                <div className="admin-storefront-menu-product-list">
                  {item.productSlugs.map((slug, productIndex) => (
                    <div className="admin-storefront-menu-product-chip" key={`${item.key}-${slug}-${productIndex}`}>
                      <span>{productIndex + 1}</span>
                      <strong>{productLabel(slug)}</strong>
                      <button
                        aria-label={`${productLabel(slug)} 제거`}
                        onClick={() => removeProduct(item.key, productIndex)}
                        type="button"
                      >
                        제거
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-storefront-menu-product-empty">추가된 상품이 없으면 기존 기본 상품 목록이 표시됩니다.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
