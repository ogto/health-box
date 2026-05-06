import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs, ProductCard, StoreShell } from "../_components/store-ui";
import { getMemberSession } from "../_lib/member-auth";
import {
  findFirstNavigationItemByPath,
  findNavigationItemByKey,
  resolveNavigationProducts,
} from "../_lib/storefront-config";
import { fetchStoreProducts } from "../_lib/storefront-content";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export default async function PromotionPage({
  searchParams,
}: {
  searchParams?: Promise<{ menu?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getStorefrontRuntime();
  const { assets, dealer, home, navigation } = runtime;
  const menuKey = params?.menu?.trim() || "";
  const activeNavigationItem =
    findNavigationItemByKey(navigation, menuKey) || findFirstNavigationItemByPath(navigation, "/promotion");
  const activeKey = activeNavigationItem?.key || "coupon";
  const pageTitle = activeNavigationItem?.label || "기획전";
  const [storeProducts, session] = await Promise.all([fetchStoreProducts(), getMemberSession()]);
  const showPrice = Boolean(session);
  const promotionProducts = resolveNavigationProducts(storeProducts, activeNavigationItem).slice(0, 12);
  const leadProduct = promotionProducts[0] || null;

  return (
    <StoreShell activeKey={activeKey}>
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: pageTitle },
          ]}
        />

        <div className="promo-banner">
          <div className="promo-copy">
            <p className="section-kicker">{home.banner.kicker}</p>
            <h3>{pageTitle}</h3>
            <p>
              {dealer
                ? `${dealer.displayName} 회원을 위한 ${pageTitle} 상품을 한 번에 확인할 수 있습니다.`
                : `${pageTitle} 메뉴에 맞춰 자주 찾는 건강 루틴 상품을 한 번에 볼 수 있습니다.`}
            </p>
            {leadProduct ? (
              <Link className="button-secondary" href={`/product/${leadProduct.slug}`}>
                대표 상품 상세보기
              </Link>
            ) : null}
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
              <h3>{pageTitle} 상품 모아보기</h3>
            </div>
          </div>

          <div className="product-grid product-grid-three">
            {promotionProducts.map((product, index) => (
              <ProductCard key={`${product.slug}-${index}`} product={product} showPrice={showPrice} />
            ))}
            {!promotionProducts.length ? (
              <div className="content-panel">
                <p className="detail-copy">기획전에 노출할 상품이 아직 없습니다.</p>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </StoreShell>
  );
}
