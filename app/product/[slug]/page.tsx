import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailGallery } from "../../_components/product-detail-gallery";
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
  const highlights = uniqueTexts([product.category, product.shipping, product.badge, ...product.highlights]).slice(0, 5);
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
  const shippingText = meaningfulText(product.shipping) || "배송 정보는 상품별 운영 기준에 따라 안내됩니다.";
  const reviewText = meaningfulText(product.review) || "준비중";
  const subtitleText = meaningfulText(product.subtitle);
  const displaySubtitle =
    subtitleText && normalizeText(subtitleText) !== normalizeText(introParagraphs[0] || "")
      ? subtitleText
      : "";

  return (
    <StoreShell>
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
            <div className="detail-chip-row">
              {highlights.slice(0, 3).map((highlight, index) => (
                <span className={`detail-chip${index === 0 ? " primary" : ""}`} key={highlight}>
                  {highlight}
                </span>
              ))}
            </div>

            <p className="detail-brand">{product.brand}</p>
            <h1 className="detail-title">{product.title}</h1>
            {displaySubtitle ? <p className="detail-subtitle">{displaySubtitle}</p> : null}

            <div className="price-panel shop-price-panel">
              <div>
                <p className="price-label">회원 전용가</p>
                <p className="price-value">{product.price}</p>
              </div>
              <p className="price-note">로그인 후 회원 조건에 맞는 가격과 구매 기능을 확인할 수 있습니다.</p>
            </div>

            <div className="shop-purchase-box">
              <div className="shop-purchase-row">
                <span>배송 안내</span>
                <strong>{shippingText}</strong>
              </div>
              <div className="shop-purchase-row">
                <span>상품 후기</span>
                <strong>{reviewText}</strong>
              </div>
            </div>

            <div className="detail-action-row">
              <Link className="button-secondary" href="/cart">
                장바구니 담기
              </Link>
              <Link className="button-primary" href="/cart">
                바로 구매하기
              </Link>
            </div>

            <div className="shop-safe-note">
              <strong>구매 전 확인</strong>
              <span>상품 이미지와 상세 정보를 확인한 뒤 주문을 진행하세요.</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="subpage-section">
        <div className="shop-detail-tabs">
          <a href="#detail-info">상품정보</a>
          <a href="#delivery-info">배송/교환</a>
          <a href="#related-products">추천상품</a>
        </div>

        <div className="detail-body-grid shop-detail-body-grid">
          <article className="content-panel detail-description-panel" id="detail-info">
            <p className="section-kicker">PRODUCT DETAIL</p>
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

          <aside className="detail-side-stack" id="delivery-info">
            <article className="content-panel shop-info-card">
              <p className="section-kicker">GUIDE</p>
              <h2 className="section-panel-title">추천 포인트</h2>
              <ul className="bullet-list">
                {highlights.length ? highlights.map((item) => <li key={item}>{item}</li>) : null}
                <li>상품별 이미지와 설명을 확인하고 필요한 루틴에 맞춰 선택하세요.</li>
              </ul>
            </article>

            <article className="content-panel shop-info-card">
              <p className="section-kicker">DELIVERY</p>
              <h2 className="section-panel-title">배송 / 교환 안내</h2>
              <ul className="bullet-list">
                <li>{shippingText}</li>
                <li>교환/반품은 상품 수령 후 안내 기준에 따라 접수됩니다.</li>
                <li>회원 로그인 후 장바구니와 결제 기능을 이용할 수 있습니다.</li>
              </ul>
            </article>

            {product.specs.length ? (
              <article className="content-panel shop-info-card">
                <p className="section-kicker">SPEC</p>
                <h2 className="section-panel-title">상품 정보</h2>
                <div className="info-panel compact">
                  {product.specs.map((spec) => (
                    <div className="info-row" key={spec.label}>
                      <strong>{spec.label}</strong>
                      <span>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="section-block" id="related-products">
        <div className="section-head shop-section-head">
          <div>
            <p className="section-kicker">RECOMMEND</p>
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
    </StoreShell>
  );
}
