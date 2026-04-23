import Image from "next/image";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

import { BrandLogo } from "./brand-logo";
import { HeaderPromoBar } from "./header-promo-bar";
import type { Notice, Product } from "../_lib/store-data";
import { storefrontConfig } from "../_lib/storefront-config";

type ActiveKey = "best" | "promotion" | "recommend" | "etc" | "notice" | "mypage" | "cart" | null;

const mainNavItems: Array<{
  key: Exclude<ActiveKey, "mypage" | "cart" | null>;
  label: string;
  href: string;
}> = [
  { key: "best", label: "식품/간식", href: "/products/best" },
  { key: "recommend", label: "영양제/보조제", href: "/products/recommend" },
  { key: "promotion", label: "드링크", href: "/promotion" },
  { key: "etc", label: "기타", href: "/promotion" },
  { key: "notice", label: "공지사항", href: "/notice" },
];

export function StoreShell({
  children,
  activeKey = null,
}: {
  children: ReactNode;
  activeKey?: ActiveKey;
}) {
  const { brand } = storefrontConfig;

  return (
    <main className="mall-shell">
      <div className="page-wrap">
        <header className="site-header">
          <HeaderPromoBar />

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
              </Link>
            </div>

            <Link aria-label={`${brand.name} 홈`} className="brand-area is-centered is-logo-only" href="/">
              <BrandLogo alt="건강창고 쇼핑몰 로고" className="brand-mark" variant="circle" />
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
          sizes="(max-width: 1024px) 100vw, 25vw"
          src={product.image}
        />
        {label ? (
          <span className={`product-badge${light ? " is-light" : ""}`}>{label}</span>
        ) : null}
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h4>{product.title}</h4>
        <p className="product-subtitle">{product.subtitle}</p>
        <p className="product-price">{product.price}</p>
        {showMeta ? (
          <div className="product-meta">
            <span>{product.review}</span>
            <span>{product.shipping}</span>
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
        d="M4 5h2l2.2 9.5a1 1 0 0 0 1 .8H17a1 1 0 0 0 1-.78L19.5 8H7.2M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
