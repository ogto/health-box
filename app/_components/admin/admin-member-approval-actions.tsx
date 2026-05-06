"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import {
  approveBuyerSignupApplicationAction,
  rejectBuyerSignupApplicationAction,
} from "../../_actions/health-box-admin";

type ConfirmState = {
  formId: string;
  message: string;
  pendingLabel: string;
  title: string;
  tone: "danger" | "default";
} | null;

function ConfirmDialog({
  confirm,
  onClose,
}: {
  confirm: ConfirmState;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [submitting, setSubmitting] = useState(false);

  if (!confirm) {
    return null;
  }

  function submitTargetForm() {
    if (!confirm) {
      return;
    }

    const targetForm = document.getElementById(confirm.formId);
    if (!(targetForm instanceof HTMLFormElement)) {
      onClose();
      return;
    }

    setSubmitting(true);
    targetForm.requestSubmit();
  }

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="admin-confirm-backdrop"
      onClick={() => {
        if (!submitting) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className={`admin-confirm-dialog is-${confirm.tone}`} onClick={(event) => event.stopPropagation()}>
        <div className="admin-confirm-icon" aria-hidden="true">
          !
        </div>
        <div className="admin-confirm-copy">
          <h2 id={titleId}>{confirm.title}</h2>
          <p id={descriptionId}>{confirm.message}</p>
        </div>
        <div className="admin-confirm-actions">
          <button className="admin-button secondary" disabled={submitting} onClick={onClose} type="button">
            취소
          </button>
          <button
            className={`admin-button${confirm.tone === "danger" ? " danger" : ""}`}
            disabled={submitting}
            onClick={submitTargetForm}
            type="button"
          >
            {submitting ? confirm.pendingLabel : "확인"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function AdminMemberApprovalActions({
  applicationId,
  memberName,
}: {
  applicationId: number;
  memberName: string;
}) {
  const approveFormId = useId();
  const rejectFormId = useId();
  const rejectTitleId = useId();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRejectOpen(false);
        setConfirm(null);
      }
    }

    if (rejectOpen || confirm) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirm, rejectOpen]);

  function openApproveConfirm() {
    setConfirm({
      formId: approveFormId,
      message: `${memberName} 회원을 승인하시겠습니까? 승인 후 회원 로그인이 가능해집니다.`,
      pendingLabel: "승인중...",
      title: "회원 승인",
      tone: "default",
    });
  }

  function openRejectConfirm() {
    const targetForm = document.getElementById(rejectFormId);
    if (targetForm instanceof HTMLFormElement && !targetForm.reportValidity()) {
      return;
    }

    setConfirm({
      formId: rejectFormId,
      message: `${memberName} 회원 가입 신청을 반려하시겠습니까? 입력한 사유가 저장됩니다.`,
      pendingLabel: "반려중...",
      title: "회원 반려",
      tone: "danger",
    });
  }

  return (
    <div className="admin-inline-actions admin-cell-center">
      <form action={approveBuyerSignupApplicationAction} id={approveFormId}>
        <input name="applicationId" type="hidden" value={String(applicationId)} />
      </form>
      <button className="admin-button small" onClick={openApproveConfirm} type="button">
        승인
      </button>
      <button className="admin-button secondary small" onClick={() => setRejectOpen(true)} type="button">
        반려
      </button>

      {typeof document !== "undefined" && rejectOpen
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button
                aria-label="반려 사유 닫기"
                className="admin-info-dialog-backdrop"
                onClick={() => setRejectOpen(false)}
                type="button"
              />
              <div
                aria-labelledby={rejectTitleId}
                aria-modal="true"
                className="admin-info-dialog admin-member-approval-dialog"
                role="dialog"
              >
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <strong id={rejectTitleId}>회원 반려</strong>
                    <p>{memberName} 회원의 가입 신청을 반려합니다.</p>
                  </div>

                  <button
                    aria-label="반려 사유 닫기"
                    className="admin-info-dialog-close"
                    onClick={() => setRejectOpen(false)}
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
                  <form action={rejectBuyerSignupApplicationAction} className="admin-status-stack" id={rejectFormId}>
                    <input name="applicationId" type="hidden" value={String(applicationId)} />
                    <label className="admin-field">
                      <span>반려 사유</span>
                      <textarea
                        className="admin-textarea admin-member-approval-textarea"
                        name="rejectReason"
                        placeholder="회원에게 안내할 반려 사유를 입력하세요."
                        required
                      />
                    </label>
                    <div className="admin-dealer-dialog-actions">
                      <button className="admin-button secondary" onClick={() => setRejectOpen(false)} type="button">
                        취소
                      </button>
                      <button className="admin-button danger" onClick={openRejectConfirm} type="button">
                        확인
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
