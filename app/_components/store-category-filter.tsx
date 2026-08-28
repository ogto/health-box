"use client";

import Link from "next/link";
import { useState } from "react";

type StoreCategoryFilterOption = {
  key: string;
  label: string;
};

type StoreCategoryFilterProps = {
  categories: ReadonlyArray<StoreCategoryFilterOption>;
  selectedCategories: ReadonlyArray<string>;
  selectedCategoryIds: ReadonlyArray<number>;
};

function optionDetails(category: StoreCategoryFilterOption) {
  const numericCategoryId = Number(category.key);
  const hasNumericId = Number.isSafeInteger(numericCategoryId) && numericCategoryId > 0;
  const name = hasNumericId ? "categoryId" : "category";
  const value = hasNumericId ? category.key : category.label;

  return {
    hasNumericId,
    inputKey: `${name}:${value}`,
    name,
    numericCategoryId,
    value,
  };
}

export function StoreCategoryFilter(props: StoreCategoryFilterProps) {
  const selectionKey = `${props.selectedCategoryIds.join(",")}|${props.selectedCategories.join(",")}`;

  return <StoreCategoryFilterForm {...props} key={selectionKey} />;
}

function StoreCategoryFilterForm({
  categories,
  selectedCategories,
  selectedCategoryIds,
}: StoreCategoryFilterProps) {
  const [selectedInputs, setSelectedInputs] = useState(() => new Set(
    categories.flatMap((category) => {
      const details = optionDetails(category);
      const selected = details.hasNumericId
        ? selectedCategoryIds.includes(details.numericCategoryId)
        : selectedCategories.includes(category.label);

      return selected ? [details.inputKey] : [];
    }),
  ));

  function updateSelection(inputKey: string, checked: boolean) {
    setSelectedInputs((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(inputKey);
      } else {
        next.delete(inputKey);
      }
      return next;
    });
  }

  return (
    <form action="/products/best" className="shop-category-filter" method="get">
      <input name="menu" type="hidden" value="category" />
      <fieldset>
        <legend>카테고리 복수 선택</legend>
        {categories.map((category) => {
          const details = optionDetails(category);
          return (
            <label key={category.key}>
              <input
                checked={selectedInputs.has(details.inputKey)}
                name={details.name}
                onChange={(event) => updateSelection(details.inputKey, event.target.checked)}
                type="checkbox"
                value={details.value}
              />
              <span>{category.label}</span>
            </label>
          );
        })}
      </fieldset>
      <div>
        <button className="button-primary" type="submit">선택 적용</button>
        <Link
          className="button-secondary"
          href="/products/best?menu=category"
          onClick={() => setSelectedInputs(new Set())}
        >
          선택 초기화
        </Link>
      </div>
    </form>
  );
}
