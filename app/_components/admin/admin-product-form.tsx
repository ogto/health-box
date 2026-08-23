"use client";

import { useState, type ComponentPropsWithoutRef, type FormEvent } from "react";

import { saveProductAction } from "../../_actions/health-box-admin";
import { parseInformationLines } from "../../_lib/product-commerce";

type AdminProductFormProps = Omit<ComponentPropsWithoutRef<"form">, "action" | "onSubmit">;

function clearCustomValidity(control: Element | RadioNodeList | null) {
  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement
  ) {
    control.setCustomValidity("");
  }
}

export function AdminProductForm({ children, ...props }: AdminProductFormProps) {
  const [clientError, setClientError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const disclosureSource = form.elements.namedItem("disclosureSource");
    const disclosureItems = form.elements.namedItem("disclosureItems");
    const detailHtml = form.elements.namedItem("detailHtml");
    const consumerPrice = form.elements.namedItem("consumerPrice");
    const memberPrice = form.elements.namedItem("memberPrice");

    [disclosureSource, disclosureItems, consumerPrice, memberPrice].forEach(clearCustomValidity);
    setClientError("");

    let message = "";
    let invalidControl: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;

    if (
      disclosureSource instanceof HTMLSelectElement &&
      disclosureItems instanceof HTMLTextAreaElement &&
      disclosureSource.value === "STRUCTURED" &&
      parseInformationLines(disclosureItems.value).length === 0
    ) {
      message = "상품정보 제공고시는 ‘항목: 내용’ 형식으로 한 개 이상 입력해주세요.";
      invalidControl = disclosureItems;
    } else if (
      disclosureSource instanceof HTMLSelectElement &&
      detailHtml instanceof HTMLInputElement &&
      disclosureSource.value === "DETAIL_HTML" &&
      !detailHtml.value.trim()
    ) {
      message = "상세페이지 참조를 선택한 경우 상품 상세 콘텐츠를 입력해주세요.";
      invalidControl = disclosureSource;
    } else if (
      consumerPrice instanceof HTMLInputElement &&
      memberPrice instanceof HTMLInputElement &&
      Number.isFinite(consumerPrice.valueAsNumber) &&
      consumerPrice.valueAsNumber > 0 &&
      Number.isFinite(memberPrice.valueAsNumber) &&
      memberPrice.valueAsNumber > consumerPrice.valueAsNumber
    ) {
      message = "회원가는 소비자가보다 높을 수 없습니다.";
      invalidControl = memberPrice;
    }

    if (!invalidControl) {
      return;
    }

    event.preventDefault();
    invalidControl.setCustomValidity(message);
    setClientError(message);
    window.requestAnimationFrame(() => {
      invalidControl?.scrollIntoView({ behavior: "smooth", block: "center" });
      invalidControl?.focus({ preventScroll: true });
      invalidControl?.reportValidity();
    });
  }

  return (
    <form action={saveProductAction} onSubmit={handleSubmit} {...props}>
      {clientError ? (
        <div aria-live="assertive" className="admin-feedback admin-product-form-error is-error" role="alert">
          {clientError}
        </div>
      ) : null}
      {children}
    </form>
  );
}
