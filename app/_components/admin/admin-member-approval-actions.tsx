"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import {
  approveBuyerSignupApplicationAction,
  rejectBuyerSignupApplicationAction,
} from "../../_actions/health-box-admin";
import type { AdminTone } from "../../_lib/admin-data";
import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";
import { AdminBadge } from "./admin-ui";

export function AdminMemberApprovalActions({
  applicationId,
  approvedAt,
  birthDate,
  consentVersion,
  dealerName,
  email,
  marketingConsent,
  memberName,
  phone,
  rejectReason,
  returnPath = "/admin/members#member-applications",
  status,
  statusLabel,
  statusTone,
  submittedAt,
}: {
  applicationId: number;
  approvedAt: string;
  birthDate: string;
  consentVersion: string;
  dealerName: string;
  email: string;
  marketingConsent: string;
  memberName: string;
  phone: string;
  rejectReason: string;
  returnPath?: string;
  status: string;
  statusLabel: string;
  statusTone: AdminTone;
  submittedAt: string;
}) {
  const titleId = useId();
  const approveFormId = useId();
  const rejectFormId = useId();
  const [open, setOpen] = useState(false);
  const isPending = /^PENDING$/i.test(status) || !status;
  const isRejected = /^REJECTED$/i.test(status);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
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
                aria-label="회원 신청 검토 닫기"
                className="admin-info-dialog-backdrop"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div
                aria-labelledby={titleId}
                aria-modal="true"
                className="admin-info-dialog admin-member-application-dialog"
                role="dialog"
              >
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <div className="admin-member-dialog-title">
                      <strong id={titleId}>{memberName} 회원 신청</strong>
                      <AdminBadge tone={statusTone}>{statusLabel}</AdminBadge>
                    </div>
                    <p>신청 정보와 동의 내역을 확인한 뒤 승인 또는 반려할 수 있습니다.</p>
                  </div>
                  <button
                    aria-label="회원 신청 검토 닫기"
                    className="admin-info-dialog-close"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <svg fill="none" viewBox="0 0 24 24">
                      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
                    </svg>
                  </button>
                </div>

                <div className="admin-info-dialog-body admin-member-application-body">
                  <div className="admin-member-detail-summary">
                    <div><span>가입 경로</span><strong>{dealerName}</strong></div>
                    <div><span>휴대폰 번호</span><strong>{phone}</strong></div>
                    <div><span>이메일</span><strong title={email}>{email}</strong></div>
                    <div><span>신청일</span><strong>{submittedAt}</strong></div>
                  </div>

                  <section className="admin-member-detail-section">
                    <h3>신청 및 동의 정보</h3>
                    <dl className="admin-member-detail-grid">
                      <div><dt>생년월일</dt><dd>{birthDate}</dd></div>
                      <div><dt>마케팅 수신</dt><dd>{marketingConsent}</dd></div>
                      <div><dt>동의 문서 버전</dt><dd>{consentVersion}</dd></div>
                      <div><dt>처리일</dt><dd>{approvedAt}</dd></div>
                    </dl>
                  </section>

                  {isPending ? (
                    <div className="admin-dealer-application-review-grid">
                      <form
                        action={approveBuyerSignupApplicationAction}
                        className="admin-dealer-application-decision is-approve"
                        id={approveFormId}
                      >
                        <input name="applicationId" type="hidden" value={String(applicationId)} />
                        <input name="redirectTo" type="hidden" value={returnPath} />
                        <div>
                          <strong>승인</strong>
                          <p>승인 즉시 회원 계정이 활성화되고 로그인이 가능해집니다.</p>
                        </div>
                        <label className="admin-field">
                          <span>승인 검토 메모 (내부용)</span>
                          <textarea
                            className="admin-textarea"
                            maxLength={1000}
                            name="reviewMemo"
                            placeholder="확인 사항을 입력할 수 있습니다."
                          />
                        </label>
                        <AdminConfirmSubmitButton
                          className="admin-button"
                          confirmMessage={`${memberName} 회원을 승인하시겠습니까? 승인 후 로그인이 가능해집니다.`}
                          confirmTitle="회원 승인"
                          form={approveFormId}
                          pendingLabel="승인중..."
                        >
                          회원 승인
                        </AdminConfirmSubmitButton>
                      </form>

                      <form
                        action={rejectBuyerSignupApplicationAction}
                        className="admin-dealer-application-decision is-reject"
                        id={rejectFormId}
                      >
                        <input name="applicationId" type="hidden" value={String(applicationId)} />
                        <div>
                          <strong>반려</strong>
                          <p>가입 신청을 반려하고 안내 사유를 기록합니다.</p>
                        </div>
                        <label className="admin-field">
                          <span>반려 사유</span>
                          <textarea
                            className="admin-textarea"
                            maxLength={500}
                            name="rejectReason"
                            placeholder="반려 사유를 입력해주세요."
                            required
                          />
                        </label>
                        <AdminConfirmSubmitButton
                          className="admin-button danger"
                          confirmMessage={`${memberName} 회원 가입 신청을 반려하시겠습니까? 입력한 사유가 저장됩니다.`}
                          confirmTitle="회원 반려"
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
                            : "가입 승인이 완료되어 회원 목록에서 확인할 수 있습니다."}
                        </p>
                      </div>
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
