"use client";

import { useState } from "react";

import { updateOrderShippingAddressAction } from "../../_actions/health-box-admin";
import { AddressSearchButton } from "../address-search-button";
import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";

export function AdminOrderAddressForm({
  baseAddress,
  detailAddress,
  disabled,
  orderId,
  receiverName,
  receiverPhone,
  redirectTo,
  zipCode,
}: {
  baseAddress: string;
  detailAddress: string;
  disabled: boolean;
  orderId: number;
  receiverName: string;
  receiverPhone: string;
  redirectTo: string;
  zipCode: string;
}) {
  const formId = `admin-order-address-${orderId}`;
  const [localZipCode, setLocalZipCode] = useState(zipCode);
  const [localBaseAddress, setLocalBaseAddress] = useState(baseAddress);

  return (
    <div className="admin-status-stack">
      <form action={updateOrderShippingAddressAction} className="admin-status-stack" id={formId}>
        <input name="orderId" type="hidden" value={String(orderId)} />
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <div className="admin-order-form-grid">
          <label className="admin-field">
            <span>수령인</span>
            <input className="admin-input" defaultValue={receiverName} disabled={disabled} name="receiverName" required />
          </label>
          <label className="admin-field">
            <span>연락처</span>
            <input className="admin-input" defaultValue={receiverPhone} disabled={disabled} name="receiverPhone" required />
          </label>
        </div>
        <label className="admin-field">
          <span>우편번호</span>
          <div className="address-search-row">
            <input
              className="admin-input"
              disabled={disabled}
              name="zipCode"
              onChange={(event) => setLocalZipCode(event.target.value)}
              value={localZipCode}
            />
            {!disabled ? (
              <AddressSearchButton
                onSelect={(address) => {
                  setLocalZipCode(address.zipCode);
                  setLocalBaseAddress(address.baseAddress);
                }}
              />
            ) : null}
          </div>
        </label>
        <label className="admin-field">
          <span>기본 주소</span>
          <input
            className="admin-input"
            disabled={disabled}
            name="baseAddress"
            onChange={(event) => setLocalBaseAddress(event.target.value)}
            required
            value={localBaseAddress}
          />
        </label>
        <label className="admin-field">
          <span>상세 주소</span>
          <input className="admin-input" defaultValue={detailAddress} disabled={disabled} name="detailAddress" />
        </label>
      </form>
      {disabled ? (
        <p className="admin-field-note">출고가 시작된 주문은 배송지를 수정할 수 없습니다.</p>
      ) : (
        <AdminConfirmSubmitButton
          className="admin-button secondary"
          confirmMessage="입력한 수령인과 배송지로 변경할까요?"
          confirmTitle="배송지 정보 수정"
          form={formId}
          pendingLabel="저장중..."
        >
          배송지 저장
        </AdminConfirmSubmitButton>
      )}
    </div>
  );
}
