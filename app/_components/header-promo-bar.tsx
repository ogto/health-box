"use client";

import Link from "next/link";
import { useState } from "react";

const PROMO_HIDE_KEY = "health-box-promo-hidden-on";

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

export function HeaderPromoBar() {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.localStorage.getItem(PROMO_HIDE_KEY) === getTodayKey();
    } catch {
      return false;
    }
  });
  const [hideToday, setHideToday] = useState(false);

  function handleClose() {
    try {
      if (hideToday) {
        window.localStorage.setItem(PROMO_HIDE_KEY, getTodayKey());
      } else {
        window.localStorage.removeItem(PROMO_HIDE_KEY);
      }
    } catch {
      // Ignore storage errors and only close the banner for this session.
    }

    setHidden(true);
  }

  if (hidden) {
    return null;
  }

  return (
    <div className="header-promo">
      <Link className="header-promo-link" href="/notice/membership-price-policy">
        3,000원 회원가입 쿠폰
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
