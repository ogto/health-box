"use client";

import Link from "next/link";
import { useState } from "react";

export function AdminStorefrontActions() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="admin-storefront-savebar">
      <div className="admin-storefront-savecopy">
        <strong>변경 저장</strong>
        <p>
          현재는 전역 설정 구조와 연결만 먼저 잡아둔 상태입니다. DB/API 연동 전까지는
          저장 동작이 안내형으로 동작합니다.
        </p>
        {message ? <span>{message}</span> : null}
      </div>

      <div className="admin-storefront-saveactions">
        <Link className="admin-button secondary" href="/">
          딜러몰 홈 보기
        </Link>
        <Link className="admin-button secondary" href="/admin/operation-settings">
          운영설정 보기
        </Link>
        <button
          className="admin-button"
          onClick={() =>
            setMessage("실제 저장 API는 아직 연결 전입니다. 현재는 구조와 반영 범위만 먼저 확정한 상태입니다.")
          }
          type="button"
        >
          변경 저장
        </button>
      </div>
    </div>
  );
}
