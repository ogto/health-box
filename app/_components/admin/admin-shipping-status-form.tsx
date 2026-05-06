"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { updateShipmentStatusAction } from "../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";

const shipmentStatusOptions = [
  { value: "PENDING", label: "주문 접수" },
  { value: "PREPARING", label: "상품 준비중" },
  { value: "SHIPPED", label: "배송중" },
  { value: "DELIVERED", label: "배송완료" },
];

export function AdminShippingStatusForm({
  courierCompany,
  deliveredAt,
  formId,
  redirectTo,
  shippedAt,
  shipmentId,
  shipmentStatus,
  trackingNo,
}: {
  courierCompany: string;
  deliveredAt: string;
  formId: string;
  redirectTo: string;
  shippedAt: string;
  shipmentId: string;
  shipmentStatus: string;
  trackingNo: string;
}) {
  const normalizedInitialStatus = shipmentStatus.toUpperCase() || "PENDING";
  const trackingLocked = Boolean(trackingNo.trim());
  const [status, setStatus] = useState(normalizedInitialStatus);
  const [localCourierCompany, setLocalCourierCompany] = useState(courierCompany);
  const [localTrackingNo, setLocalTrackingNo] = useState(trackingNo);
  const [message, setMessage] = useState("");

  const shouldOpenTrackingInputs = useMemo(
    () => !trackingLocked && status === "SHIPPED",
    [status, trackingLocked],
  );
  const canCompleteDelivery = trackingLocked || Boolean(localTrackingNo.trim());
  const trackingRequired = status === "SHIPPED" || status === "DELIVERED";
  const trackingDisabled = !shouldOpenTrackingInputs;
  const saveDisabled = trackingRequired && !canCompleteDelivery;

  function validateShippingSubmit(event: FormEvent<HTMLFormElement>) {
    const needsTracking = status === "SHIPPED" || status === "DELIVERED";
    const hasTracking = trackingLocked || Boolean(localTrackingNo.trim());

    if (status === "DELIVERED" && !hasTracking) {
      event.preventDefault();
      setMessage("배송완료는 송장번호가 등록된 주문만 처리할 수 있습니다. 먼저 배송중으로 저장해주세요.");
      return;
    }

    if (needsTracking && !hasTracking) {
      event.preventDefault();
      setMessage("배송중으로 변경하려면 택배사와 송장번호를 입력해주세요.");
      return;
    }

    if (status === "SHIPPED" && !trackingLocked && (!localCourierCompany.trim() || !localTrackingNo.trim())) {
      event.preventDefault();
      setMessage("배송중 최초 처리 시 택배사와 송장번호는 필수입니다.");
      return;
    }

    setMessage("");
  }

  return (
    <div className="admin-status-stack">
      <form action={updateShipmentStatusAction} className="admin-status-stack" id={formId} onSubmit={validateShippingSubmit}>
        <input name="shipmentId" type="hidden" value={shipmentId} />
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <input name="trackingLocked" type="hidden" value={trackingLocked ? "true" : "false"} />
        {trackingLocked ? (
          <>
            <input name="courierCompany" type="hidden" value={courierCompany} />
            <input name="trackingNo" type="hidden" value={trackingNo} />
          </>
        ) : null}

        <label className="admin-field">
          <span>배송 상태</span>
          <select className="admin-select" name="shipmentStatus" onChange={(event) => setStatus(event.target.value)} value={status}>
            {shipmentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-order-form-grid">
          {trackingLocked ? (
            <>
              <div className="admin-field read-only">
                <span>택배사</span>
                <strong>{courierCompany || "-"}</strong>
              </div>
              <div className="admin-field read-only">
                <span>송장 번호</span>
                <strong>{trackingNo || "-"}</strong>
              </div>
            </>
          ) : (
            <>
              <label className="admin-field">
                <span>택배사</span>
                <input
                  className="admin-input"
                  disabled={trackingDisabled}
                  name="courierCompany"
                  onChange={(event) => setLocalCourierCompany(event.target.value)}
                  placeholder={status === "SHIPPED" ? "예: CJ대한통운" : "배송중 선택 시 입력"}
                  readOnly={trackingDisabled}
                  required={shouldOpenTrackingInputs}
                  type="text"
                  value={localCourierCompany}
                />
              </label>
              <label className="admin-field">
                <span>송장 번호</span>
                <input
                  className="admin-input"
                  disabled={trackingDisabled}
                  name="trackingNo"
                  onChange={(event) => setLocalTrackingNo(event.target.value)}
                  placeholder={status === "SHIPPED" ? "송장 번호를 입력하세요" : "배송중 선택 시 입력"}
                  readOnly={trackingDisabled}
                  required={shouldOpenTrackingInputs}
                  type="text"
                  value={localTrackingNo}
                />
              </label>
            </>
          )}
        </div>

        {trackingLocked ? (
          <p className="admin-field-note">송장번호는 배송중 최초 처리 이후 수정할 수 없습니다.</p>
        ) : status === "DELIVERED" ? (
          <p className="admin-field-note is-error">배송완료는 송장번호 등록 후 처리할 수 있습니다. 먼저 배송중으로 저장해주세요.</p>
        ) : status === "SHIPPED" ? (
          <p className="admin-field-note">배송중 최초 처리 시 택배사와 송장번호를 입력해주세요.</p>
        ) : (
          <p className="admin-field-note">택배사와 송장번호는 배송중으로 변경할 때 입력합니다.</p>
        )}

        <div className="admin-order-form-grid">
          <label className="admin-field">
            <span>출고일시</span>
            <input className="admin-input" defaultValue={shippedAt} name="shippedAt" type="datetime-local" />
          </label>
          <label className="admin-field">
            <span>배송완료일시</span>
            <input className="admin-input" defaultValue={deliveredAt} name="deliveredAt" type="datetime-local" />
          </label>
        </div>
      </form>

      {message ? <p className="admin-field-note is-error">{message}</p> : null}

      <AdminConfirmSubmitButton
        className={`admin-button${saveDisabled ? " is-disabled" : ""}`}
        confirmMessage="입력한 배송 상태를 저장할까요?"
        confirmTitle="배송 상태 저장"
        form={formId}
        pendingLabel="저장중..."
      >
        배송 상태 저장
      </AdminConfirmSubmitButton>
    </div>
  );
}
