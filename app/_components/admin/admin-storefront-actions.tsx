"use client";

import Link from "next/link";
import { useState } from "react";

export function AdminStorefrontActions() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="admin-storefront-savebar">
      <div className="admin-storefront-savecopy">
        <strong>저장 미연동</strong>
        <p>현재는 화면 구조만 연결된 상태입니다.</p>
        {message ? <span>{message}</span> : null}
      </div>

      <div className="admin-storefront-saveactions">
        <Link className="admin-button secondary" href="/">
          미리보기
        </Link>
        <button
          className="admin-button"
          onClick={() => setMessage("저장 API 연결 전입니다.")}
          type="button"
        >
          저장
        </button>
      </div>
    </div>
  );
}
