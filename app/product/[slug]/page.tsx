import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetailGallery } from "../../_components/product-detail-gallery";
import { Breadcrumbs, ProductCard, StoreShell } from "../../_components/store-ui";
import {
  fetchStoreProductBySlug,
  fetchStoreProducts,
} from "../../_lib/storefront-content";

export const dynamic = "force-dynamic";

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

  const relatedProducts = products.filter((entry) => entry.slug !== product.slug).slice(0, 3);

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

        <div className="detail-grid">
          <ProductDetailGallery title={product.title} images={product.gallery} />

          <div className="detail-summary">
            <div className="detail-chip-row">
              <span className="detail-chip primary">{product.category}</span>
              <span className="detail-chip">{product.badge}</span>
              <span className="detail-chip">{product.shipping}</span>
            </div>
            <p className="detail-brand">{product.brand}</p>
            <h2 className="detail-title">{product.title}</h2>
            <p className="detail-subtitle">{product.subtitle}</p>
            <p className="detail-copy">{product.summary}</p>

            <div className="detail-highlight-list">
              {product.highlights.map((highlight) => (
                <span className="detail-pill" key={highlight}>
                  {highlight}
                </span>
              ))}
            </div>

            <div className="price-panel">
              <p className="price-label">회원 전용가</p>
              <p className="price-value">{product.price}</p>
              <p className="price-note">
                회원 승인 후 상세 가격과 구매 기능이 노출됩니다.
              </p>
            </div>

            <div className="detail-action-row">
              <Link className="button-secondary" href="/cart">
                장바구니 담기
              </Link>
              <Link className="button-primary" href="/cart">
                바로 구매하기
              </Link>
            </div>

            <div className="info-panel">
              {product.specs.map((spec) => (
                <div className="info-row" key={spec.label}>
                  <strong>{spec.label}</strong>
                  <span>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="subpage-section">
        <div className="detail-body-grid">
          <article className="content-panel detail-description-panel">
            <p className="section-kicker">상품 정보</p>
            <h3 className="section-panel-title">상세 설명</h3>

            <div className="stack-paragraphs">
              {product.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="detail-visual-stack">
              {product.detailSections.map((section) => (
                <section className="detail-visual-block" key={section.title}>
                  <div className="detail-visual-copy">
                    <h4>{section.title}</h4>
                    <p>{section.body}</p>
                    <span>{section.caption}</span>
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
          </article>

          <aside className="detail-side-stack">
            <article className="content-panel">
              <p className="section-kicker">섭취 가이드</p>
              <h3 className="section-panel-title">추천 루틴</h3>
              <ul className="bullet-list">
                {product.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>기본 루틴 상품과 함께 세트 제안이 가능합니다.</li>
                <li>묶음 구성 여부는 상품별 운영 기준에 따라 달라질 수 있습니다.</li>
              </ul>
            </article>

            <article className="content-panel">
              <p className="section-kicker">배송 / 교환</p>
              <h3 className="section-panel-title">운영 정책</h3>
              <ul className="bullet-list">
                <li>평일 결제 완료 건 기준으로 순차 출고됩니다.</li>
                <li>상품 개봉 후에는 단순 변심 교환/반품이 제한될 수 있습니다.</li>
                <li>회원 승인 이후 장바구니 및 결제 기능이 활성화됩니다.</li>
              </ul>
            </article>
          </aside>
        </div>
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <p className="section-kicker">연관 상품</p>
            <h3>함께 보는 상품</h3>
          </div>
        </div>

        <div className="product-grid product-grid-three">
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
