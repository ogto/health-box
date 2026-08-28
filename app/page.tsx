import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { NoticeRow, ProductCard, StoreShell } from "./_components/store-ui";
import { getMemberSession } from "./_lib/member-auth";
import { fetchStoreNotices, fetchStoreProducts } from "./_lib/storefront-content";
import { getStorefrontRuntime } from "./_lib/storefront-runtime";

function StorefrontVisualLink({
  ariaLabel,
  children,
  className,
  href,
}: {
  ariaLabel: string;
  children: ReactNode;
  className: string;
  href?: string;
}) {
  if (!href) {
    return <div className={className}>{children}</div>;
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <a aria-label={ariaLabel} className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <Link aria-label={ariaLabel} className={className} href={href}>
      {children}
    </Link>
  );
}

export default async function Home() {
  const runtime = await getStorefrontRuntime();

  if (
    runtime.host.hostname === "admin.localhost" ||
    runtime.host.hostname === `admin.${runtime.host.rootDomain}`
  ) {
    redirect("/dashboard");
  }

  const [storeProducts, storeNotices, session] = await Promise.all([
    fetchStoreProducts(),
    fetchStoreNotices(),
    getMemberSession(),
  ]);
  const showPrice = Boolean(session);
  const featuredProducts = storeProducts.slice(0, 4);
  const routineProducts = storeProducts.slice(4, 8).length
    ? storeProducts.slice(4, 8)
    : storeProducts.slice(0, 4);
  const allProducts = storeProducts.slice(0, 8);
  const heroProduct = featuredProducts[0];
  const hasConfiguredHero = Boolean(runtime.configuredMainVisualUrl);
  const heroImage = runtime.configuredMainVisualUrl || heroProduct?.image || runtime.assets.heroImage;
  const heroAlt = hasConfiguredHero
    ? runtime.assets.heroAlt
    : heroProduct?.title || runtime.assets.heroAlt;
  const heroHref = runtime.assets.heroHref ||
    (!hasConfiguredHero && heroProduct ? `/product/${heroProduct.slug}` : undefined);
  const heroVisual = (
    <Image
      alt={heroAlt}
      className="object-cover"
      fill
      fetchPriority="high"
      loading="eager"
      sizes="100vw"
      src={heroImage}
    />
  );

  return (
    <StoreShell>
      <section className="shop-hero is-single" aria-label="메인 비주얼">
        <StorefrontVisualLink
          ariaLabel={hasConfiguredHero ? "메인 비주얼 링크로 이동" : `${heroProduct?.title || "메인 상품"} 보기`}
          className="shop-hero-visual"
          href={heroHref}
        >
          {heroVisual}
        </StorefrontVisualLink>
      </section>

      <section className="section-block shop-home-section" id="best">
        <div className="section-head shop-section-head">
          <div>
            <h3>{runtime.dealer ? `${runtime.dealer.displayName} 베스트 상품` : "지금 많이 보는 상품"}</h3>
          </div>
          <Link className="more-link" href="/products/best?menu=best">
            전체보기
          </Link>
        </div>

        <div className="product-grid shop-product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} showPrice={showPrice} />
          ))}
          {!featuredProducts.length ? (
            <div className="content-panel">
              <p className="detail-copy">등록된 상품이 아직 없습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="shop-middle-banner" aria-label="중간 배너">
        <StorefrontVisualLink
          ariaLabel="중간 배너 링크로 이동"
          className="shop-middle-banner-visual"
          href={runtime.assets.bannerHref}
        >
          <Image
            alt={runtime.assets.bannerAlt}
            className="object-cover"
            fill
            sizes="100vw"
            src={runtime.assets.bannerImage}
          />
        </StorefrontVisualLink>
      </section>

      <section className="section-block shop-home-section" id="recommend">
        <div className="section-head shop-section-head">
          <div>
            <h3>루틴별 추천 상품</h3>
          </div>
          <Link className="more-link" href="/products/recommend">
            추천 전체보기
          </Link>
        </div>

        <div className="product-grid shop-product-grid is-compact">
          {routineProducts.map((product) => (
            <ProductCard key={`routine-${product.slug}`} product={product} showPrice={showPrice} />
          ))}
          {!routineProducts.length ? (
            <div className="content-panel">
              <p className="detail-copy">추천 상품 데이터가 아직 없습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block shop-home-section">
        <div className="section-head shop-section-head">
          <div>
            <h3>한눈에 보는 상품</h3>
          </div>
        </div>

        <div className="product-grid shop-product-grid is-compact">
          {allProducts.map((product) => (
            <ProductCard
              key={`all-${product.slug}`}
              product={product}
              showMeta={false}
              showPrice={showPrice}
            />
          ))}
        </div>
      </section>

      <section className="section-block shop-home-section" id="notice">
        <div className="section-head shop-section-head">
          <div>
            <h3>운영 안내</h3>
          </div>
          <Link className="more-link" href="/notice">
            공지 전체보기
          </Link>
        </div>

        {!runtime.dealer ? (
          <Link
            aria-label="건강창고 온라인 딜러 신청하기"
            className="operation-dealer-banner"
            href="/dealer-apply"
          >
            <Image
              alt="건강창고 온라인 딜러 상시 모집. 무점포, 무자본으로 시작하는 나만의 건강 쇼핑몰"
              height={724}
              sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 1320px) calc(100vw - 64px), 1280px"
              src="/branding/dealer-recruitment-banner.png"
              width={2172}
            />
          </Link>
        ) : null}

        <div className="notice-area shop-notice-area">
          <div className="notice-list">
            {storeNotices.map((notice) => (
              <NoticeRow key={notice.slug} notice={notice} />
            ))}
            {!storeNotices.length ? (
              <div className="content-panel">
                <p className="detail-copy">등록된 공지가 아직 없습니다.</p>
              </div>
            ) : null}
          </div>

          <aside className="support-panel">
            {runtime.home.supportItems.map((item) => (
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
