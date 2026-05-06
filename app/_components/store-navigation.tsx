"use client";

import Link from "next/link";
import { useState } from "react";

import type { StorefrontNavigationItem, StorefrontNavigationSubItem } from "../_lib/storefront-config";

type StoreCategoryItem = StorefrontNavigationSubItem & {
  visible?: boolean;
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

  return (
    <nav className="main-nav">
      {navigation.filter((item) => item.visible !== false).map((item) => {
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
                className="main-nav-category-trigger"
                onFocus={() => setOpenMenuKey(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ) : (
              <Link className={activeKey === item.key ? "is-active" : ""} href={item.href}>
                {item.label}
              </Link>
            )}
            {isCategory ? (
              <div className="category-mega-menu">
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
                        <strong>{category.label}</strong>
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
