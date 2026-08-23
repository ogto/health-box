"use client";

import { useId, useState } from "react";

import type { ProductDisclosureType } from "../../_lib/product-commerce";

type DisclosureSource = "DETAIL_HTML" | "STRUCTURED";

export function AdminProductDisclosureFields({
  defaultDisclosureItems = "",
  defaultDisclosureSource = "STRUCTURED",
  defaultDisclosureType = "HEALTH_FUNCTIONAL_FOOD",
  defaultPurchaseInformation = "",
}: {
  defaultDisclosureItems?: string;
  defaultDisclosureSource?: DisclosureSource;
  defaultDisclosureType?: ProductDisclosureType;
  defaultPurchaseInformation?: string;
}) {
  const hintId = useId();
  const [disclosureSource, setDisclosureSource] = useState<DisclosureSource>(defaultDisclosureSource);
  const structuredInputRequired = disclosureSource === "STRUCTURED";

  return (
    <div className="admin-field-grid two">
      <label className="admin-field">
        <span>상품군</span>
        <select className="admin-select" defaultValue={defaultDisclosureType} name="disclosureType">
          <option value="HEALTH_FUNCTIONAL_FOOD">건강기능식품</option>
          <option value="PROCESSED_FOOD">가공식품</option>
          <option value="GENERAL">기타 재화</option>
        </select>
      </label>
      <label className="admin-field">
        <span>정보 제공 방식</span>
        <select
          className="admin-select"
          name="disclosureSource"
          onChange={(event) => {
            event.currentTarget.setCustomValidity("");
            setDisclosureSource(event.currentTarget.value === "DETAIL_HTML" ? "DETAIL_HTML" : "STRUCTURED");
          }}
          value={disclosureSource}
        >
          <option value="STRUCTURED">구조화 정보 입력</option>
          <option value="DETAIL_HTML">상품 상세페이지 참조</option>
        </select>
      </label>
      <label className="admin-field span-two">
        <span>
          고시 항목
          {structuredInputRequired ? <em className="admin-required-mark">필수</em> : null}
        </span>
        <textarea
          aria-describedby={hintId}
          aria-required={structuredInputRequired}
          className="admin-textarea admin-textarea-tall"
          defaultValue={defaultDisclosureItems}
          name="disclosureItems"
          onChange={(event) => event.currentTarget.setCustomValidity("")}
          placeholder={"식품의 유형: 건강기능식품\n제조자: 제조자 및 소재지\n소비기한: 제품 별도 표시\n소비자상담 전화번호: 0000-0000"}
          required={structuredInputRequired}
        />
        <small className="admin-field-hint" id={hintId}>
          {structuredInputRequired
            ? "‘항목: 내용’ 형식으로 한 개 이상 입력해야 저장할 수 있습니다."
            : "상품 상세 콘텐츠가 입력되어 있어야 상세페이지 참조로 저장할 수 있습니다."}
        </small>
      </label>
      <label className="admin-field span-two">
        <span>구매 추가정보</span>
        <textarea
          className="admin-textarea"
          defaultValue={defaultPurchaseInformation}
          name="purchaseInformation"
          placeholder={"최소 구매수량: 1개\n구매 가능수량: 회원별 최대 10개"}
        />
      </label>
    </div>
  );
}
