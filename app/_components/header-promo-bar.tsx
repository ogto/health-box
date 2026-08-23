"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const PROMO_HIDE_KEY = "health-box-promo-hidden-on:v1";
const PROMO_SYNC_EVENT = "health-box-promo-sync";

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function subscribeToPromoStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PROMO_SYNC_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PROMO_SYNC_EVENT, callback);
  };
}

function promoHiddenSnapshot() {
  try {
    return window.localStorage.getItem(PROMO_HIDE_KEY) === getTodayKey();
  } catch {
    return false;
  }
}

export function HeaderPromoBar({ label = "3,000원 회원가입 쿠폰" }: { label?: string }) {
  const hiddenForToday = useSyncExternalStore(subscribeToPromoStorage, promoHiddenSnapshot, () => false);
  const [hiddenForSession, setHiddenForSession] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  function handleClose() {
    try {
      if (hideToday) {
        window.localStorage.setItem(PROMO_HIDE_KEY, getTodayKey());
      } else {
        window.localStorage.removeItem(PROMO_HIDE_KEY);
      }
      window.dispatchEvent(new Event(PROMO_SYNC_EVENT));
    } catch {
      // Ignore storage errors and only close the banner for this session.
    }

    setHiddenForSession(true);
  }

  if (hiddenForToday || hiddenForSession) {
    return null;
  }

  return (
    <div className="header-promo">
      <Link className="header-promo-link" href="/signup">
        {label}
      </Link>

      <div className="header-promo-meta">
        <label className="header-promo-dismiss-label">
          <input
            checked={hideToday}
            className="header-promo-dismiss"
            onChange={(event) => setHideToday(event.target.checked)}
            type="checkbox"
          />
          <span>오늘 하루 보지 않기</span>
        </label>

        <button
          aria-label="쿠폰 배너 닫기"
          className="header-promo-close"
          onClick={handleClose}
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}
