import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../_components/admin/admin-submit-button";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerApplications,
  fetchAdminNotices,
  fetchAdminOrders,
  hasHealthBoxApi,
} from "../../_lib/health-box-api";
import {
  buildDashboardMetrics,
  mapApprovalQueue,
  mapNoticeRows,
  mapRecentOrders,
} from "../../_lib/health-box-presenters";
import {
  approveBuyerSignupApplicationAction,
  approveDealerApplicationAction,
  rejectBuyerSignupApplicationAction,
  rejectDealerApplicationAction,
} from "../../_actions/health-box-admin";

export default async function AdminDashboardPage() {
  const [orders, dealerApplications, buyerApplications, adminNotices] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminOrders(),
        fetchAdminDealerApplications(),
        fetchAdminBuyerSignupApplications(),
        fetchAdminNotices(),
      ])
    : [null, null, null, null];

  const metrics = buildDashboardMetrics(orders, dealerApplications, buyerApplications);
  const recentOrders = mapRecentOrders(orders);
  const approvalQueue = mapApprovalQueue(dealerApplications, buyerApplications);
  const latestNotices = mapNoticeRows(adminNotices).slice(0, 4);

  return (
    <div className="admin-page">
      <AdminHeader title="대시보드" />

      <AdminMetrics items={metrics} />

      <div className="admin-grid-main">
        <AdminPanel title="최근 주문">
          <AdminTable
            columns="minmax(150px, 1fr) minmax(0, 1.5fr) minmax(110px, 0.8fr) 110px"
            emptyDescription="최근 주문 데이터가 아직 없습니다."
            headers={["주문번호", "회원 / 상품", "결제금액", "상태"]}
            isEmpty={!recentOrders.length}
          >
            {recentOrders.map((order) => (
              <Link className="admin-table-row" href="/admin/orders" key={order.number}>
                <div className="admin-row-stack">
                  <strong>{order.number}</strong>
                  <span>{order.date}</span>
                </div>
                <div className="admin-row-stack">
                  <strong>{order.member}</strong>
                  <p>{order.items}</p>
                </div>
                <strong className="admin-row-price">{order.amount}</strong>
                <AdminBadge tone={order.statusTone}>{order.status}</AdminBadge>
              </Link>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel title="승인 대기">
            <div className="admin-list">
              {approvalQueue.map((item) => (
                <div className="admin-list-row" key={`${item.name}-${item.submittedAt}`}>
                  <div className="admin-row-stack">
                    <strong>{item.name}</strong>
                    <p>{item.note}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={item.type === "딜러 신청" ? "gold" : "cyan"}>
                      {item.type}
                    </AdminBadge>
                    <span>{item.submittedAt}</span>
                    {hasHealthBoxApi() ? (
                      <div className="admin-inline-actions">
                        <form action={item.kind === "dealer" ? approveDealerApplicationAction : approveBuyerSignupApplicationAction}>
                          <input name="applicationId" type="hidden" value={String(item.id)} />
                          <AdminSubmitButton className="admin-button small" pendingLabel="승인중...">
                            승인
                          </AdminSubmitButton>
                        </form>
                        <form action={item.kind === "dealer" ? rejectDealerApplicationAction : rejectBuyerSignupApplicationAction}>
                          <input name="applicationId" type="hidden" value={String(item.id)} />
                          <AdminSubmitButton className="admin-button secondary small" pendingLabel="반려중...">
                            반려
                          </AdminSubmitButton>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {!approvalQueue.length ? <p className="admin-row-muted">승인 대기 데이터가 없습니다.</p> : null}
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="admin-grid-halves">
        <AdminPanel title="연결 상태">
          <div className="admin-list">
            <div className="admin-list-row">
              <div className="admin-row-stack">
                <strong>주문 데이터</strong>
                <p>{orders?.length ? `${orders.length}건 조회됨` : "조회된 주문이 없습니다."}</p>
              </div>
              <AdminBadge tone={orders?.length ? "green" : "gold"}>{orders?.length ? "연결됨" : "비어있음"}</AdminBadge>
            </div>
            <div className="admin-list-row">
              <div className="admin-row-stack">
                <strong>공지 데이터</strong>
                <p>{adminNotices?.length ? `${adminNotices.length}건 조회됨` : "조회된 공지가 없습니다."}</p>
              </div>
              <AdminBadge tone={adminNotices?.length ? "green" : "gold"}>{adminNotices?.length ? "연결됨" : "비어있음"}</AdminBadge>
            </div>
            <div className="admin-list-row">
              <div className="admin-row-stack">
                <strong>API 설정</strong>
                <p>{hasHealthBoxApi() ? "HEALTH_BOX_API_BASE_URL 연결됨" : "환경변수가 아직 설정되지 않았습니다."}</p>
              </div>
              <AdminBadge tone={hasHealthBoxApi() ? "blue" : "rose"}>{hasHealthBoxApi() ? "설정됨" : "미설정"}</AdminBadge>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="최근 공지">
          <div className="admin-list">
            {latestNotices.map((notice) => (
              <Link className="admin-list-row" href={notice.previewHref} key={notice.slug}>
                <div className="admin-row-stack">
                  <strong>{notice.title}</strong>
                  <p>
                    {notice.category} · {notice.date}
                  </p>
                </div>
                <div className="admin-list-meta">
                  <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
                </div>
              </Link>
            ))}
            {!latestNotices.length ? <p className="admin-row-muted">최근 공지 데이터가 없습니다.</p> : null}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
