"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { AdminSubmitButton } from "./admin-submit-button";

export function AdminDealerCreateDialog({
  action,
  hasApi,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hasApi: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button className="admin-button" onClick={() => setOpen(true)} type="button">
        딜러 추가
      </button>

      {typeof document !== "undefined" && open
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button
                aria-label="딜러 추가 닫기"
                className="admin-info-dialog-backdrop"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div
                aria-labelledby={titleId}
                aria-modal="true"
                className="admin-info-dialog admin-dealer-dialog"
                role="dialog"
              >
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <strong id={titleId}>딜러 추가</strong>
                  </div>

                  <button
                    aria-label="딜러 추가 닫기"
                    className="admin-info-dialog-close"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 7l10 10M17 7 7 17"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.9"
                      />
                    </svg>
                  </button>
                </div>

                <div className="admin-info-dialog-body">
                  <form action={action} className="admin-status-stack">
                    <input name="redirectTo" type="hidden" value="/admin/dealers" />
                    <div className="admin-field-grid two">
                      <label className="admin-field">
                        <span>딜러몰 이름</span>
                        <input className="admin-input" name="mallName" placeholder="예: 강남웰니스몰" type="text" />
                      </label>
                      <label className="admin-field">
                        <span>표시명 (선택)</span>
                        <input className="admin-input" name="displayName" placeholder="비우면 딜러몰 이름 사용" type="text" />
                      </label>
                    </div>

                    <div className="admin-field-grid two">
                      <label className="admin-field">
                        <span>slug</span>
                        <input className="admin-input" name="slug" placeholder="예: gangnam-wellness" type="text" />
                      </label>
                      <label className="admin-field">
                        <span>담당자 이름</span>
                        <input className="admin-input" name="applicantName" placeholder="담당자명 입력" type="text" />
                      </label>
                    </div>

                    <div className="admin-field-grid two">
                      <label className="admin-field">
                        <span>로그인 이메일</span>
                        <input className="admin-input" name="email" placeholder="login@example.com" type="email" />
                      </label>
                      <label className="admin-field">
                        <span>휴대폰 번호</span>
                        <input className="admin-input" name="phone" placeholder="010-0000-0000" type="text" />
                      </label>
                    </div>

                    <label className="admin-field">
                      <span>메모</span>
                      <textarea className="admin-textarea" name="reviewMemo" placeholder="필요 시 메모 입력" />
                    </label>

                    {hasApi ? (
                      <div className="admin-dealer-dialog-actions">
                        <button
                          className="admin-button secondary"
                          onClick={() => setOpen(false)}
                          type="button"
                        >
                          취소
                        </button>
                        <AdminSubmitButton className="admin-button" pendingLabel="추가중...">
                          딜러 추가
                        </AdminSubmitButton>
                      </div>
                    ) : (
                      <div className="admin-row-muted">API 미연결 상태입니다.</div>
                    )}
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
