import Image from "next/image";
import Link from "next/link";

import { NoticeRow, ProductCard, StoreShell } from "./_components/store-ui";
import { bestProducts, notices, products } from "./_lib/store-data";

const heroBanners = [
  {
    title: "건강한 일상을 위한 메인 셀렉션",
    subtitle: "매일 찾게 되는 건강창고 대표 상품",
    href: "/products/best",
    image:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/6dea5f1a6c55e1b8a6845eb0fafb8b38.jpg",
  },
  {
    title: "가볍게 챙기는 데일리 건강 루틴",
    subtitle: "회원 전용가로 확인하는 시즌 추천",
    href: "/products/recommend",
    image:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/0ce9d3a711c79687b1441bbde01a58af.jpg",
  },
  {
    title: "하루를 정리하는 건강 습관",
    subtitle: "건강 갤러리에서 먼저 만나는 인기 셀렉션",
    href: "/promotion",
    image:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/4e7afb376812f13557c351beb5138c99.jpg",
  },
] as const;

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

export default function Home() {
  const featuredProducts = bestProducts.slice(0, 4);
  const routineProducts = products.slice(0, 4);

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
          <p>건강 갤러리</p>
          <h2>건강한 삶을 위한 다양한 셀렉션</h2>
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
            alt="건강창고 기획전 배너"
            className="object-cover"
            fill
            sizes="100vw"
            src="https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/231ac7c6d80e659932cc96d529937e76.jpg"
          />
          <div className="wide-promo-copy">
            <span>EVENT</span>
            <strong>건강 루틴 기획전</strong>
          </div>
        </Link>
      </section>

      <section className="section-block" id="best">
        <div className="section-title-centered">
          <p>건강식품 추천</p>
          <h2>엄선된 건강식품으로 활력 넘치는 하루를 시작하세요</h2>
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
        </div>
      </section>

      <section className="section-block" id="recommend">
        <div className="section-title-centered">
          <p>다이어트 식품</p>
          <h2>맛있고 건강하게, 몸매 관리를 시작하세요</h2>
        </div>

        <div className="product-grid product-grid-five">
          {routineProducts.map((product) => (
            <ProductCard key={`routine-${product.slug}`} label={product.category} light product={product} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title-centered">
          <p>건강한 습관</p>
          <h2>가볍고 건강한 하루의 시작, 지금 바로 경험해보세요</h2>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={`habit-${product.slug}`}
              label="NEW"
              light
              product={product}
              showMeta={false}
            />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="home-text-banner">
          <p>건강한 선택</p>
          <strong>균형 잡힌 영양과 꾸준한 관리로 건강한 삶을 유지하세요.</strong>
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
            {notices.map((notice) => (
              <NoticeRow key={notice.slug} notice={notice} />
            ))}
          </div>

          <aside className="support-panel">
            <div className="support-item">
              <strong>고객센터</strong>
              <span>평일 09:00 - 18:00</span>
            </div>
            <div className="support-item">
              <strong>상담 이메일</strong>
              <span>1everybuy@naver.com</span>
            </div>
            <div className="support-item">
              <strong>배송 안내</strong>
              <span>건강창고 본사에서 순차 출고됩니다.</span>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
