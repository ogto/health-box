import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BundleProductPicker } from "../../_components/bundle-product-picker";
import { ProductDetailAnchorTabs, type ProductDetailAnchorTab } from "../../_components/product-detail-anchor-tabs";
import { ProductDetailGallery } from "../../_components/product-detail-gallery";
import { ProductInquirySection } from "../../_components/product-inquiry-section";
import { ProductPurchaseBox, ProductPurchaseProvider } from "../../_components/product-purchase-controls";
import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import { getMemberSession } from "../../_lib/member-auth";
import { fetchPublicProductInquiries } from "../../_lib/product-inquiries";
import {
  fetchStoreProductBySlug,
  fetchStoreProducts,
} from "../../_lib/storefront-content";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";

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

const hiddenBadgeTexts = new Set(["best", "인기", "추천", "신상품", "정상판매", "상품", "공개", "판매중"]);

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
  const [product, products, session, runtime] = await Promise.all([
    fetchStoreProductBySlug(slug),
    fetchStoreProducts({ size: 200 }),
    getMemberSession(),
    getStorefrontRuntime(),
  ]);

  if (!product) {
    notFound();
  }

  const showPrice = Boolean(session);
  const relatedProducts = products.filter((entry) => entry.slug !== product.slug).slice(0, 4);
  const configuredBundleProducts = (product.bundleProductSlugs?.length
    ? product.bundleProductSlugs
        .map((bundleSlug) =>
          products.find((entry) => entry.slug === bundleSlug || entry.sourceSlug === bundleSlug),
        )
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : relatedProducts.slice(0, 3));
  const inquiries = product.id ? await fetchPublicProductInquiries(product.id, session) : [];
  const salesPolicyText = meaningfulText(product.salesPolicyText);
  const deliveryPolicyText =
    meaningfulText(product.deliveryPolicyText) ||
    meaningfulText(runtime.commerce.deliveryGuide) ||
    meaningfulText(product.shipping);
  const exchangeReturnGuide =
    meaningfulText(product.exchangeReturnGuide) || meaningfulText(runtime.commerce.exchangeReturnGuide);
  const safetyTip = meaningfulText(product.safetyTip) || meaningfulText(runtime.commerce.safetyTip);
  const remoteAreaNotice = runtime.commerce.remoteAreaFee > 0
    ? `제주 및 도서산간 지역은 무료배송 조건과 관계없이 추가 배송비 ${runtime.commerce.remoteAreaFee.toLocaleString("ko-KR")}원이 부과됩니다.`
    : "";
  const reviewText = meaningfulText(product.review) || "후기 정보 준비중";
  const policyTextKeys = new Set(
    [salesPolicyText, deliveryPolicyText, product.shipping].map((text) => normalizeText(text || "")).filter(Boolean),
  );
  const highlights = uniqueTexts([product.category, ...product.highlights])
    .filter((highlight) => !policyTextKeys.has(normalizeText(highlight)) && !hiddenBadgeTexts.has(normalizeText(highlight)))
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
  const detailHtml = sanitizeRichHtml(product.detailHtml || "");
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
    { id: "product-disclosure", label: "상품정보고시" },
    { id: "purchase-information", label: "구매안내" },
    { id: "delivery-policy", label: "배송/교환/반품" },
    { id: "product-inquiries", label: "상품문의" },
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
              consumerPrice={product.consumerPrice}
              displaySubtitle={displaySubtitle}
              highlights={highlights}
              isMember={Boolean(session)}
              optionGroups={product.optionGroups}
              price={product.price}
              memberPrice={product.memberPrice}
              priceExposurePolicy={product.priceExposurePolicy}
              productImage={product.image}
              productSlug={product.slug}
              skus={product.skus}
              title={product.title}
            />
          </aside>
        </div>
      </section>

      <BundleProductPicker isMember={showPrice} products={configuredBundleProducts} />

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

          <article className="content-panel shop-policy-section" id="product-disclosure">
            <h2 className="section-panel-title">상품정보 제공고시</h2>
            {product.disclosureSource === "DETAIL_HTML" ? (
              <p className="detail-copy">상품정보 제공고시 내용은 위 상품 상세페이지를 참조해주세요.</p>
            ) : product.disclosureItems?.length ? (
              <dl className="product-information-table">
                {product.disclosureItems.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="detail-copy">상품정보 제공고시가 아직 등록되지 않았습니다.</p>
            )}
          </article>

          <article className="content-panel shop-policy-section" id="purchase-information">
            <h2 className="section-panel-title">구매 추가정보 및 판매 안내</h2>
            {product.purchaseInformation?.length ? (
              <dl className="product-information-table">
                {product.purchaseInformation.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {salesPolicyText ? (
              <div className="shop-policy-copy">
                {paragraphsFromText(salesPolicyText).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            ) : !product.purchaseInformation?.length ? (
              <p className="detail-copy">별도로 등록된 구매 추가정보가 없습니다.</p>
            ) : null}
          </article>

          <article className="content-panel shop-policy-section" id="delivery-policy">
            <h2 className="section-panel-title">배송·교환·반품 안내</h2>
            <div className="shop-policy-subsection">
              <h3>배송 안내</h3>
              <div className="shop-policy-copy">
                {paragraphsFromText(deliveryPolicyText).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {remoteAreaNotice ? <p>{remoteAreaNotice}</p> : null}
              </div>
            </div>
            <div className="shop-policy-subsection">
              <h3>교환·반품 안내</h3>
              <div className="shop-policy-copy">
                {paragraphsFromText(exchangeReturnGuide).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
            {product.cautions ? (
              <div className="shop-policy-subsection">
                <h3>주의사항</h3>
                <div className="shop-policy-copy">
                  {paragraphsFromText(product.cautions).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            ) : null}
            {safetyTip ? (
              <div className="shop-policy-subsection is-safety-tip">
                <h3>쇼핑안전거래 TIP</h3>
                <div className="shop-policy-copy">
                  {paragraphsFromText(safetyTip).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </div>
            ) : null}
            <div className="shop-policy-subsection">
              <h3>판매자정보</h3>
              <dl className="product-information-table is-compact">
                <div><dt>상호</dt><dd>{runtime.seller.companyName || runtime.seller.shopName}</dd></div>
                {runtime.seller.representativeName ? <div><dt>대표자</dt><dd>{runtime.seller.representativeName}</dd></div> : null}
                {runtime.seller.businessRegistrationNumber ? <div><dt>사업자등록번호</dt><dd>{runtime.seller.businessRegistrationNumber}</dd></div> : null}
                {runtime.seller.mailOrderRegistrationNumber ? <div><dt>통신판매업 신고</dt><dd>{runtime.seller.mailOrderRegistrationNumber}</dd></div> : null}
                {runtime.seller.businessAddress ? <div><dt>사업장 소재지</dt><dd>{runtime.seller.businessAddress}</dd></div> : null}
                <div><dt>고객센터</dt><dd>{runtime.seller.supportPhone || runtime.dealer?.supportPhone || "판매자 정보에서 확인"}</dd></div>
              </dl>
            </div>
          </article>

          <ProductInquirySection
            initialInquiries={inquiries}
            loggedIn={Boolean(session)}
            productId={product.id}
            productSlug={product.slug}
          />

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
              consumerPrice={product.consumerPrice}
              displaySubtitle=""
              highlights={highlights}
              isMember={Boolean(session)}
              optionGroups={product.optionGroups}
              price={product.price}
              memberPrice={product.memberPrice}
              priceExposurePolicy={product.priceExposurePolicy}
              productImage={product.image}
              productSlug={product.slug}
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
              product={relatedProduct}
              showPrice={showPrice}
            />
          ))}
        </div>
      </section>
      </ProductPurchaseProvider>
    </StoreShell>
  );
}
