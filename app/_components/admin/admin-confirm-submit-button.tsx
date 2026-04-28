"use client";

import { useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function AdminConfirmSubmitButton({
  children,
  className = "admin-button",
  confirmMessage,
  confirmTitle = "처리 확인",
  form,
  tone = "default",
  pendingLabel = "처리중...",
}: {
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  confirmTitle?: string;
  form: string;
  tone?: "danger" | "default";
  pendingLabel?: string;
}) {
  const descriptionId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function submitTargetForm() {
    const targetForm = document.getElementById(form);

    if (!(targetForm instanceof HTMLFormElement)) {
      setOpen(false);
      return;
    }

    setSubmitting(true);
    targetForm.requestSubmit();
  }

  return (
    <>
      <button className={className} disabled={submitting} form={form} onClick={() => setOpen(true)} type="button">
        {submitting ? pendingLabel : children}
      </button>

      {open
        ? createPortal(
            <div
              aria-describedby={descriptionId}
              aria-labelledby={titleId}
              aria-modal="true"
              className="admin-confirm-backdrop"
              onClick={() => {
                if (!submitting) {
                  setOpen(false);
                }
              }}
              role="dialog"
            >
              <div className={`admin-confirm-dialog is-${tone}`} onClick={(event) => event.stopPropagation()}>
                <div className="admin-confirm-icon" aria-hidden="true">
                  !
                </div>
                <div className="admin-confirm-copy">
                  <h2 id={titleId}>{confirmTitle}</h2>
                  <p id={descriptionId}>{confirmMessage}</p>
                </div>
                <div className="admin-confirm-actions">
                  <button className="admin-button secondary" disabled={submitting} onClick={() => setOpen(false)} type="button">
                    취소
                  </button>
                  <button
                    className={`admin-button${tone === "danger" ? " danger" : ""}`}
                    disabled={submitting}
                    onClick={submitTargetForm}
                    type="button"
                  >
                    {submitting ? pendingLabel : "확인"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
