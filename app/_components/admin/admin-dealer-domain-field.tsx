"use client";

import { useMemo, useState } from "react";

type DealerDomainOption = {
  id: number;
  slug: string;
};

function normalizeDealerDomain(value: string) {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\.everybuy\.co\.kr\/?$/, "")
    .split("/")[0]
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function AdminDealerDomainField({
  currentDealerMallId,
  defaultValue = "",
  dealerDomains,
}: {
  currentDealerMallId?: number;
  defaultValue?: string;
  dealerDomains: DealerDomainOption[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [result, setResult] = useState<"idle" | "empty" | "available" | "duplicate">("idle");
  const normalizedValue = useMemo(() => normalizeDealerDomain(value), [value]);

  function checkDuplicate() {
    if (!normalizedValue) {
      setResult("empty");
      return;
    }

    const duplicated = dealerDomains.some((dealer) => {
      if (currentDealerMallId && dealer.id === currentDealerMallId) {
        return false;
      }

      return normalizeDealerDomain(dealer.slug) === normalizedValue;
    });

    setResult(duplicated ? "duplicate" : "available");
  }

  return (
    <label className="admin-field admin-domain-check-field">
      <span>도메인</span>
      <div className="admin-domain-check-control">
        <input
          className="admin-input"
          name="slug"
          onChange={(event) => {
            setValue(event.target.value);
            setResult("idle");
          }}
          placeholder="예: ogto 또는 ogto.everybuy.co.kr"
          type="text"
          value={value}
        />
        <button className="admin-button secondary" onClick={checkDuplicate} type="button">
          중복확인
        </button>
      </div>
      <p className="admin-field-note">입력한 값은 everybuy.co.kr 하위 도메인으로 사용됩니다.</p>
      {result === "empty" ? <p className="admin-domain-check-message is-error">도메인을 입력해주세요.</p> : null}
      {result === "available" ? <p className="admin-domain-check-message is-success">{normalizedValue}.everybuy.co.kr 사용 가능</p> : null}
      {result === "duplicate" ? <p className="admin-domain-check-message is-error">이미 사용 중인 도메인입니다.</p> : null}
    </label>
  );
}
