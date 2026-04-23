import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs, ProductCard, StoreShell } from "../_components/store-ui";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";
import { products } from "../_lib/store-data";

const promotionProducts = [products[1], products[3], products[0]];

export default async function PromotionPage() {
  const { assets, dealer, home } = await getStorefrontRuntime();

  return (
    <StoreShell activeKey="promotion">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "기획전" },
          ]}
        />

        <div className="promo-banner">
          <div className="promo-copy">
            <p className="section-kicker">{home.banner.kicker}</p>
            <h3>{home.banner.title}</h3>
            <p>
              {dealer
                ? `${dealer.displayName} 회원이 자주 찾는 기본 영양 루틴과 시즌 케어 상품을 한 번에 보는 기획전 페이지입니다.`
                : "자주 찾는 기본 영양 루틴과 재구매가 잦은 건강 루틴 상품을 한 번에 보는 기획전 페이지입니다. 메인 배너에서 보던 흐름을 별도 페이지로 정리했습니다."}
            </p>
            <Link className="button-secondary" href={`/product/${promotionProducts[0].slug}`}>
              대표 상품 상세보기
            </Link>
          </div>

          <div className="promo-visual">
            <Image
              alt={assets.bannerAlt}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              src={assets.bannerImage}
            />
          </div>
        </div>

        <section className="subpage-section">
          <div className="section-head">
            <div>
              <p className="section-kicker">Promotion Picks</p>
              <h3>기획전 상품 모아보기</h3>
            </div>
          </div>

          <div className="product-grid product-grid-three">
            {promotionProducts.map((product) => (
              <ProductCard key={product.slug} label="기획전" light product={product} />
            ))}
          </div>
        </section>
      </section>
    </StoreShell>
  );
}
