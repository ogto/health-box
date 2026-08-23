import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode, SVGProps } from "react";

import { BrandLogo } from "./brand-logo";
import { CartCountBadge } from "./cart-count-badge";
import { HeaderPromoBar } from "./header-promo-bar";
import { ProductPriceDisplay } from "./product-price-display";
import { StoreNavigation } from "./store-navigation";
import type { Notice, Product } from "../_lib/store-data";
import { fetchStoreCategories } from "../_lib/storefront-content";
import { getMemberSession } from "../_lib/member-auth";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

type ActiveKey = string | null;

export async function StoreShell({
  children,
  activeKey = null,
}: {
  children: ReactNode;
  activeKey?: ActiveKey;
}) {
  const [{ assets, brand, dealer, host, navigation, seller }, categories, session] = await Promise.all([
    getStorefrontRuntime(),
    fetchStoreCategories(),
    getMemberSession(),
  ]);

  if (host.requestedDealerSlug && !dealer) {
    notFound();
  }

  const promoLabel = dealer
    ? `${dealer.displayName} 회원 전용 혜택`
    : "회원 전용 혜택과 추천 상품을 확인하세요";

  return (
    <main className="mall-shell">
      <div className="page-wrap">
        <header className="site-header">
          <HeaderPromoBar label={promoLabel} />

          <div className="header-main">
            <div className="header-quick-icons">
              <Link
                aria-label="마이페이지"
                className={`icon-button is-plain${activeKey === "mypage" ? " is-active" : ""}`}
                href="/mypage"
              >
                <UserIcon className="h-6 w-6" />
              </Link>
              <Link
                aria-label="장바구니"
                className={`icon-button is-plain${activeKey === "cart" ? " is-active" : ""}`}
                href="/cart"
              >
                <CartIcon className="h-6 w-6" />
                <CartCountBadge loggedIn={Boolean(session)} />
              </Link>
            </div>

            <Link
              aria-label={dealer ? `${dealer.mallName} 홈` : `${brand.name} 홈`}
              className="brand-area is-centered is-logo-only"
              href="/"
            >
              <BrandLogo
                alt="건강창고 로고"
                className="brand-mark"
                src={assets.logoUrl}
                variant="circle"
              />
            </Link>

            <form action="/search" className="header-search-row" role="search">
              <div className="search-bar">
                <label className="search-field">
                  <SearchIcon className="h-5 w-5" />
                  <input minLength={2} name="q" placeholder={brand.searchPlaceholder} type="search" />
                </label>
                <button className="search-button" type="submit">
                  검색
                </button>
              </div>
            </form>
          </div>

          <div className="header-nav">
            <StoreNavigation activeKey={activeKey} categories={categories} navigation={navigation} />
          </div>
        </header>

        {children}

        <footer className="site-footer">
          <div className="site-footer-head">
            <strong>{seller.shopName || brand.name}</strong>
            <nav aria-label="하단 안내">
              <Link href="/notice">공지사항</Link>
              <Link href="/products/best">상품목록</Link>
              <Link href="/mypage">마이페이지</Link>
            </nav>
          </div>
          <div className="site-footer-business">
            {seller.companyName ? <span>상호 {seller.companyName}</span> : null}
            {seller.representativeName ? <span>대표 {seller.representativeName}</span> : null}
            {seller.businessRegistrationNumber ? <span>사업자등록번호 {seller.businessRegistrationNumber}</span> : null}
            {seller.mailOrderRegistrationNumber ? <span>통신판매업 신고 {seller.mailOrderRegistrationNumber}</span> : null}
            {seller.businessAddress ? <span>사업장 소재지 {seller.businessAddress}</span> : null}
            {seller.supportPhone || dealer?.supportPhone ? <span>고객센터 {seller.supportPhone || dealer?.supportPhone}</span> : null}
            {seller.supportEmail || dealer?.supportEmail ? <span>이메일 {seller.supportEmail || dealer?.supportEmail}</span> : null}
          </div>
          <p>상품별 배송·교환·반품 조건과 상품정보 제공고시는 각 상품 상세페이지에서 확인할 수 있습니다.</p>
        </footer>
      </div>
    </main>
  );
}

export function ProductCard({
  product,
  showMeta = true,
  showPrice = true,
  eager = false,
}: {
  product: Product;
  label?: string;
  light?: boolean;
  showMeta?: boolean;
  showPrice?: boolean;
  eager?: boolean;
}) {
  return (
    <Link className="product-card" href={`/product/${product.slug}`}>
      <div className="product-image">
        <Image
          alt={product.title}
          className="object-cover"
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 25vw"
          src={product.image}
        />
        <span className="product-card-quick">상세보기</span>
      </div>
      <div className="product-info">
        <div className="product-card-head">
          <p className="product-brand">{product.brand}</p>
          <span>{product.category}</span>
        </div>
        <h4>{product.title}</h4>
        <p className="product-subtitle">{product.subtitle || product.summary}</p>
        <div className="product-card-price-row">
          <ProductPriceDisplay
            compact
            consumerPrice={product.consumerPrice}
            fallbackPrice={product.price}
            isMember={showPrice}
            memberPrice={product.memberPrice}
            priceExposurePolicy={product.priceExposurePolicy}
          />
        </div>
        {showMeta ? (
          <div className="product-meta">
            <span>{product.review || "후기 준비중"}</span>
            <span>{product.shipping || "배송 정보 확인"}</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function NoticeRow({ notice }: { notice: Notice }) {
  return (
    <Link className="notice-item" href={`/notice/${notice.slug}`}>
      <p>{notice.title}</p>
      <span>{notice.date}</span>
    </Link>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="breadcrumb" className="breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span className="breadcrumb-item" key={`${item.label}-${index}`}>
            {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : item.label}
            {!isLast ? <i>/</i> : null}
          </span>
        );
      })}
    </nav>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M4 5h2l2.2 9.5a1 1 0 0 0 1 .8H17a1 1 0 0 0 1-.78L19.5 8H7.2M8 20h.01M17 20h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
