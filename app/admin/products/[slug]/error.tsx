"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-product-detail]", error);
  }, [error]);

  return (
    <div className="admin-page">
      <section className="admin-panel admin-error-panel">
        <span className="admin-error-icon" aria-hidden="true">
          !
        </span>
        <p className="section-kicker">상품 수정</p>
        <h1>상품 수정 화면을 불러오지 못했습니다.</h1>
        <p>
          일시적인 응답 오류이거나 로그인 세션이 만료되었을 수 있습니다. 다시 시도해도 같은 문제가 있으면 상품 목록에서
          다시 진입해 주세요.
        </p>
        <div className="admin-error-actions">
          <button className="admin-button" type="button" onClick={reset}>
            다시 불러오기
          </button>
          <Link className="admin-button secondary" href="/admin/products">
            상품 목록
          </Link>
        </div>
      </section>
    </div>
  );
}
