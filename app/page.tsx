import Image from "next/image";
import Link from "next/link";

import { NoticeRow, ProductCard, StoreShell } from "./_components/store-ui";
import { fetchStoreNotices, fetchStoreProducts } from "./_lib/storefront-content";
import { getStorefrontRuntime } from "./_lib/storefront-runtime";

export const dynamic = "force-dynamic";

const galleryItems = [
  {
    title: "그린픽스 프레시파워 스무디",
    href: "/product/protein-bulk-nutrition",
    image:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/1d058956a0aad672acd1abca560bf0e6.jpg",
  },
  {
    title: "헬씨엣 그린 밀싹 스무디",
    href: "/product/gut-balance-box",
    image:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/65222a7eab558a72c49bf5c22682ac2a.jpg",
  },
  {
    title: "액티브핏 그린 헬시 스무디",
    href: "/product/omega-lutein-double-care",
    image:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/6afcae36827e2392ee630275883394ef.jpg",
  },
] as const;

const tabLabels = ["베스트", "균형있는", "건강하게", "체중조절"] as const;

export default async function Home() {
  const runtime = await getStorefrontRuntime();
  const [storeProducts, storeNotices] = await Promise.all([
    fetchStoreProducts(),
    fetchStoreNotices(),
  ]);
  const featuredProducts = storeProducts.slice(0, 4);
  const routineProducts = storeProducts.slice(4, 8).length
    ? storeProducts.slice(4, 8)
    : storeProducts.slice(0, 4);
  const habitProducts = storeProducts.slice(0, 8);
  const heroBanners = [
    {
      title: runtime.home.hero.titleLines.join(" "),
      subtitle: runtime.home.hero.description,
      href: runtime.home.hero.primaryHref,
      image: runtime.assets.heroImage,
    },
    {
      title: runtime.home.banner.title,
      subtitle: runtime.home.banner.description,
      href: runtime.home.banner.ctaHref,
      image:
        "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/0ce9d3a711c79687b1441bbde01a58af.jpg",
    },
    {
      title: runtime.dealer ? `${runtime.dealer.displayName} 회원 전용 셀렉션` : "하루를 정리하는 건강 습관",
      subtitle: runtime.dealer
        ? `${runtime.dealer.mallName}에서 자주 찾는 건강식품을 한 곳에서 둘러보세요.`
        : "건강 갤러리에서 먼저 만나는 인기 셀렉션",
      href: "/promotion",
      image:
        "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/4e7afb376812f13557c351beb5138c99.jpg",
    },
  ] as const;

  return (
    <StoreShell>
      <section className="home-hero-showcase">
        <Link className="hero-lead-card" href={heroBanners[0].href}>
          <Image
            alt={heroBanners[0].title}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 68vw"
            src={heroBanners[0].image}
          />
          <div className="hero-overlay">
            <span>MAIN VISUAL</span>
            <strong>{heroBanners[0].title}</strong>
            <p>{heroBanners[0].subtitle}</p>
          </div>
        </Link>

        <div className="hero-side-stack">
          {heroBanners.slice(1).map((item) => (
            <Link className="hero-side-card" href={item.href} key={item.title}>
              <Image
                alt={item.title}
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 32vw"
                src={item.image}
              />
              <div className="hero-side-copy">
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title-centered">
          <p>{runtime.home.hero.kicker}</p>
          <h2>
            {runtime.dealer
              ? `${runtime.dealer.displayName} 회원을 위한 건강 셀렉션`
              : "건강한 삶을 위한 다양한 셀렉션"}
          </h2>
        </div>

        <div className="feature-gallery-grid">
          {galleryItems.map((item) => (
            <Link className="feature-gallery-card" href={item.href} key={item.title}>
              <div className="feature-gallery-image">
                <Image
                  alt={item.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  src={item.image}
                />
              </div>
              <div className="feature-gallery-copy">
                <strong>{item.title}</strong>
                <span>자세히 살펴보기</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <Link className="wide-promo-banner" href="/promotion">
          <Image
            alt={runtime.assets.bannerAlt}
            className="object-cover"
            fill
            sizes="100vw"
            src={runtime.assets.bannerImage}
          />
          <div className="wide-promo-copy">
            <span>{runtime.home.banner.kicker}</span>
            <strong>{runtime.home.banner.title}</strong>
          </div>
        </Link>
      </section>

      <section className="section-block" id="best">
        <div className="section-title-centered">
          <p>{runtime.dealer ? `${runtime.dealer.displayName} 추천 상품` : "건강식품 추천"}</p>
          <h2>
            {runtime.dealer
              ? `${runtime.dealer.displayName} 회원이 많이 찾는 건강식품`
              : "엄선된 건강식품으로 활력 넘치는 하루를 시작하세요"}
          </h2>
        </div>

        <div className="home-tab-row">
          {tabLabels.map((label, index) => (
            <button
              className={`home-tab-button${index === 0 ? " is-active" : ""}`}
              key={label}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} label={product.badge} product={product} />
          ))}
          {!featuredProducts.length ? (
            <div className="content-panel">
              <p className="detail-copy">등록된 대표 상품이 아직 없습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block" id="recommend">
        <div className="section-title-centered">
          <p>다이어트 식품</p>
          <h2>
            {runtime.dealer
              ? `${runtime.dealer.displayName} 회원을 위한 시즌 추천`
              : "맛있고 건강하게, 몸매 관리를 시작하세요"}
          </h2>
        </div>

        <div className="product-grid product-grid-five">
          {routineProducts.map((product) => (
            <ProductCard key={`routine-${product.slug}`} label={product.category} light product={product} />
          ))}
          {!routineProducts.length ? (
            <div className="content-panel">
              <p className="detail-copy">추천 상품 데이터가 아직 없습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title-centered">
          <p>건강한 습관</p>
          <h2>가볍고 건강한 하루의 시작, 지금 바로 경험해보세요</h2>
        </div>

        <div className="product-grid">
          {habitProducts.map((product) => (
            <ProductCard
              key={`habit-${product.slug}`}
              label="NEW"
              light
              product={product}
              showMeta={false}
            />
          ))}
          {!habitProducts.length ? (
            <div className="content-panel">
              <p className="detail-copy">노출 가능한 상품 데이터가 아직 없습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block">
        <div className="home-text-banner">
          <p>{runtime.dealer ? runtime.dealer.mallName : "건강한 선택"}</p>
          <strong>
            {runtime.dealer
              ? `${runtime.dealer.displayName} 회원 전용 건강 루틴을 지금 바로 확인해보세요.`
              : "균형 잡힌 영양과 꾸준한 관리로 건강한 삶을 유지하세요."}
          </strong>
          <Link href="/promotion">자세히 보기</Link>
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
