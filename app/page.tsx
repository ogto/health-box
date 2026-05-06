import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { NoticeRow, ProductCard, StoreShell } from "./_components/store-ui";
import { getMemberSession } from "./_lib/member-auth";
import { fetchStoreNotices, fetchStoreProducts } from "./_lib/storefront-content";
import { getStorefrontRuntime } from "./_lib/storefront-runtime";

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
  const heroTitle = runtime.dealer
    ? `${runtime.dealer.displayName} 회원을 위한 건강 셀렉션`
    : "오늘 필요한 건강 상품을 한눈에";
  const heroDescription = runtime.dealer
    ? `${runtime.dealer.mallName}에서 추천하는 상품을 빠르게 확인하세요.`
    : "건강창고가 고른 상품을 카테고리별로 둘러보고 나에게 맞는 루틴을 시작하세요.";

  return (
    <StoreShell activeKey="best">
      <section className="shop-hero">
        <Link className="shop-hero-visual" href={heroProduct ? `/product/${heroProduct.slug}` : "/products/best?menu=best"}>
          <Image
            alt={heroProduct?.title || runtime.assets.heroAlt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 64vw"
            src={heroProduct?.image || runtime.assets.heroImage}
          />
          <div className="shop-hero-overlay">
            <strong>{heroProduct?.title || runtime.home.hero.titleLines.join(" ")}</strong>
            <p>{heroProduct?.summary || heroDescription}</p>
          </div>
        </Link>

        <div className="shop-hero-panel">
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
          <div className="shop-hero-actions">
            <Link className="button-primary" href="#best">
              베스트 상품 보기
            </Link>
            <Link className="button-secondary" href="/products/recommend">
              추천 상품 보기
            </Link>
          </div>
          <div className="shop-benefit-grid">
            <div>
              <strong>회원 가격</strong>
              <span>로그인 후 가격 확인</span>
            </div>
            <div>
              <strong>빠른 배송</strong>
              <span>상품별 배송 안내 제공</span>
            </div>
            <div>
              <strong>딜러 추천</strong>
              <span>운영몰별 셀렉션</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-strip">
        <span>회원 가격 확인</span>
        <span>추천 루틴</span>
        <span>상품별 상세 이미지</span>
        <span>공지/배송 안내</span>
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

      <section className="shop-promo-band">
        <div>
          <span>오늘의 루틴</span>
          <strong>함께 찾는 건강 상품을 묶어서 확인하세요</strong>
          <p>가격, 배송, 상세 이미지를 한 번에 비교하고 필요한 상품만 빠르게 담을 수 있습니다.</p>
        </div>
        <Link className="button-primary" href="/promotion?menu=coupon">
          기획전 보기
        </Link>
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
