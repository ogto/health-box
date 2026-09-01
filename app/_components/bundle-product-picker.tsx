"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { addMemberCartItemsToServer, dispatchMemberCartSync } from "../_lib/member-cart";
import type { Product } from "../_lib/store-data";
import { ProductPriceDisplay } from "./product-price-display";

function purchasableSku(product: Product) {
  const activeSkus = (product.skus || []).filter(
    (sku) => sku.id && sku.status !== "INACTIVE" && sku.soldOutYn !== "Y" && (sku.stockQuantity ?? 1) > 0,
  );
  const basicSku = activeSkus.find((sku) => !sku.optionValueCodes?.length);
  return basicSku || (activeSkus.length === 1 ? activeSkus[0] : null);
}

export function BundleProductPicker({
  isMember,
  products,
}: {
  isMember: boolean;
  products: Product[];
}) {
  const candidates = useMemo(
    () => products.map((product) => ({ product, sku: purchasableSku(product) })),
    [products],
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    candidates.filter((candidate) => candidate.sku).map((candidate) => candidate.product.slug),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCandidates = candidates.filter(
    (candidate) => candidate.sku && selectedSlugs.includes(candidate.product.slug),
  );
  const selectedTotal = selectedCandidates.reduce(
    (sum, candidate) => sum + Number(candidate.sku?.memberPrice ?? candidate.product.memberPrice ?? 0),
    0,
  );

  function toggleProduct(slug: string) {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
    );
  }

  async function addSelectedProducts() {
    if (!selectedCandidates.length) {
      setError("함께 담을 상품을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      await addMemberCartItemsToServer(
        selectedCandidates.map(({ product, sku }) => ({
          image: product.image,
          optionLabel: sku?.skuName || "없음",
          productId: product.id,
          productSlug: product.slug,
          productTitle: product.title,
          quantity: 1,
          skuId: Number(sku?.id),
          unitPrice: Number(sku?.memberPrice ?? product.memberPrice ?? 0),
        })),
      );
      dispatchMemberCartSync();
      setMessage(`${selectedCandidates.length}개 상품을 장바구니에 담았습니다.`);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "묶음 상품을 담지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!products.length) {
    return null;
  }

  return (
    <section className="shop-bundle-pick-section">
      <div className="shop-bundle-head">
        <div>
          <h2>묶음 상품 함께 담기</h2>
          <span>원하는 상품을 골라 장바구니에 한 번에 담을 수 있습니다.</span>
        </div>
        {isMember ? <strong>선택 합계 {selectedTotal.toLocaleString("ko-KR")}원</strong> : null}
      </div>
      <div className="shop-bundle-card-grid">
        {candidates.map(({ product, sku }) => {
          const selected = selectedSlugs.includes(product.slug);
          return (
            <article className={`shop-bundle-card${selected ? " is-selected" : ""}`} key={product.slug}>
              <Link className="shop-bundle-image" href={`/product/${product.slug}`}>
                <Image
                  alt={product.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 760px) 42vw, 180px"
                  src={product.image}
                  unoptimized
                />
              </Link>
              <label className="shop-bundle-select">
                <input
                  checked={selected}
                  disabled={!isMember || !sku}
                  onChange={() => toggleProduct(product.slug)}
                  type="checkbox"
                />
                {sku ? "함께 담기" : "옵션 선택 필요"}
              </label>
              <Link href={`/product/${product.slug}`}>
                <h3>{product.title}</h3>
              </Link>
              <ProductPriceDisplay
                compact
                consumerPrice={product.consumerPrice}
                fallbackPrice={product.price}
                isMember={isMember}
                memberPrice={product.memberPrice}
                priceExposurePolicy={product.priceExposurePolicy}
              />
            </article>
          );
        })}
      </div>
      {isMember ? (
        <button
          className="button-primary shop-bundle-submit"
          disabled={submitting || !selectedCandidates.length}
          onClick={() => void addSelectedProducts()}
          type="button"
        >
          {submitting ? "담는 중..." : `선택 상품 ${selectedCandidates.length}개 함께 담기`}
        </button>
      ) : (
        <Link className="button-primary shop-bundle-submit" href="/login">
          로그인 후 묶음 구매
        </Link>
      )}
      {message ? <p className="member-auth-alert is-success">{message}</p> : null}
      {error ? <p className="member-auth-alert is-error">{error}</p> : null}
    </section>
  );
}
