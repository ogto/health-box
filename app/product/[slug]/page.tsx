import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailAnchorTabs, type ProductDetailAnchorTab } from "../../_components/product-detail-anchor-tabs";
import { ProductDetailGallery } from "../../_components/product-detail-gallery";
import { ProductPurchaseBox, ProductPurchaseProvider } from "../../_components/product-purchase-controls";
import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import {
  fetchStoreProductBySlug,
  fetchStoreProducts,
} from "../../_lib/storefront-content";

function meaningfulText(value: string | null | undefined) {
  const text = (value || "").trim();
  return text && text !== "-" ? text : "";
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function uniqueTexts(values: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return values.reduce<string[]>((items, value) => {
    const text = meaningfulText(value);
    if (!text) {
      return items;
    }

    const key = normalizeText(text);
    if (seen.has(key)) {
      return items;
    }

    seen.add(key);
    items.push(text);
    return items;
  }, []);
}

function sanitizeProductHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function paragraphsFromText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, products] = await Promise.all([
    fetchStoreProductBySlug(slug),
    fetchStoreProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = products.filter((entry) => entry.slug !== product.slug).slice(0, 4);
  const salesPolicyText = meaningfulText(product.salesPolicyText);
  const deliveryPolicyText = meaningfulText(product.deliveryPolicyText) || meaningfulText(product.shipping);
  const reviewText = meaningfulText(product.review) || "후기 정보 준비중";
  const policyTextKeys = new Set(
    [salesPolicyText, deliveryPolicyText, product.shipping].map((text) => normalizeText(text || "")).filter(Boolean),
  );
  const highlights = uniqueTexts([product.category, product.badge, ...product.highlights])
    .filter((highlight) => !policyTextKeys.has(normalizeText(highlight)))
    .slice(0, 3);
  const rawDetailSections = product.detailSections.length
    ? product.detailSections
    : product.gallery.slice(0, 2).map((image, index) => ({
        title: index === 0 ? "상품 이미지" : "추가 이미지",
        body: product.summary,
        image,
        imageAlt: `${product.title} 상세 이미지 ${index + 1}`,
        caption: product.category,
      }));
  const introParagraphs = uniqueTexts([product.summary, ...product.description]);
  const detailHtml = sanitizeProductHtml(product.detailHtml || "");
  const usedDetailTexts = new Set(introParagraphs.map(normalizeText));
  const detailSections = rawDetailSections.map((section) => {
    const body = meaningfulText(section.body);
    const normalizedBody = body ? normalizeText(body) : "";
    const shouldShowBody = body && !usedDetailTexts.has(normalizedBody);

    if (shouldShowBody) {
      usedDetailTexts.add(normalizedBody);
    }

    return {
      ...section,
      body: shouldShowBody ? body : "",
      caption: meaningfulText(section.caption),
    };
  });
  const subtitleText = meaningfulText(product.subtitle);
  const displaySubtitle =
    subtitleText && normalizeText(subtitleText) !== normalizeText(introParagraphs[0] || "")
      ? subtitleText
      : "";
  const tabItems: ProductDetailAnchorTab[] = [
    { id: "detail-info", label: "상품상세정보" },
    { id: "sales-policy", label: "판매정책" },
    { id: "delivery-policy", label: "배송정책" },
    { id: "product-reviews", label: "후기" },
  ];

  return (
    <StoreShell>
      <ProductPurchaseProvider>
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "상품상세" },
            { label: product.title },
          ]}
        />

        <div className="detail-grid shop-detail-grid">
          <ProductDetailGallery title={product.title} images={product.gallery} />

          <aside className="detail-summary shop-buy-panel">
            <ProductPurchaseBox
              brand={product.brand}
              displaySubtitle={displaySubtitle}
              highlights={highlights}
              optionGroups={product.optionGroups}
              price={product.price}
              skus={product.skus}
              title={product.title}
            />
          </aside>
        </div>
      </section>

      <section className="shop-mini-review-section">
        <div className="shop-mini-review-head">
          <h2>
            4점 이상 리뷰가 <strong>100%</strong>예요
          </h2>
          <Link href="#product-reviews">리뷰 전체보기</Link>
        </div>
        <div className="shop-mini-review-grid">
          {[0, 1, 2].map((index) => (
            <article className="shop-mini-review-card" key={`review-${index}`}>
              <div className="shop-mini-review-image">
                <Image
                  alt={`${product.title} 리뷰 이미지 ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="88px"
                  src={product.gallery[index % product.gallery.length] || product.image}
                  unoptimized
                />
              </div>
              <div>
                <p>
                  <strong>★ 5</strong> 맛 만족도 · 구매 만족
                </p>
                <span>
                  제품 구성이 깔끔하고 설명이 자세해서 구매 전에 확인하기 좋았어요. 배송 안내도 보기 편했습니다.
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shop-bundle-pick-section">
        <div className="shop-bundle-head">
          <h2>다른 구성 상품 골라 담기</h2>
          <span>함께 구매하기 좋은 상품을 빠르게 담아보세요.</span>
        </div>
        <div className="shop-bundle-card-grid">
          {relatedProducts.slice(0, 3).map((bundleProduct) => (
            <article className="shop-bundle-card" key={bundleProduct.slug}>
              <div className="shop-bundle-image">
                <Image
                  alt={bundleProduct.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 760px) 42vw, 180px"
                  src={bundleProduct.image}
                  unoptimized
                />
              </div>
              <button type="button">담기</button>
              <h3>{bundleProduct.title}</h3>
              <p>{bundleProduct.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shop-detail-banner-section">
        <div className="shop-detail-banner">
          <strong>건강창고 회원 혜택</strong>
          <span>매일 챙기는 영양제, 회원 전용 혜택으로 더 가볍게</span>
        </div>
      </section>

      <section className="subpage-section shop-detail-info-section">
        <div className="shop-detail-body-grid">
          <div className="shop-detail-main-column">
            <ProductDetailAnchorTabs tabs={tabItems} />

            <div className="shop-detail-content-stack">
          <article className="content-panel detail-description-panel shop-detail-section" id="detail-info">
            <h2 className="section-panel-title">상품 상세 정보</h2>

            {detailHtml ? (
              <div
                className="detail-html-content"
                dangerouslySetInnerHTML={{ __html: detailHtml }}
              />
            ) : introParagraphs.length ? (
              <div className="stack-paragraphs is-detail-intro">
                {introParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="detail-copy">등록된 상세 설명이 아직 없습니다.</p>
            )}

            {!detailHtml ? (
              <div className="detail-visual-stack">
                {detailSections.map((section) => (
                  <section className="detail-visual-block" key={`${section.title}-${section.image}`}>
                    <div className="detail-visual-copy">
                      <h3>{section.title}</h3>
                      {section.body ? <p>{section.body}</p> : null}
                      {section.caption ? <span>{section.caption}</span> : null}
                    </div>

                    <div className="detail-visual-media">
                      <Image
                        alt={section.imageAlt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1120px) 100vw, 80vw"
                        src={section.image}
                        unoptimized
                      />
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </article>

          <article className="content-panel shop-policy-section" id="sales-policy">
            <h2 className="section-panel-title">판매정책</h2>
            {salesPolicyText ? (
              <div className="shop-policy-copy">
                {paragraphsFromText(salesPolicyText).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="detail-copy">등록된 판매정책이 없습니다.</p>
            )}
          </article>

          <article className="content-panel shop-policy-section" id="delivery-policy">
            <h2 className="section-panel-title">배송정책</h2>
            {deliveryPolicyText ? (
              <div className="shop-policy-copy">
                {paragraphsFromText(deliveryPolicyText).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="detail-copy">등록된 배송정책이 없습니다.</p>
            )}
          </article>

          <article className="content-panel shop-review-section" id="product-reviews">
            <div className="shop-review-head">
              <h2 className="section-panel-title">상품 후기</h2>
              <strong>{reviewText}</strong>
            </div>
            <div className="shop-review-empty">
              <strong>후기 정보 준비중</strong>
              <span>구매 회원의 후기를 모아볼 수 있도록 준비하고 있습니다.</span>
            </div>
          </article>
            </div>
          </div>

          <aside className="shop-floating-buy-panel">
            <ProductPurchaseBox
              brand={product.brand}
              className="is-compact"
              displaySubtitle=""
              highlights={highlights}
              optionGroups={product.optionGroups}
              price={product.price}
              skus={product.skus}
              title={product.title}
            />
          </aside>
        </div>
      </section>

      <section className="section-block" id="related-products">
        <div className="section-head shop-section-head">
          <div>
            <h3>함께 보면 좋은 상품</h3>
          </div>
          <Link className="more-link" href="/products/recommend">
            추천 전체보기
          </Link>
        </div>

        <div className="product-grid product-grid-three shop-product-grid">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard
              key={relatedProduct.slug}
              label={relatedProduct.badge}
              product={relatedProduct}
            />
          ))}
        </div>
      </section>
      </ProductPurchaseProvider>
    </StoreShell>
  );
}
