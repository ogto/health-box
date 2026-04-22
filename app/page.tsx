import Image from "next/image";
import Link from "next/link";

import { NoticeRow, ProductCard, StoreShell } from "./_components/store-ui";
import { bestProducts, notices, products, recommendedProducts } from "./_lib/store-data";
import { storefrontConfig } from "./_lib/storefront-config";

export default function Home() {
  const { assets, home } = storefrontConfig;

  return (
    <StoreShell>
      <section className="hero-area">
        <div className="hero-copy">
          <p className="section-kicker">{home.hero.kicker}</p>
          <h2>
            {home.hero.titleLines[0]}
            <br />
            {home.hero.titleLines[1]}
          </h2>
          <p className="hero-text">{home.hero.description}</p>
          <div className="hero-buttons">
            <Link className="button-primary" href={home.hero.primaryHref}>
              {home.hero.primaryLabel}
            </Link>
            <Link className="button-secondary" href={home.hero.secondaryHref}>
              {home.hero.secondaryLabel}
            </Link>
          </div>
          <div className="hero-tags">
            {home.hero.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <Image
            src={assets.heroImage}
            alt={assets.heroAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="section-block" id="best">
        <div className="section-head">
          <div>
            <p className="section-kicker">베스트 상품</p>
            <h3>많이 찾는 대표 상품</h3>
          </div>
          <Link className="more-link" href="/products/best">
            베스트상품 전체보기
          </Link>
        </div>

        <div className="product-grid">
          {bestProducts.map((product) => (
            <ProductCard key={product.slug} label={product.badge} product={product} />
          ))}
        </div>
      </section>

      <section className="section-block" id="banner">
        <div className="promo-banner">
          <div className="promo-copy">
            <p className="section-kicker">{home.banner.kicker}</p>
            <h3>{home.banner.title}</h3>
            <p>{home.banner.description}</p>
            <Link className="button-secondary" href={home.banner.ctaHref}>
              {home.banner.ctaLabel}
            </Link>
          </div>

          <div className="promo-visual">
            <Image
              src={assets.bannerImage}
              alt={assets.bannerAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="section-block" id="recommend">
        <div className="section-head">
          <div>
            <p className="section-kicker">추천 상품</p>
            <h3>지금 추천하는 상품</h3>
          </div>
          <Link className="more-link" href="/products/recommend">
            추천상품 전체보기
          </Link>
        </div>

        <div className="product-grid">
          {recommendedProducts.map((item) => {
            const product = products.find((entry) => entry.slug === item.slug);

            if (!product) return null;

            return (
              <ProductCard
                key={product.slug}
                label={item.tag}
                light
                product={product}
                showMeta={false}
              />
            );
          })}
        </div>
      </section>

      <section className="section-block" id="notice">
        <div className="section-head">
          <div>
            <p className="section-kicker">공지사항</p>
            <h3>운영 안내</h3>
          </div>
          <Link className="more-link" href="/notice">
            공지 목록 보기
          </Link>
        </div>

        <div className="notice-area">
          <div className="notice-list">
            {notices.map((notice) => (
              <NoticeRow key={notice.slug} notice={notice} />
            ))}
          </div>

          <aside className="support-panel">
            {home.supportItems.map((item) => (
              <div className="support-item" key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
