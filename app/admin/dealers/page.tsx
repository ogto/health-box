import Link from "next/link";

import { createDealerMallDialogAction, saveDealerMallPublicConfigAction } from "../../_actions/health-box-admin";
import { AdminDealerCreateDialog } from "../../_components/admin/admin-dealer-create-dialog";
import { AdminDealerDomainField } from "../../_components/admin/admin-dealer-domain-field";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../_components/admin/admin-submit-button";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminDealerMallMembers,
  fetchAdminDealerMallOrders,
  fetchAdminDealerMallPublicConfig,
  fetchAdminDealerMalls,
  fetchAdminMembers,
  fetchAdminDealerApplications,
  hasHealthBoxApi,
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

export default async function AdminDealersPage({
  searchParams,
}: {
  searchParams: Promise<DealerSearchParams>;
}) {
  const params = await searchParams;
  const [dealers, members, dealerApplications] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminDealerMalls(),
        fetchAdminMembers(),
        fetchAdminDealerApplications(),
      ])
    : [null, null, null];

  const dealerRows = mapDealerRows(dealers, members);
  const dealerDomains = dealerRows.map((dealer) => ({
    id: dealer.id,
    slug: dealer.slug,
  }));
  const metrics = buildDealerMetrics(dealers, members, dealerApplications);
  const selectedDealerId =
    Number(params.dealerMallId) || dealerRows[0]?.id || null;
  const selectedDealer = dealerRows.find((dealer) => dealer.id === selectedDealerId) || dealerRows[0] || null;

  const [dealerMembers, dealerOrders, publicConfig] =
    hasHealthBoxApi() && selectedDealer?.id
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
        actions={<AdminDealerCreateDialog action={createDealerMallDialogAction} dealerDomains={dealerDomains} hasApi={hasHealthBoxApi()} />}
        title="딜러몰관리"
      />

      <AdminMetrics items={metrics} />

      <div className="admin-stack">
        <AdminPanel
          title="딜러몰"
          description="운영 중인 딜러몰을 선택하면 아래에서 노출 정보와 최근 데이터를 확인할 수 있습니다."
        >
          <AdminTable
            alignments={["left", "left", "left", "center", "center", "center"]}
            className="admin-dealer-table"
            columns="minmax(170px, 1.1fr) minmax(220px, 1.25fr) minmax(160px, 0.9fr) minmax(150px, 0.7fr) 92px 74px"
            emptyDescription="조회 가능한 딜러몰 데이터가 없습니다."
            headers={[
              "딜러몰",
              "도메인 / 계정",
              "연락처 / 가입일",
              "운영 지표",
              "상태",
              "상세",
            ]}
            isEmpty={!dealerRows.length}
          >
            {dealerRows.map((dealer) => (
              <div
                className={`admin-table-row admin-dealer-row${selectedDealer?.id === dealer.id ? " is-selected" : ""}`}
                key={dealer.id}
              >
                <div className="admin-row-stack admin-cell-left">
                  <strong title={dealer.name}>{dealer.name}</strong>
                  <p title={dealer.displayName || dealer.name}>{dealer.displayName || dealer.name}</p>
                </div>
                <div className="admin-row-stack admin-cell-left">
                  <a
                    className="admin-inline-link"
                    href={`https://${dealer.domain}`}
                    rel="noreferrer"
                    target="_blank"
                    title={dealer.domain}
                  >
                    {dealer.domain}
                  </a>
                  <p title={dealer.supportEmail || "-"}>{dealer.supportEmail || "-"}</p>
                </div>
                <div className="admin-row-stack admin-cell-left">
                  <strong title={dealer.supportPhone || "-"}>{dealer.supportPhone || "-"}</strong>
                  <p title={dealer.joinedAt}>{dealer.joinedAt}</p>
                </div>
                <div className="admin-dealer-stat-cell admin-cell-center">
                  <span>회원 <strong>{dealer.memberCount}</strong></span>
                  <span>주문 <strong>{dealer.orderCount}</strong></span>
                  <span>판매 <strong>{dealer.totalSales}</strong></span>
                </div>
                <AdminBadge className="admin-cell-center" tone={dealer.tone}>
                  {dealer.status}
                </AdminBadge>
                <Link
                  className="admin-button secondary small admin-cell-center"
                  href={`/admin/dealers?dealerMallId=${dealer.id}#dealer-detail`}
                >
                  보기
                </Link>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-dealer-workspace">
          <AdminPanel
            title="딜러몰 상세"
            description={selectedDealer ? `${selectedDealer.name} 딜러몰의 쇼핑몰 노출 정보를 수정합니다.` : undefined}
            className="admin-dealer-detail-panel"
            id="dealer-detail"
          >
            {selectedDealer ? (
              <form
                action={saveDealerMallPublicConfigAction}
                className="admin-status-stack"
                key={`dealer-detail-${selectedDealer.id}-${stringValue(publicConfig, "id") || "empty"}`}
              >
                <input name="dealerMallId" type="hidden" value={String(selectedDealer.id)} />
                <input name="id" type="hidden" value={stringValue(publicConfig, "id")} />
                <input name="redirectTo" type="hidden" value={`/admin/dealers?dealerMallId=${selectedDealer.id}#dealer-detail`} />
                <input name="toast" type="hidden" value="딜러몰 정보를 저장했습니다." />
                <div className="admin-dealer-summary-strip">
                  <div>
                    <span>대표 도메인</span>
                    <strong>{selectedDealer.domain}</strong>
                  </div>
                  <div>
                    <span>가입일</span>
                    <strong>{selectedDealer.joinedAt}</strong>
                  </div>
                  <div>
                    <span>누적 판매</span>
                    <strong>{selectedDealer.totalSales}</strong>
                  </div>
                </div>

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
                      defaultValue={stringValue(publicConfig, "displayName") || selectedDealer.displayName || selectedDealer.name}
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
                    <span>상태</span>
                    <select className="admin-select" defaultValue={stringValue(publicConfig, "activeYn") || "Y"} name="activeYn">
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
                    <span>전화</span>
                    <input
                      className="admin-input"
                      defaultValue={stringValue(publicConfig, "supportPhone") || selectedDealer.supportPhone}
                      name="supportPhone"
                      type="text"
                    />
                  </label>

                  <label className="admin-field">
                    <span>소속 회원</span>
                    <input className="admin-input" disabled type="text" value={selectedDealer.memberCount} />
                  </label>
                  <label className="admin-field">
                    <span>주문</span>
                    <input className="admin-input" disabled type="text" value={selectedDealer.orderCount} />
                  </label>
                </div>
                {hasHealthBoxApi() ? (
                  <AdminSubmitButton className="admin-button admin-dealer-save-button" pendingLabel="저장중...">
                    저장
                  </AdminSubmitButton>
                ) : (
                  <div className="admin-row-muted">API 미연결 상태입니다.</div>
                )}
              </form>
            ) : (
              <p className="admin-row-muted">조회할 딜러몰이 없습니다.</p>
            )}
          </AdminPanel>

          <div className="admin-dealer-side-stack" key={`dealer-side-${selectedDealer?.id || "empty"}`}>
            <AdminPanel title="소속 회원">
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
            </AdminPanel>

            <AdminPanel title="최근 주문">
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
            </AdminPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
