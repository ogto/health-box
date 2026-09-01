"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { bulkOrderTaskAction } from "../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";
import { dispatchAdminToast } from "./admin-toast";

export type AdminOrderBulkRow = {
  activeClaim?: { id: number; status: string; type: string };
  baseAddress: string;
  detailAddress: string;
  orderId: number;
  orderNo: string;
  receiverName: string;
  receiverPhone: string;
  shipmentId: number | null;
  zipCode: string;
};

const taskLabels: Record<string, string> = {
  ship: "발송 처리",
  delay: "발송 지연 처리",
  address: "배송지 정보 수정",
  sellerCancel: "판매자 직접취소 처리",
  cancelApproval: "취소 승인처리",
  completedCancel: "구매확정 후 취소처리",
  claimCreate: "반품·교환 접수",
  returnProcess: "반품접수 후 처리",
  exchangeProcess: "교환접수 후 처리",
};

function selectableOrderCheckboxes(formId: string) {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) return [];
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[data-admin-order-select="true"]:not(:disabled)'));
}

export function AdminOrderSelectAllButton({ formId }: { formId: string }) {
  function toggleAll() {
    const checkboxes = selectableOrderCheckboxes(formId);
    const shouldCheck = checkboxes.some((checkbox) => !checkbox.checked);
    checkboxes.forEach((checkbox) => {
      checkbox.checked = shouldCheck;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  return (
    <button className="admin-button secondary small" onClick={toggleAll} type="button">
      전체 선택
    </button>
  );
}

export function AdminOrderBulkActions({
  formId,
  redirectTo = "/admin/orders",
  rows = [],
  task = "",
}: {
  formId: string;
  redirectTo?: string;
  rows?: AdminOrderBulkRow[];
  task?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  function selectableCheckboxes() {
    return selectableOrderCheckboxes(formId);
  }

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    const orderForm = form;
    function handleSelectionChange() {
      setSelectedIds(
        Array.from(orderForm.querySelectorAll<HTMLInputElement>('input[data-admin-order-select="true"]:not(:disabled)'))
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => Number(checkbox.dataset.orderId))
          .filter((value) => Number.isFinite(value) && value > 0),
      );
    }
    orderForm.addEventListener("change", handleSelectionChange);
    return () => orderForm.removeEventListener("change", handleSelectionChange);
  }, [formId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.orderId)),
    [rows, selectedIds],
  );

  function openBulkDialog() {
    const checkedIds = selectableCheckboxes()
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => Number(checkbox.dataset.orderId))
      .filter((value) => Number.isFinite(value) && value > 0);
    setSelectedIds(checkedIds);
    if (!checkedIds.length) {
      dispatchAdminToast("처리할 주문을 먼저 선택해주세요.", "error");
      return;
    }
    setOpen(true);
  }

  if (task === "unpaid") {
    return (
      <button
        className="admin-button secondary small"
        onClick={() => {
          router.refresh();
          dispatchAdminToast("미결제 주문 상태를 다시 조회했습니다.", "success");
        }}
        type="button"
      >
        결제 상태 새로고침
      </button>
    );
  }

  if (!task || task === "prepare") {
    return (
      <div className="admin-order-bulk-actions">
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

  const taskLabel = taskLabels[task] || "일괄 처리";
  const dangerous = task === "sellerCancel" || task === "completedCancel" || task === "cancelApproval";

  return (
    <>
      <div className="admin-order-bulk-actions">
        <span className="admin-order-selected-count">선택 {selectedIds.length}건</span>
        <button className={`admin-button small${dangerous ? " danger" : ""}`} onClick={openBulkDialog} type="button">
          선택 주문 {taskLabel}
        </button>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button aria-label={`${taskLabel} 닫기`} className="admin-info-dialog-backdrop" onClick={() => setOpen(false)} type="button" />
              <div aria-modal="true" className="admin-info-dialog admin-order-bulk-dialog" role="dialog">
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <strong>{taskLabel}</strong>
                    <p>선택한 {selectedRows.length}건을 한 번에 처리합니다.</p>
                  </div>
                  <button aria-label={`${taskLabel} 닫기`} className="admin-info-dialog-close" onClick={() => setOpen(false)} type="button">×</button>
                </div>

                <form action={bulkOrderTaskAction} className="admin-info-dialog-body admin-order-bulk-form">
                  <input name="task" type="hidden" value={task} />
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  {selectedRows.map((row) => (
                    <div key={`hidden-${row.orderId}`}>
                      <input name="selectedOrderId" type="hidden" value={String(row.orderId)} />
                      <input name={`orderLabel:${row.orderId}`} type="hidden" value={row.orderNo} />
                      <input name={`shipmentId:${row.orderId}`} type="hidden" value={String(row.shipmentId || "")} />
                      <input name={`claimId:${row.orderId}`} type="hidden" value={String(row.activeClaim?.id || "")} />
                      <input name={`claimStatus:${row.orderId}`} type="hidden" value={row.activeClaim?.status || ""} />
                    </div>
                  ))}

                  <BulkTaskFields rows={selectedRows} task={task} />

                  {dangerous ? (
                    <div className="admin-order-bulk-warning">
                      결제 승인 취소와 재고 복구가 포함될 수 있습니다. 처리 후 되돌릴 수 없으므로 주문번호를 확인해주세요.
                    </div>
                  ) : null}

                  <div className="admin-order-bulk-dialog-actions">
                    <button className="admin-button secondary" onClick={() => setOpen(false)} type="button">닫기</button>
                    <BulkSubmitButton dangerous={dangerous} label={`${selectedRows.length}건 ${taskLabel}`} />
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function BulkTaskFields({ rows, task }: { rows: AdminOrderBulkRow[]; task: string }) {
  if (task === "ship") {
    return (
      <div className="admin-order-bulk-row-list">
        {rows.map((row) => (
          <fieldset className="admin-order-bulk-row-card" key={row.orderId}>
            <legend>{row.orderNo}</legend>
            <div className="admin-order-form-grid">
              <label className="admin-field">
                <span>택배사</span>
                <input className="admin-input" name={`courierCompany:${row.orderId}`} placeholder="예: CJ대한통운" required />
              </label>
              <label className="admin-field">
                <span>송장번호</span>
                <input className="admin-input" name={`trackingNo:${row.orderId}`} required />
              </label>
            </div>
          </fieldset>
        ))}
      </div>
    );
  }

  if (task === "address") {
    return (
      <div className="admin-order-bulk-row-list">
        {rows.map((row) => (
          <fieldset className="admin-order-bulk-row-card" key={row.orderId}>
            <legend>{row.orderNo}</legend>
            <div className="admin-order-form-grid">
              <label className="admin-field"><span>수령인</span><input className="admin-input" defaultValue={row.receiverName} name={`receiverName:${row.orderId}`} required /></label>
              <label className="admin-field"><span>연락처</span><input className="admin-input" defaultValue={row.receiverPhone} name={`receiverPhone:${row.orderId}`} required /></label>
            </div>
            <label className="admin-field"><span>우편번호</span><input className="admin-input" defaultValue={row.zipCode} name={`zipCode:${row.orderId}`} /></label>
            <label className="admin-field"><span>기본 주소</span><input className="admin-input" defaultValue={row.baseAddress} name={`baseAddress:${row.orderId}`} required /></label>
            <label className="admin-field"><span>상세 주소</span><input className="admin-input" defaultValue={row.detailAddress} name={`detailAddress:${row.orderId}`} /></label>
          </fieldset>
        ))}
      </div>
    );
  }

  if (task === "delay") {
    return (
      <div className="admin-status-stack">
        <label className="admin-field"><span>공통 지연 사유</span><textarea className="admin-textarea" maxLength={450} name="reason" required rows={4} /></label>
        <label className="admin-field"><span>예상 출고일</span><input className="admin-input" name="expectedShipDate" type="date" /></label>
      </div>
    );
  }

  if (task === "claimCreate") {
    return (
      <div className="admin-status-stack">
        <label className="admin-field"><span>접수 종류</span><select className="admin-select" defaultValue="RETURN" name="claimType"><option value="RETURN">반품</option><option value="EXCHANGE">교환</option></select></label>
        <label className="admin-field"><span>공통 접수 사유</span><textarea className="admin-textarea" maxLength={450} name="reason" required rows={4} /></label>
      </div>
    );
  }

  return (
    <div className="admin-order-bulk-review-list">
      {rows.map((row) => (
        <div key={row.orderId}>
          <strong>{row.orderNo}</strong>
          {row.activeClaim ? (
            <span>{row.activeClaim.type === "CANCEL" ? "취소" : row.activeClaim.type === "RETURN" ? "반품" : "교환"} · {row.activeClaim.status === "REQUESTED" ? "접수 → 승인" : "승인 → 완료"}</span>
          ) : (
            <span>주문 전체 취소 및 환불</span>
          )}
        </div>
      ))}
    </div>
  );
}

function BulkSubmitButton({ dangerous, label }: { dangerous: boolean; label: string }) {
  const { pending } = useFormStatus();
  return <button className={`admin-button${dangerous ? " danger" : ""}`} disabled={pending} type="submit">{pending ? "처리중..." : label}</button>;
}
