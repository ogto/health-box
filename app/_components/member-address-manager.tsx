"use client";

import { useEffect, useMemo, useState } from "react";

import { addressAlias, addressLine, isDefaultAddress, type MemberAddress, type MemberAddressPayload } from "../_lib/member-address";
import { AddressSearchButton } from "./address-search-button";

const emptyForm: MemberAddressPayload = {
  addressAlias: "",
  receiverName: "",
  receiverPhone: "",
  zipCode: "",
  baseAddress: "",
  detailAddress: "",
  defaultYn: "N",
};

async function requestJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string; ok?: boolean };
  if (!response.ok || data.ok === false) {
    throw new Error(data.message || "요청을 처리하지 못했습니다.");
  }
  return data;
}

export function MemberAddressManager() {
  const [addresses, setAddresses] = useState<MemberAddress[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MemberAddressPayload>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedAddresses = useMemo(
    () => [...addresses].sort((a, b) => Number(isDefaultAddress(b)) - Number(isDefaultAddress(a)) || b.id - a.id),
    [addresses],
  );

  async function loadAddresses() {
    try {
      const data = await requestJson<{ addresses: MemberAddress[] }>("/api/member/addresses");
      setAddresses(data.addresses || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "배송지를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    void loadAddresses();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(addresses.length ? emptyForm : { ...emptyForm, defaultYn: "Y" });
    setMessage("");
    setError("");
    setModalOpen(true);
  }

  function startEdit(address: MemberAddress) {
    setEditingId(address.id);
    setMessage("");
    setError("");
    setForm({
      receiverName: address.receiverName || "",
      addressAlias: addressAlias(address),
      receiverPhone: address.receiverPhone || "",
      zipCode: address.zipCode || "",
      baseAddress: address.baseAddress || "",
      detailAddress: address.detailAddress || "",
      defaultYn: isDefaultAddress(address) ? "Y" : "N",
    });
    setModalOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(false);
  }

  async function saveAddress() {
    setMessage("");
    setError("");
    if (!form.addressAlias.trim() || !form.receiverName.trim() || !form.receiverPhone.trim() || !form.baseAddress.trim()) {
      setError("별칭, 받는 분, 연락처, 주소를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/member/addresses/${editingId}` : "/api/member/addresses";
      const method = editingId ? "PUT" : "POST";
      const data = await requestJson<{ address: MemberAddress; message?: string }>(url, {
        method,
        body: JSON.stringify(form),
      });
      setMessage(data.message || "배송지를 저장했습니다.");
      resetForm();
      await loadAddresses();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "배송지를 저장하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAddress(addressId: number) {
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await requestJson(`/api/member/addresses/${addressId}`, { method: "DELETE" });
      setMessage("배송지를 삭제했습니다.");
      if (editingId === addressId) {
        resetForm();
      }
      await loadAddresses();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "배송지를 삭제하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="address-template-manager">
      <div className="address-template-toolbar">
        <div>
          <strong>저장된 배송지</strong>
          <span>총 {sortedAddresses.length}개</span>
        </div>
        <button className="button-primary address-add-button" onClick={startCreate} type="button">
          배송지 추가
        </button>
      </div>

      {message ? <div className="member-auth-alert is-success">{message}</div> : null}
      {error && !modalOpen ? <div className="member-auth-alert is-error">{error}</div> : null}

      <div className="address-template-list">
        {sortedAddresses.map((address) => (
          <article className="address-template-card" key={address.id}>
            <div className="address-template-main">
              <div className="address-template-title">
                <strong>{addressAlias(address)}</strong>
                {isDefaultAddress(address) ? <span>기본</span> : null}
              </div>
              <p>{address.receiverName} · {address.receiverPhone}</p>
              <small>{addressLine(address)}</small>
            </div>
            <div className="address-template-actions">
              <button className="address-action-button" onClick={() => startEdit(address)} type="button">
                수정
              </button>
              <button className="address-action-button is-danger" disabled={loading} onClick={() => void deleteAddress(address.id)} type="button">
                삭제
              </button>
            </div>
          </article>
        ))}
        {!sortedAddresses.length ? (
          <div className="info-panel compact">
            <p className="member-auth-empty">저장된 배송지가 없습니다.</p>
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="address-modal-layer" role="presentation">
          <button aria-label="닫기" className="address-modal-backdrop" onClick={resetForm} type="button" />
          <section aria-modal="true" className="address-modal" role="dialog">
            <div className="address-modal-head">
              <div>
                <h2>{editingId ? "배송지 수정" : "배송지 추가"}</h2>
                <p>배송 받을 정보를 입력해주세요.</p>
              </div>
              <button className="address-modal-close" onClick={resetForm} type="button">
                닫기
              </button>
            </div>

            <div className="address-template-form">
              <div className="cart-order-form">
                <label className="member-auth-field">
                  <span>별칭</span>
                  <input className="member-auth-input" onChange={(event) => setForm({ ...form, addressAlias: event.target.value })} placeholder="예: 집, 회사" value={form.addressAlias} />
                </label>
                <label className="member-auth-field">
                  <span>받는 분</span>
                  <input className="member-auth-input" onChange={(event) => setForm({ ...form, receiverName: event.target.value })} value={form.receiverName} />
                </label>
                <label className="member-auth-field">
                  <span>연락처</span>
                  <input className="member-auth-input" inputMode="tel" onChange={(event) => setForm({ ...form, receiverPhone: event.target.value })} value={form.receiverPhone} />
                </label>
                <label className="member-auth-field">
                  <span>우편번호</span>
                  <div className="address-search-row">
                    <input className="member-auth-input" onChange={(event) => setForm({ ...form, zipCode: event.target.value })} value={form.zipCode} />
                    <AddressSearchButton onSelect={(address) => setForm({ ...form, ...address })} />
                  </div>
                </label>
                <label className="member-auth-field">
                  <span>주소</span>
                  <input className="member-auth-input" onChange={(event) => setForm({ ...form, baseAddress: event.target.value })} value={form.baseAddress} />
                </label>
                <label className="member-auth-field">
                  <span>상세주소</span>
                  <input className="member-auth-input" onChange={(event) => setForm({ ...form, detailAddress: event.target.value })} value={form.detailAddress} />
                </label>
                <label className="member-auth-check">
                  <input
                    checked={form.defaultYn === "Y"}
                    onChange={(event) => setForm({ ...form, defaultYn: event.target.checked ? "Y" : "N" })}
                    type="checkbox"
                  />
                  <span>기본 배송지로 사용</span>
                </label>
              </div>

              {error ? <div className="member-auth-alert is-error">{error}</div> : null}

              <div className="address-modal-actions">
                <button className="button-secondary" disabled={loading} onClick={resetForm} type="button">
                  취소
                </button>
                <button className="button-primary" disabled={loading} onClick={() => void saveAddress()} type="button">
                  {loading ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
