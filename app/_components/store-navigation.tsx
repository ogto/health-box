"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import type { StorefrontNavigationItem, StorefrontNavigationSubItem } from "../_lib/storefront-config";

type StoreCategoryItem = StorefrontNavigationSubItem & {
  visible?: boolean;
};

const allProductsNavigationItem: StorefrontNavigationItem = {
  href: "/products/all",
  key: "all-products",
  label: "전체상품",
  style: "link",
  visible: true,
};

export function StoreNavigation({
  activeKey,
  categories,
  navigation,
}: {
  activeKey: string | null;
  categories: ReadonlyArray<StoreCategoryItem>;
  navigation: ReadonlyArray<StorefrontNavigationItem>;
}) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [mobileMenuPosition, setMobileMenuPosition] = useState({ left: 16, top: 0 });
  const menuOpenScrollYRef = useRef(0);

  useEffect(() => {
    if (!openMenuKey) {
      return;
    }

    const closeMenuOnScroll = () => {
      if (Math.abs(window.scrollY - menuOpenScrollYRef.current) > 8) {
        setOpenMenuKey(null);
      }
    };
    const closeMenu = () => setOpenMenuKey(null);
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuKey(null);
      }
    };

    window.addEventListener("scroll", closeMenuOnScroll, { passive: true });
    window.addEventListener("resize", closeMenu);
    window.addEventListener("keydown", closeMenuOnEscape);

    return () => {
      window.removeEventListener("scroll", closeMenuOnScroll);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [openMenuKey]);

  const toggleCategoryMenu = (key: string, button: HTMLButtonElement) => {
    if (openMenuKey === key) {
      setOpenMenuKey(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const mobileMenuWidth = Math.min(340, window.innerWidth - 24);
    setMobileMenuPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - mobileMenuWidth - 12)),
      top: rect.bottom + 1,
    });
    menuOpenScrollYRef.current = window.scrollY;
    setOpenMenuKey(key);
  };

  const visibleNavigation = navigation.filter((item) => item.visible !== false);
  const hasVisibleCategoryMenu = visibleNavigation.some((item) => item.style === "category");
  const navigationWithAllProducts = hasVisibleCategoryMenu
    ? visibleNavigation.flatMap((item) =>
        item.style === "category" ? [item, allProductsNavigationItem] : [item],
      )
    : [allProductsNavigationItem, ...visibleNavigation];

  return (
    <nav className="main-nav">
      {navigationWithAllProducts.map((item) => {
        const isCategory = item.style === "category";
        const isOpen = isCategory && openMenuKey === item.key;

        return (
          <div
            className={[
              "main-nav-item",
              isCategory ? "has-mega" : "",
              isOpen ? "is-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={item.key}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setOpenMenuKey(null);
              }
            }}
            onMouseEnter={() => {
              if (isCategory) {
                setOpenMenuKey(item.key);
              }
            }}
            onMouseLeave={() => {
              if (isCategory) {
                setOpenMenuKey(null);
              }
            }}
          >
            {isCategory ? (
              <button
                aria-expanded={isOpen}
                className="main-nav-category-trigger"
                onClick={(event) => toggleCategoryMenu(item.key, event.currentTarget)}
                type="button"
              >
                <span className="main-nav-category-trigger-label">{item.label}</span>
              </button>
            ) : (
              <Link className={activeKey === item.key ? "is-active" : ""} href={item.href}>
                {item.label}
              </Link>
            )}
            {isCategory ? (
              <div
                aria-hidden={!isOpen}
                aria-label={`${item.label} 카테고리`}
                className="category-mega-menu"
                style={
                  isOpen
                    ? ({
                        "--category-menu-left": `${mobileMenuPosition.left}px`,
                        "--category-menu-top": `${mobileMenuPosition.top}px`,
                      } as CSSProperties)
                    : undefined
                }
              >
                <div className="category-mega-head">
                  <div className="category-mega-head-copy">
                    <span className="category-mega-eyebrow">
                      <span aria-hidden="true" className="category-mega-eyebrow-mark" />
                      HEALTH CATEGORY
                    </span>
                    <strong>나에게 맞는 건강 카테고리를 찾아보세요</strong>
                    <p>고민과 목적에 따라 필요한 상품을 빠르게 살펴볼 수 있어요.</p>
                  </div>
                  <Link
                    className="category-mega-all-link"
                    href="/products/all"
                    onClick={(event) => {
                      setOpenMenuKey(null);
                      event.currentTarget.blur();
                    }}
                  >
                    전체상품 보기
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="category-mega-inner">
                  {(item.children?.length ? item.children : categories)
                    .filter((category) => ("visible" in category ? category.visible !== false : true))
                    .map((category) => (
                      <Link
                        className="category-mega-link"
                        href={category.href}
                        key={category.key}
                        onClick={(event) => {
                          setOpenMenuKey(null);
                          event.currentTarget.blur();
                        }}
                      >
                        <span aria-hidden="true" className="category-mega-link-mark" />
                        <strong>{category.label}</strong>
                        <span aria-hidden="true" className="category-mega-link-arrow">→</span>
                      </Link>
                    ))}
                  {!(item.children?.length || categories.length) ? (
                    <div className="category-mega-empty">등록된 카테고리가 없습니다.</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
