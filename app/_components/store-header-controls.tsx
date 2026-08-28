"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, SVGProps } from "react";

import { CartCountBadge } from "./cart-count-badge";

type DrawerType = "menu" | "search";

type StoreHeaderControlsProps = {
  activeKey: string | null;
  brandName: string;
  loggedIn: boolean;
  menuItems: ReadonlyArray<HeaderMenuItem>;
  menuTitle: string;
  searchPlaceholder: string;
  searchSuggestions: ReadonlyArray<string>;
};

type HeaderMenuItem = {
  href: string;
  key: string;
  label: string;
};

const RECENT_SEARCH_KEY = "health-box-recent-searches:v1";
const MAX_RECENT_SEARCHES = 6;

function readRecentSearches() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

export function StoreHeaderControls({
  activeKey,
  brandName,
  loggedIn,
  menuItems = [],
  menuTitle,
  searchPlaceholder,
  searchSuggestions = [],
}: StoreHeaderControlsProps) {
  const [activeDrawer, setActiveDrawer] = useState<DrawerType | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchDrawerId = useId();
  const menuDrawerId = useId();

  useEffect(() => {
    if (!activeDrawer) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveDrawer(null);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    if (activeDrawer === "search") {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeDrawer]);

  function openDrawer(type: DrawerType, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    if (type === "search") setRecentSearches(readRecentSearches());
    setActiveDrawer(type);
  }

  function closeDrawer() {
    setActiveDrawer(null);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") || "").trim();
    if (query.length < 2) return;

    const nextSearches = [query, ...recentSearches.filter((item) => item !== query)].slice(
      0,
      MAX_RECENT_SEARCHES,
    );
    try {
      window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(nextSearches));
    } catch {
      // Search navigation should continue even when storage is unavailable.
    }
  }

  function clearRecentSearches() {
    try {
      window.localStorage.removeItem(RECENT_SEARCH_KEY);
    } catch {
      // Keep the visible list in sync even when storage is unavailable.
    }
    setRecentSearches([]);
  }

  return (
    <>
      <button
        aria-controls={menuDrawerId}
        aria-expanded={activeDrawer === "menu"}
        aria-label="전체 메뉴 열기"
        className="store-mobile-menu-trigger"
        onClick={(event) => openDrawer("menu", event.currentTarget)}
        type="button"
      >
        <MenuIcon />
      </button>

      <div className="header-quick-icons">
        <button
          aria-controls={searchDrawerId}
          aria-expanded={activeDrawer === "search"}
          aria-label="상품 검색 열기"
          className={`icon-button is-plain${activeKey === "search" ? " is-active" : ""}`}
          onClick={(event) => openDrawer("search", event.currentTarget)}
          type="button"
        >
          <SearchIcon />
        </button>
        <Link
          aria-label="마이페이지"
          className={`icon-button is-plain store-account-link${activeKey === "mypage" ? " is-active" : ""}`}
          href="/mypage"
        >
          <UserIcon />
        </Link>
        <Link
          aria-label="장바구니"
          className={`icon-button is-plain${activeKey === "cart" ? " is-active" : ""}`}
          href="/cart"
        >
          <CartIcon />
          <CartCountBadge loggedIn={loggedIn} />
        </Link>
      </div>

      {activeDrawer ? (
        <div className={`store-drawer-layer is-${activeDrawer}`}>
          <button
            aria-label={`${activeDrawer === "search" ? "검색" : "전체 메뉴"} 닫기`}
            className="store-drawer-backdrop"
            onClick={closeDrawer}
            type="button"
          />

          {activeDrawer === "search" ? (
            <aside
              aria-labelledby={`${searchDrawerId}-title`}
              aria-modal="true"
              className="store-drawer store-search-drawer"
              id={searchDrawerId}
              role="dialog"
            >
              <div className="store-drawer-head">
                <strong id={`${searchDrawerId}-title`}>검색</strong>
                <button aria-label="검색 닫기" onClick={closeDrawer} type="button">
                  <CloseIcon />
                </button>
              </div>

              <form action="/search" className="store-drawer-search-form" onSubmit={handleSearchSubmit} role="search">
                <input
                  minLength={2}
                  name="q"
                  placeholder={searchPlaceholder}
                  ref={searchInputRef}
                  type="search"
                />
                <button aria-label="검색하기" type="submit">
                  <SearchIcon />
                </button>
              </form>

              <section className="store-drawer-section">
                <div className="store-drawer-section-head">
                  <h2>추천 검색어</h2>
                  <span>지금 많이 찾는 키워드</span>
                </div>
                <ol className="store-search-keywords">
                  {searchSuggestions.map((keyword, index) => (
                    <li key={keyword}>
                      <span>{index + 1}</span>
                      <Link href={`/search?q=${encodeURIComponent(keyword)}`} onClick={closeDrawer}>
                        {keyword}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="store-drawer-section is-recent">
                <div className="store-drawer-section-head">
                  <h2>최근 검색어</h2>
                  {recentSearches.length ? (
                    <button onClick={clearRecentSearches} type="button">전체 삭제</button>
                  ) : null}
                </div>
                {recentSearches.length ? (
                  <div className="store-recent-searches">
                    {recentSearches.map((keyword) => (
                      <Link href={`/search?q=${encodeURIComponent(keyword)}`} key={keyword} onClick={closeDrawer}>
                        {keyword}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="store-drawer-empty">최근 검색한 내역이 없습니다.</p>
                )}
              </section>
            </aside>
          ) : (
            <aside
              aria-labelledby={`${menuDrawerId}-title`}
              aria-modal="true"
              className="store-drawer store-menu-drawer"
              id={menuDrawerId}
              role="dialog"
            >
              <div className="store-drawer-head store-menu-account-head">
                <div>
                  <strong id={`${menuDrawerId}-title`}>
                    {loggedIn ? `${brandName} 회원님` : "로그인 해주세요"}
                  </strong>
                  <p>{loggedIn ? "주문과 회원 혜택을 확인하세요" : "회원가입하고 다양한 혜택을 받아보세요"}</p>
                </div>
                <button aria-label="전체 메뉴 닫기" onClick={closeDrawer} type="button">
                  <CloseIcon />
                </button>
              </div>

              <div className="store-menu-account-actions">
                {loggedIn ? (
                  <>
                    <Link href="/mypage" onClick={closeDrawer}>마이페이지</Link>
                    <Link href="/mypage/orders" onClick={closeDrawer}>주문조회</Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeDrawer}>로그인</Link>
                    <Link href="/signup" onClick={closeDrawer}>회원가입</Link>
                  </>
                )}
              </div>

              <div className="store-mobile-drawer-category-head">
                <strong>{menuTitle}</strong>
                <span>{menuItems.length}개 카테고리</span>
              </div>

              <nav aria-label={`${menuTitle} 카테고리`} className="store-mobile-drawer-nav">
                {menuItems.map((item) => (
                  <Link
                    className={activeKey === item.key ? "is-active" : ""}
                    href={item.href}
                    key={item.key}
                    onClick={closeDrawer}
                  >
                    <span aria-hidden="true" className="category-mega-link-mark" />
                    <strong>{item.label}</strong>
                    <i aria-hidden="true">→</i>
                  </Link>
                ))}
              </nav>

              <div className="store-mobile-drawer-utility">
                <Link href="/notice" onClick={closeDrawer}>공지사항</Link>
                <Link href="/mypage" onClick={closeDrawer}>고객센터</Link>
              </div>
            </aside>
          )}
        </div>
      ) : null}
    </>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="m20 20-4.2-4.2M10.8 17.6a6.8 6.8 0 1 1 0-13.6 6.8 6.8 0 0 1 0 13.6Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="M4 5h2l2.2 9.5a1 1 0 0 0 1 .8H17a1 1 0 0 0 1-.78L19.5 8H7.2M8 20h.01M17 20h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
