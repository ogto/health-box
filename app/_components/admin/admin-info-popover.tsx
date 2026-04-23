"use client";

import { useEffect, useId, useState, type ReactNode, type SVGProps } from "react";
import { createPortal } from "react-dom";

export function AdminInfoPopover({
  label = "운영 참고",
  children,
}: {
  label?: string;
  children: ReactNode;
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
    <div className={`admin-info-popover${open ? " is-open" : ""}`}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${label} 열기`}
        className="admin-info-popover-button"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <InfoIcon className="admin-info-popover-icon" />
      </button>

      {typeof document !== "undefined" && open
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button
                aria-label={`${label} 닫기`}
                className="admin-info-dialog-backdrop"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div
                aria-labelledby={titleId}
                aria-modal="true"
                className="admin-info-dialog"
                role="dialog"
              >
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <strong id={titleId}>{label}</strong>
                  </div>

                  <button
                    aria-label={`${label} 닫기`}
                    className="admin-info-dialog-close"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="admin-info-dialog-body">{children}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 10.5V16m0-8.5h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}
