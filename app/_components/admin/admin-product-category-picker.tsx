"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type ProductCategoryOption = {
  categoryCode?: string;
  id?: number;
  name?: string;
  slug?: string;
};

type NormalizedCategoryOption = {
  id: number;
  label: string;
};

function normalizeCategories(categories: ProductCategoryOption[]) {
  return categories.flatMap<NormalizedCategoryOption>((category) => {
    const id = Number(category.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return [];
    }

    return [{
      id,
      label: category.name || category.categoryCode || `카테고리 ${id}`,
    }];
  });
}

export function AdminProductCategoryPicker({
  categories,
  children,
  defaultPrimaryId,
  defaultSelectedIds = [],
  fallbackLabel = "기본 카테고리",
}: {
  categories: ProductCategoryOption[];
  children?: ReactNode;
  defaultPrimaryId?: number | null;
  defaultSelectedIds?: number[];
  fallbackLabel?: string;
}) {
  const options = normalizeCategories(categories);
  const requestedPrimaryId = Number(defaultPrimaryId);
  const initialPrimaryId =
    Number.isSafeInteger(requestedPrimaryId) && requestedPrimaryId > 0
      ? requestedPrimaryId
      : options[0]?.id || 1;
  const optionIds = new Set(options.map((category) => category.id));
  const [primaryId, setPrimaryId] = useState(initialPrimaryId);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set([
      ...defaultSelectedIds.filter((id) => optionIds.has(id)),
      initialPrimaryId,
    ]),
  );
  const additionalSelectionCount = Array.from(selectedIds).filter((id) => id !== primaryId).length;
  const hasPrimaryOption = options.some((category) => category.id === primaryId);

  const changePrimaryCategory = (nextPrimaryId: number) => {
    if (!Number.isSafeInteger(nextPrimaryId) || nextPrimaryId <= 0 || nextPrimaryId === primaryId) {
      return;
    }

    const previousPrimaryId = primaryId;
    setPrimaryId(nextPrimaryId);
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(previousPrimaryId);
      next.add(nextPrimaryId);
      return next;
    });
  };

  const toggleAdditionalCategory = (categoryId: number, checked: boolean) => {
    if (categoryId === primaryId) {
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }
      return next;
    });
  };

  return (
    <>
      <label className="admin-field admin-primary-category-field">
        <span>대표 카테고리</span>
        <select
          className="admin-select"
          name="categoryId"
          onChange={(event) => changePrimaryCategory(Number(event.target.value))}
          value={String(primaryId)}
        >
          {!hasPrimaryOption ? <option value={primaryId}>{fallbackLabel}</option> : null}
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <small>대표 카테고리는 상품의 기본 분류로 자동 고정됩니다.</small>
      </label>

      {children}

      <fieldset className="admin-product-category-picker span-two">
        <legend>
          <span>추가 카테고리</span>
          <small>추가 선택 {additionalSelectionCount}개</small>
        </legend>
        <input name="categoryIds" type="hidden" value={primaryId} />
        {options.length ? (
          <div className="admin-product-category-grid">
            {options.map((category) => {
              const isPrimary = category.id === primaryId;
              const isSelected = selectedIds.has(category.id);

              return (
                <label
                  className={[
                    "admin-product-category-card",
                    isPrimary ? "is-primary" : "",
                    isSelected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={category.id}
                >
                  <input
                    checked={isSelected}
                    disabled={isPrimary}
                    name="categoryIds"
                    onChange={(event) => toggleAdditionalCategory(category.id, event.target.checked)}
                    type="checkbox"
                    value={category.id}
                  />
                  <span className="admin-product-category-copy">
                    <span>
                      <strong>{category.label}</strong>
                      {isPrimary ? <b>대표</b> : null}
                    </span>
                    <small>
                      {isPrimary
                        ? "대표 카테고리 · 자동 고정"
                        : isSelected
                          ? "추가 노출 선택됨"
                          : "이 카테고리에도 함께 노출"}
                    </small>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="admin-empty-copy">선택할 카테고리가 없습니다.</p>
        )}
      </fieldset>
    </>
  );
}
