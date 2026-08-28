import Link from "next/link";

import { createDealerMallDialogAction, saveDealerMallPublicConfigAction } from "../../_actions/health-box-admin";
import { AdminDealerCreateDialog } from "../../_components/admin/admin-dealer-create-dialog";
import { AdminDealerDomainField } from "../../_components/admin/admin-dealer-domain-field";
import {
  AdminDealerApplicationsBoard,
  AdminDealerMallsBoard,
} from "../../_components/admin/admin-dealers-directory";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../_components/admin/admin-submit-button";
import { AdminBadge, AdminMetrics } from "../../_components/admin/admin-ui";
import {
  dateTimeValue,
  fetchAdminDealerApplications,
  fetchAdminDealerMallMembers,
  fetchAdminDealerMallOrders,
  fetchAdminDealerMallPublicConfig,
  fetchAdminDealerMalls,
  fetchAdminMembers,
  hasHealthBoxApi,
  idValue,
  stringValue,
} from "../../_lib/health-box-api";
import {
  buildDealerMetrics,
  mapDealerRows,
  mapMemberRows,
  mapOrderRows,
} from "../../_lib/health-box-presenters";

type DealerSearchParams = {
  dealerMallId?: string;
};

function dealerApplicationStatus(status: string) {
  if (/^APPROVED$/i.test(status)) {
    return { label: "승인완료", tone: "green" as const };
  }
  if (/^REJECTED$/i.test(status)) {
    return { label: "반려", tone: "rose" as const };
  }

  return { label: "승인대기", tone: "gold" as const };
}

function adminDateLabel(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return matched ? `${matched[1]}.${matched[2]}.${matched[3]} ${matched[4]}:${matched[5]}` : value;
}

