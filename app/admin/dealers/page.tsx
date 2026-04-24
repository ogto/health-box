import Link from "next/link";

import { saveDealerMallPublicConfigAction } from "../../_actions/health-box-admin";
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

  const dealerRows = mapDealerRows(dealers);
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
    <div className="admin-page">
      <AdminHeader title="딜러몰관리" />

      <AdminMetrics items={metrics} />

      <div className="admin-grid-side">
        <AdminPanel title="딜러몰">
          <AdminTable
            columns="minmax(0, 1.1fr) 96px 110px 120px 90px 84px"
            emptyDescription="조회 가능한 딜러몰 데이터가 없습니다."
            headers={["딜러몰", "가입일", "누적 주문건수", "누적 판매", "상태", "상세"]}
            isEmpty={!dealerRows.length}
          >
            {dealerRows.map((dealer) => (
              <div className="admin-table-row" key={`${dealer.name}-${dealer.id}`}>
                <strong>{dealer.name}</strong>
                <span className="admin-row-muted">{dealer.joinedAt}</span>
                <span className="admin-row-muted">{dealer.orderCount}</span>
                <strong className="admin-row-price">{dealer.totalSales}</strong>
                <AdminBadge tone={dealer.tone}>{dealer.status}</AdminBadge>
                <Link
                  className="admin-button secondary small"
                  href={`/admin/dealers?dealerMallId=${dealer.id}`}
                >
                  보기
                </Link>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
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
                  <span>표시명</span>
                  <input
                    className="admin-input"
                    defaultValue={stringValue(publicConfig, "displayName") || selectedDealer.name}
                    name="displayName"
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
  );
}
