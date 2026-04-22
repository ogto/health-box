import Image from "next/image";
import Link from "next/link";
import type { ReactNode, SVGProps } from "react";

import type { Notice, Product } from "../_lib/store-data";
import { storefrontConfig } from "../_lib/storefront-config";

type ActiveKey = "best" | "promotion" | "recommend" | "notice" | "mypage" | "cart" | null;

const mainNavItems: Array<{
  key: Exclude<ActiveKey, "mypage" | "cart" | null>;
  label: string;
  href: string;
}> = [
  { key: "best", label: "베스트상품", href: "/products/best" },
  { key: "promotion", label: "기획전", href: "/promotion" },
  { key: "recommend", label: "추천상품", href: "/products/recommend" },
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
          <div className="header-main">
            <Link className="brand-area" href="/">
              <BrandMark />
              <div className="brand-copy">
                <p>{brand.kicker}</p>
                <h1>{brand.name}</h1>
              </div>
            </Link>

            <form className="search-bar" role="search">
              <button className="search-category" type="button">
                {brand.searchScopeLabel}
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <div className="search-field">
                <SearchIcon className="h-5 w-5 text-[#7c8277]" />
                <input
                  aria-label="상품 검색"
                  placeholder={brand.searchPlaceholder}
                  type="search"
                />
              </div>
              <button className="search-button" type="button">
                검색
              </button>
            </form>

            <div className="header-icons">
              <Link
                aria-label="회원 메뉴"
                className={`icon-button${activeKey === "mypage" ? " is-active" : ""}`}
                href="/mypage"
              >
                <UserIcon className="h-5 w-5" />
              </Link>
              <Link
                aria-label="장바구니"
                className={`icon-button${activeKey === "cart" ? " is-active" : ""}`}
                href="/cart"
              >
                <CartIcon className="h-5 w-5" />
              </Link>
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
            <p className="header-state">{brand.policyMessage}</p>
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

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
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

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m6 9 6 6 6-6"
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