export default async function AdminDealersPage({
  searchParams,
}: {
  searchParams: Promise<DealerSearchParams>;
}) {
  const params = await searchParams;
  const apiConnected = hasHealthBoxApi();
  const [dealers, members, dealerApplications] = apiConnected
    ? await Promise.all([
        fetchAdminDealerMalls(),
        fetchAdminMembers(),
        fetchAdminDealerApplications(),
      ])
    : [null, null, null];

  const dealerRows = mapDealerRows(dealers, members);
  const dealerApplicationRows = (dealerApplications ?? [])
    .map((application, index) => {
      const applicationId = idValue(application, "id", "applicationId") ?? index + 1;
      const status = stringValue(application, "status") || "PENDING";
      const phone = stringValue(application, "phone");
      const email = stringValue(application, "email");
      const businessInfo = stringValue(application, "businessInfo");
      const statusView = dealerApplicationStatus(status);

      return {
        applicationId,
        applicantName: stringValue(application, "applicantName", "name") || "이름 없음",
        appliedAt: dateTimeValue(application, "createdAt", "appliedAt", "updatedAt") || "-",
        businessInfo,
        businessSummary: businessInfo.replace(/\s*\n\s*/g, " · ") || "사업자 정보 없음",
        contact: [phone, email].filter(Boolean).join(" / ") || "-",
        dealerMallId: idValue(application, "dealerMallId"),
        mallName: stringValue(application, "wantedMallName", "mallName") || "이름 없음",
        rejectReason: stringValue(application, "rejectReason"),
        slug: stringValue(application, "wantedSlug", "slug") || "-",
        status,
        statusLabel: statusView.label,
        statusTone: statusView.tone,
      };
    })
    .sort((left, right) => {
      const leftPending = /^PENDING$/i.test(left.status) ? 1 : 0;
      const rightPending = /^PENDING$/i.test(right.status) ? 1 : 0;
      return rightPending - leftPending || right.applicationId - left.applicationId;
    });

  const dealerDomains = dealerRows.map((dealer) => ({
    id: dealer.id,
    slug: dealer.slug,
  }));
  const metrics = buildDealerMetrics(dealers, members, dealerApplications);
  const selectedDealerId = Number(params.dealerMallId) || null;
  const selectedDealer = selectedDealerId
    ? dealerRows.find((dealer) => dealer.id === selectedDealerId) || null
    : null;

  const [dealerMembers, dealerOrders, publicConfig] =
    apiConnected && selectedDealer?.id
      ? await Promise.all([
          fetchAdminDealerMallMembers(selectedDealer.id),
          fetchAdminDealerMallOrders(selectedDealer.id),
          fetchAdminDealerMallPublicConfig(selectedDealer.id),
        ])
      : [null, null, null];

  const memberRows = mapMemberRows(dealerMembers).slice(0, 5);
  const orderRows = mapOrderRows(dealerOrders).slice(0, 5);

  return (
    <div className="admin-page admin-dealers-page">
      <AdminHeader
        actions={
          <AdminDealerCreateDialog
            action={createDealerMallDialogAction}
            dealerDomains={dealerDomains}
            hasApi={apiConnected}
          />
        }
        title="딜러관리"
      />

      <AdminMetrics items={metrics} />

      <div className="admin-stack admin-dealer-directory-stack">
        <AdminDealerApplicationsBoard items={dealerApplicationRows} />
        <AdminDealerMallsBoard items={dealerRows} />
      </div>

      {selectedDealer ? (
        <div className="admin-info-dialog-layer" id="dealer-detail" role="presentation">
          <Link
            aria-label="딜러몰 상세 관리 닫기"
            className="admin-info-dialog-backdrop"
            href="/admin/dealers#dealer-malls"
          />
          <section
            aria-labelledby="admin-dealer-manage-title"
            aria-modal="true"
            className="admin-info-dialog admin-dealer-manage-dialog"
            role="dialog"
          >
            <div className="admin-info-dialog-head">
              <div className="admin-info-dialog-copy">
                <div className="admin-dealer-manage-title-row">
                  <strong id="admin-dealer-manage-title">{selectedDealer.name} 관리</strong>
                  <AdminBadge tone={selectedDealer.tone}>{selectedDealer.status}</AdminBadge>
                </div>
                <p>{selectedDealer.domain} · 쇼핑몰 노출 정보와 최근 운영 데이터를 관리합니다.</p>
              </div>
              <div className="admin-dealer-manage-head-actions">
                <a
                  className="admin-button secondary small"
                  href={`https://${selectedDealer.domain}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  사이트 열기
                </a>
                <Link
                  aria-label="딜러몰 상세 관리 닫기"
                  className="admin-info-dialog-close"
                  href="/admin/dealers#dealer-malls"
                >
                  <svg fill="none" viewBox="0 0 24 24">
                    <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="admin-info-dialog-body admin-dealer-manage-body">
              <div className="admin-dealer-summary-strip admin-dealer-manage-summary">
                <div>
                  <span>개설일</span>
                  <strong>{adminDateLabel(selectedDealer.joinedAt)}</strong>
                </div>
                <div>
                  <span>소속 회원</span>
                  <strong>{selectedDealer.memberCount}</strong>
                </div>
                <div>
                  <span>누적 주문</span>
                  <strong>{selectedDealer.orderCount}</strong>
                </div>
                <div>
                  <span>누적 판매</span>
                  <strong>{selectedDealer.totalSales}</strong>
                </div>
              </div>

              <div className="admin-dealer-manage-layout">
                <section className="admin-dealer-manage-section">
                  <div className="admin-dealer-manage-section-head">
                    <div>
                      <h3>딜러몰 기본 정보</h3>
                      <p>고객에게 노출되는 몰 이름과 관리 연락처를 수정합니다.</p>
                    </div>
                  </div>

                  <form
                    action={saveDealerMallPublicConfigAction}
                    className="admin-status-stack admin-dealer-manage-form"
                    key={`dealer-detail-${selectedDealer.id}-${stringValue(publicConfig, "id") || "empty"}`}
                  >
                    <input name="dealerMallId" type="hidden" value={String(selectedDealer.id)} />
                    <input name="id" type="hidden" value={stringValue(publicConfig, "id")} />
                    <input
                      name="redirectTo"
                      type="hidden"
                      value={`/admin/dealers?dealerMallId=${selectedDealer.id}#dealer-detail`}
                    />
                    <input name="toast" type="hidden" value="딜러몰 정보를 저장했습니다." />

                    <div className="admin-field-grid two admin-dealer-detail-grid">
                      <label className="admin-field">
                        <span>딜러몰 이름</span>
                        <input
                          className="admin-input"
                          defaultValue={stringValue(publicConfig, "mallName") || selectedDealer.name}
                          name="mallName"
                          type="text"
                        />
                      </label>
                      <label className="admin-field">
                        <span>표시명</span>
                        <input
                          className="admin-input"
                          defaultValue={
                            stringValue(publicConfig, "displayName") ||
                            selectedDealer.displayName ||
                            selectedDealer.name
                          }
                          name="displayName"
                          placeholder="비우면 딜러몰 이름과 같게 노출"
                          type="text"
                        />
                      </label>
                      <div className="span-two">
                        <AdminDealerDomainField
                          currentDealerMallId={selectedDealer.id}
                          dealerDomains={dealerDomains}
                          defaultValue={stringValue(publicConfig, "slug") || selectedDealer.slug || ""}
                        />
                      </div>
                      <label className="admin-field">
                        <span>운영 상태</span>
                        <select
                          className="admin-select"
                          defaultValue={stringValue(publicConfig, "activeYn") || "Y"}
                          name="activeYn"
                        >
                          <option value="Y">활성</option>
                          <option value="N">비활성</option>
                        </select>
                      </label>
                      <label className="admin-field">
                        <span>관리 계정</span>
                        <input
                          className="admin-input"
                          defaultValue={stringValue(publicConfig, "supportEmail") || selectedDealer.supportEmail || ""}
                          name="supportEmail"
                          type="text"
                        />
                      </label>
                      <label className="admin-field">
                        <span>연락처</span>
                        <input
                          className="admin-input"
                          defaultValue={stringValue(publicConfig, "supportPhone") || selectedDealer.supportPhone}
                          name="supportPhone"
                          type="text"
                        />
                      </label>
                    </div>

                    {apiConnected ? (
                      <AdminSubmitButton className="admin-button admin-dealer-save-button" pendingLabel="저장중...">
                        변경사항 저장
                      </AdminSubmitButton>
                    ) : (
                      <div className="admin-row-muted">서버 연결 상태를 확인해주세요.</div>
                    )}
                  </form>
                </section>

                <div className="admin-dealer-manage-side-stack">
                  <section className="admin-dealer-manage-side-panel">
                    <div className="admin-dealer-manage-side-head">
                      <h3>소속 회원</h3>
                      <span>최근 5명</span>
                    </div>
                    <div className="admin-list">
                      {memberRows.map((member) => (
                        <div className="admin-list-row" key={`${member.name}-${member.joinedAt}`}>
                          <div className="admin-row-stack">
                            <strong>{member.name}</strong>
                            <p>{member.organization !== "-" ? member.organization : member.contact}</p>
                          </div>
                          <div className="admin-list-meta">
                            <AdminBadge tone={member.tone}>{member.status}</AdminBadge>
                          </div>
                        </div>
                      ))}
                      {!memberRows.length ? <p className="admin-row-muted">소속 회원 데이터가 없습니다.</p> : null}
                    </div>
                  </section>

                  <section className="admin-dealer-manage-side-panel">
                    <div className="admin-dealer-manage-side-head">
                      <h3>최근 주문</h3>
                      <span>최근 5건</span>
                    </div>
                    <div className="admin-list">
                      {orderRows.map((order) => (
                        <div className="admin-list-row" key={order.number}>
                          <div className="admin-row-stack">
                            <strong>{order.number}</strong>
                            <p>{order.items}</p>
                          </div>
                          <div className="admin-list-meta">
                            <AdminBadge tone={order.tone}>{order.status}</AdminBadge>
                            <span>{order.amount}</span>
                          </div>
                        </div>
                      ))}
                      {!orderRows.length ? <p className="admin-row-muted">최근 주문 데이터가 없습니다.</p> : null}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
