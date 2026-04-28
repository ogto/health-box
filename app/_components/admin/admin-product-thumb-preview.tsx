"use client";

import Image from "next/image";
import { useEffect, useState, type SVGProps } from "react";

export function AdminProductThumbPreview({
  alt,
  src,
  title,
}: {
  alt: string;
  src: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {src ? (
        <button
          aria-label={`${title} 썸네일 크게 보기`}
          className="admin-product-table-thumb"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Image
            alt={alt}
            className="admin-product-table-thumb-image"
            fill
            sizes="84px"
            src={src}
          />
        </button>
      ) : (
        <div className="admin-product-table-thumb is-empty">
          <span className="admin-row-muted">이미지 없음</span>
        </div>
      )}

      {open && src ? (
        <div
          aria-modal="true"
          className="admin-image-viewer"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="admin-image-viewer-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-image-viewer-head">
              <div className="admin-row-stack">
                <strong>{title}</strong>
                <span>썸네일 원본 보기</span>
              </div>

              <button
                aria-label="이미지 크게 보기 닫기"
                className="admin-image-viewer-close"
                onClick={() => setOpen(false)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="admin-image-viewer-stage">
              <Image
                alt={alt}
                className="admin-image-viewer-image"
                fill
                sizes="(max-width: 1024px) 90vw, 720px"
                src={src}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
