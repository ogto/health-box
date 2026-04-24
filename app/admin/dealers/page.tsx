import Link from "next/link";

import { createDealerMallAction, saveDealerMallPublicConfigAction } from "../../_actions/health-box-admin";
import { AdminDealerCreateDialog } from "../../_components/admin/admin-dealer-create-dialog";
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
  createStatus?: string;
  createError?: string;
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
  const createSucceeded = params.createStatus === "success";
  const createError = params.createError;

  return (
    <div className="admin-page">
      <AdminHeader
        actions={<AdminDealerCreateDialog action={createDealerMallAction} hasApi={hasHealthBoxApi()} />}
        title="딜러몰관리"
      />

      <AdminMetrics items={metrics} />

      {createSucceeded ? (
        <div className="admin-feedback is-success">딜러 추가 요청이 접수되었습니다.</div>
      ) : null}
      {createError ? <div className="admin-feedback is-error">{createError}</div> : null}

      <div className="admin-stack">
        <AdminPanel title="딜러몰">
          <AdminTable
            alignments={["left", "left", "left", "left", "left", "left", "center", "center", "center", "center", "right", "center", "center"]}
            columns="minmax(0, 1.08fr) minmax(0, 0.64fr) minmax(0, 0.56fr) minmax(0, 0.82fr) minmax(0, 0.82fr) minmax(0, 0.68fr) minmax(68px, 0.56fr) minmax(58px, 0.46fr) minmax(42px, 0.3fr) minmax(42px, 0.3fr) minmax(62px, 0.46fr) minmax(58px, 0.44fr) 58px"
            emptyDescription="조회 가능한 딜러몰 데이터가 없습니다."
            headers={[
              "딜러몰",
              "표시명",
              "slug",
              "도메인",
              "문의 메일",
              "문의 전화",
              "가입일",
              "코드",
              "회원",
              "주문",
              "누적판매",
              "상태",
              "상세",
            ]}
            isEmpty={!dealerRows.length}
          >
            {dealerRows.map((dealer) => (
              <div className="admin-table-row" key={dealer.id}>
                <strong className="admin-cell-left" title={dealer.name}>{dealer.name}</strong>
                <span className="admin-row-muted admin-cell-left" title={dealer.displayName || dealer.name}>{dealer.displayName || dealer.name}</span>
                <span className="admin-row-muted admin-cell-left" title={dealer.slug}>{dealer.slug}</span>
                <span className="admin-row-muted admin-cell-left" title={dealer.domain}>{dealer.domain}</span>
                <span className="admin-row-muted admin-cell-left" title={dealer.supportEmail || "-"}>{dealer.supportEmail || "-"}</span>
                <span className="admin-row-muted admin-cell-left" title={dealer.supportPhone || "-"}>{dealer.supportPhone || "-"}</span>
                <span className="admin-row-muted admin-cell-center" title={dealer.joinedAt}>{dealer.joinedAt}</span>
                <span className="admin-row-muted admin-cell-center" title={dealer.dealerCode}>{dealer.dealerCode}</span>
                <strong className="admin-row-price admin-cell-center" title={dealer.memberCount}>{dealer.memberCount}</strong>
                <span className="admin-row-muted admin-cell-center" title={dealer.orderCount}>{dealer.orderCount}</span>
                <strong className="admin-row-price admin-cell-right" title={dealer.totalSales}>{dealer.totalSales}</strong>
                <AdminBadge className="admin-cell-center" tone={dealer.tone}>
                  {dealer.status}
                </AdminBadge>
                <Link
                  className="admin-button secondary small admin-cell-center"
                  href={`/admin/dealers?dealerMallId=${dealer.id}`}
                >
                  보기
                </Link>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-grid-main">
          <AdminPanel title="딜러몰 공개 설정">
            {selectedDealer ? (
              <form action={saveDealerMallPublicConfigAction} className="admin-status-stack">
                <input name="dealerMallId" type="hidden" value={String(selectedDealer.id)} />
                <label className="admin-field">
                  <span>몰 이름</span>
                  <input
                    className="admin-input"
                    defaultValue={stringValue(publicConfig, "mallName") || selectedDealer.name}
                    name="mallName"
                    type="text"
                  />
                </label>
                <label className="admin-field">
                  <span>공개 표시명 (선택)</span>
                  <input
                    className="admin-input"
                    defaultValue={stringValue(publicConfig, "displayName") || selectedDealer.displayName || selectedDealer.name}
                    name="displayName"
                    placeholder="비우면 몰 이름과 같게 노출"
                    type="text"
                  />
                </label>
                <label className="admin-field">
                  <span>문의 메일</span>
                  <input
                    className="admin-input"
                    defaultValue={stringValue(publicConfig, "supportEmail") || selectedDealer.supportEmail}
                    name="supportEmail"
                    type="email"
                  />
                </label>
                <label className="admin-field">
                  <span>문의 전화</span>
                  <input
                    className="admin-input"
                    defaultValue={stringValue(publicConfig, "supportPhone") || selectedDealer.supportPhone}
                    name="supportPhone"
                    type="text"
                  />
                </label>
                <label className="admin-field">
                  <span>활성 여부</span>
                  <select className="admin-select" defaultValue={stringValue(publicConfig, "activeYn") || "Y"} name="activeYn">
                    <option value="Y">활성</option>
                    <option value="N">비활성</option>
                  </select>
                </label>
                {hasHealthBoxApi() ? (
                  <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
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

          <div className="admin-stack">
            <AdminPanel title="소속 회원">
              <div className="admin-list">
                {memberRows.map((member) => (
                  <div className="admin-list-row" key={`${member.name}-${member.joinedAt}`}>
                    <div className="admin-row-stack">
                      <strong>{member.name}</strong>
                      <p>{member.organization}</p>
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
