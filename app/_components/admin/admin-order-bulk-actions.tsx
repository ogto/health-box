"use client";

import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";

export function AdminOrderBulkActions({ formId }: { formId: string }) {
  function toggleAll() {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const checkboxes = Array.from(
      form.querySelectorAll<HTMLInputElement>('input[name="shipmentId"]:not(:disabled)'),
    );
    const shouldCheck = checkboxes.some((checkbox) => !checkbox.checked);
    checkboxes.forEach((checkbox) => {
      checkbox.checked = shouldCheck;
    });
  }

  return (
    <div className="admin-order-bulk-actions">
      <button className="admin-button secondary small" onClick={toggleAll} type="button">
        전체 선택
      </button>
      <AdminConfirmSubmitButton
        className="admin-button small"
        confirmMessage="선택한 주문을 모두 상품 준비중 상태로 변경할까요?"
        confirmTitle="상품 준비 일괄 처리"
        form={formId}
        pendingLabel="처리중..."
      >
        선택 주문 상품 준비
      </AdminConfirmSubmitButton>
    </div>
  );
}
