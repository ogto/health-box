"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import {
  approveDealerApplicationAction,
  rejectDealerApplicationAction,
} from "../../_actions/health-box-admin";
import type { AdminTone } from "../../_lib/admin-data";
import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";
import { AdminBadge } from "./admin-ui";

export function AdminDealerApplicationActions({
  applicationId,
  applicantName,
  appliedAt,
  businessInfo,
  contact,
  dealerMallId,
  mallName,
  rejectReason,
  slug,
  status,
  statusLabel,
  statusTone,
}: {
  applicationId: number;
  applicantName: string;
  appliedAt: string;
  businessInfo: string;
  contact: string;
  dealerMallId: number | null;
  mallName: string;
  rejectReason: string;
  slug: string;
  status: string;
  statusLabel: string;
  statusTone: AdminTone;
}) {
  const titleId = useId();
  const approveFormId = useId();
  const rejectFormId = useId();
  const [open, setOpen] = useState(false);
  const returnPath = "/admin/dealers#dealer-applications";
  const isPending = /^PENDING$/i.test(status);
  const isRejected = /^REJECTED$/i.test(status);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        className={`admin-button small${isPending ? "" : " secondary"}`}
        onClick={() => setOpen(true)}
        type="button"
      >
        {isPending ? "검토 및 처리" : "상세 보기"}
      </button>

      {typeof document !== "undefined" && open
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button
                aria-label="딜러 신청 검토 닫기"
                className="admin-info-dialog-backdrop"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div
                aria-labelledby={titleId}
                aria-modal="true"
                className="admin-info-dialog admin-dealer-application-dialog"
                role="dialog"
              >
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <div className="admin-dealer-application-dialog-title">
                      <strong id={titleId}>{mallName} 딜러 신청</strong>
                      <AdminBadge tone={statusTone}>{statusLabel}</AdminBadge>
                    </div>
                    <p>신청 내용을 확인하고 처리 내역을 관리할 수 있습니다.</p>
                  </div>
                  <button
                    aria-label="딜러 신청 검토 닫기"
                    className="admin-info-dialog-close"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <svg fill="none" viewBox="0 0 24 24">
                      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
                    </svg>
                  </button>
                </div>

                <div className="admin-info-dialog-body admin-dealer-application-body">
                  <div className="admin-dealer-application-summary">
                    <div>
                      <span>신청자</span>
                      <strong>{applicantName}</strong>
                    </div>
                    <div>
                      <span>연락처</span>
                      <strong title={contact}>{contact}</strong>
                    </div>
                    <div>
                      <span>희망 딜러몰</span>
                      <strong>{mallName}</strong>
                    </div>
                    <div>
                      <span>신청일</span>
                      <strong>{appliedAt}</strong>
                    </div>
                  </div>

                  <div className="admin-dealer-application-domain">
                    <span>희망 주소</span>
                    <strong>{slug}.everybuy.co.kr</strong>
                  </div>

                  <section className="admin-dealer-application-info">
                    <h3>사업자 정보 및 운영 계획</h3>
                    <pre>{businessInfo || "입력된 사업자 정보가 없습니다."}</pre>
                  </section>

                  {isPending ? (
                    <div className="admin-dealer-application-review-grid">
                      <form action={approveDealerApplicationAction} className="admin-dealer-application-decision is-approve" id={approveFormId}>
                        <input name="applicationId" type="hidden" value={String(applicationId)} />
                        <input name="redirectTo" type="hidden" value={returnPath} />
                        <div>
                          <strong>승인</strong>
                          <p>승인 즉시 딜러몰과 딜러 관리자 권한이 생성됩니다.</p>
                        </div>
                        <label className="admin-field">
                          <span>승인 검토 메모 (내부용)</span>
                          <textarea className="admin-textarea" maxLength={1000} name="reviewMemo" placeholder="승인 근거나 확인 사항을 입력할 수 있습니다." />
                        </label>
                        <AdminConfirmSubmitButton
                          className="admin-button"
                          confirmMessage={`${mallName} 신청을 승인하고 ${slug}.everybuy.co.kr 딜러몰을 생성하시겠습니까?`}
                          confirmTitle="딜러 신청 승인"
                          form={approveFormId}
                          pendingLabel="승인중..."
                        >
                          승인 및 딜러몰 생성
                        </AdminConfirmSubmitButton>
                      </form>

                      <form action={rejectDealerApplicationAction} className="admin-dealer-application-decision is-reject" id={rejectFormId}>
                        <input name="applicationId" type="hidden" value={String(applicationId)} />
                        <input name="redirectTo" type="hidden" value={returnPath} />
                        <div>
                          <strong>반려</strong>
                          <p>신청을 반려하고 사유를 기록합니다.</p>
                        </div>
                        <label className="admin-field">
                          <span>반려 사유</span>
                          <textarea className="admin-textarea" maxLength={500} name="rejectReason" placeholder="반려 사유를 입력해주세요." required />
                        </label>
                        <label className="admin-field">
                          <span>검토 메모 (내부용)</span>
                          <textarea className="admin-textarea" maxLength={1000} name="reviewMemo" placeholder="추가 확인 사항을 입력할 수 있습니다." />
                        </label>
                        <AdminConfirmSubmitButton
                          className="admin-button danger"
                          confirmMessage={`${mallName} 딜러 신청을 반려하시겠습니까? 입력한 반려 사유가 저장됩니다.`}
                          confirmTitle="딜러 신청 반려"
                          form={rejectFormId}
                          pendingLabel="반려중..."
                          tone="danger"
                        >
                          신청 반려
                        </AdminConfirmSubmitButton>
                      </form>
                    </div>
                  ) : (
                    <div className={`admin-dealer-application-complete${isRejected ? " is-rejected" : " is-approved"}`}>
                      <div>
                        <strong>{isRejected ? "반려 처리된 신청입니다." : "승인 완료된 신청입니다."}</strong>
                        <p>
                          {isRejected
                            ? rejectReason || "저장된 반려 사유가 없습니다."
                            : "딜러몰이 생성되어 운영 정보에서 관리할 수 있습니다."}
                        </p>
                      </div>
                      {dealerMallId ? (
                        <Link className="admin-button small" href={`/admin/dealers?dealerMallId=${dealerMallId}#dealer-detail`}>
                          생성된 딜러몰 관리
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
