import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode, SVGProps } from "react";

import { BrandLogo } from "./brand-logo";
import { CartCountBadge } from "./cart-count-badge";
import { HeaderPromoBar } from "./header-promo-bar";
import type { Notice, Product } from "../_lib/store-data";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

type ActiveKey = "best" | "promotion" | "recommend" | "etc" | "notice" | "mypage" | "cart" | null;

const mainNavItems: Array<{
  key: Exclude<ActiveKey, "mypage" | "cart" | null>;
  label: string;
  href: string;
}> = [
  { key: "best", label: "베스트", href: "/products/best" },
  { key: "recommend", label: "추천상품", href: "/products/recommend" },
  { key: "promotion", label: "기획전", href: "/promotion" },
  { key: "etc", label: "건강루틴", href: "/promotion" },
  { key: "notice", label: "공지사항", href: "/notice" },
];

export async function StoreShell({
  children,
  activeKey = null,
}: {
  children: ReactNode;
  activeKey?: ActiveKey;
}) {
  const { assets, brand, dealer, host } = await getStorefrontRuntime();

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
                <CartCountBadge />
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

            <div className="header-search-row" role="search">
              <div className="search-bar">
                <label className="search-field">
                  <SearchIcon className="h-5 w-5" />
                  <input name="keyword" placeholder={brand.searchPlaceholder} type="text" />
                </label>
                <button className="search-button" type="button">
                  검색
                </button>
              </div>
            </div>
          </div>

          <div className="header-nav">
            <nav className="main-nav">
              {mainNavItems.map((item) => (
                <Link
                  className={activeKey === item.key ? "is-active" : ""}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}

export function ProductCard({
  product,
  label,
  light = false,
  showMeta = true,
}: {
  product: Product;
  label?: string;
  light?: boolean;
  showMeta?: boolean;
}) {
  return (
    <Link className="product-card" href={`/product/${product.slug}`}>
      <div className="product-image">
        <Image
          alt={product.title}
          className="object-cover"
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1180px) 50vw, 25vw"
          src={product.image}
        />
        {label ? (
          <span className={`product-badge${light ? " is-light" : ""}`}>{label}</span>
        ) : null}
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
          <p className="product-price">{product.price}</p>
          <span>회원가</span>
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
