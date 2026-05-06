import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
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
  mapNoticeRows,
  mapRecentOrders,
} from "../../_lib/health-box-presenters";

function countPendingApplications(records: Array<Record<string, unknown>> | null) {
  return (records ?? []).filter((record) => {
    const status = typeof record.status === "string" ? record.status : "";
    return !status || /^PENDING$/i.test(status);
  }).length;
}

function textValue(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value);
    }
  }

  return "";
}

function countProcessingOrders(records: Array<Record<string, unknown>> | null) {
  return (records ?? []).filter((record) => {
    const orderStatus = textValue(record, "orderStatus", "status").toUpperCase();
    const shipmentStatus = textValue(record, "shipmentStatus").toUpperCase();
    if (/CANCELED|SHIPPED|DELIVERED|PREPARING|취소|배송|상품\s*준비/.test(shipmentStatus)) {
      return false;
    }

    return /ORDERED|PENDING|주문\s*접수/.test(shipmentStatus || orderStatus);
  }).length;
}

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
  const pendingBuyerCount = countPendingApplications(buyerApplications);
  const pendingDealerCount = countPendingApplications(dealerApplications);
  const processingOrderCount = countProcessingOrders(orders);
  const latestNotices = mapNoticeRows(adminNotices).slice(0, 4);

  return (
    <div className="admin-page">
      <AdminHeader title="대시보드" />

      <AdminMetrics items={metrics} />

      <div className="admin-grid-main">
        <AdminPanel
          action={
            <Link className="admin-button secondary small" href="/admin/orders">
              주문관리
            </Link>
          }
          title="최근 주문"
        >
          <AdminTable
            columns="minmax(150px, 1fr) minmax(0, 1.5fr) minmax(110px, 0.8fr) 110px"
            emptyDescription="최근 주문 데이터가 아직 없습니다."
            headers={["주문번호", "회원 / 상품", "결제금액", "상태"]}
            isEmpty={!recentOrders.length}
          >
            {recentOrders.map((order) => (
              <Link className="admin-table-row" href={order.id ? `/admin/orders/${order.id}` : "/admin/orders"} key={order.number}>
                <div className="admin-row-stack">
                  <strong>{order.number}</strong>
                  <span>{order.date}</span>
                </div>
                <div className="admin-row-stack">
                  <strong>{order.member}</strong>
                  <p>{order.items}</p>
                </div>
                <strong className="admin-row-price">{order.amount}</strong>
                <div className="admin-order-status-stack">
                  <AdminBadge tone={order.statusTone}>{order.status}</AdminBadge>
                  {order.pendingAgeLabel ? (
                    <AdminBadge className="admin-order-age-badge" tone={order.pendingAgeTone}>
                      {order.pendingAgeLabel}
                    </AdminBadge>
                  ) : null}
                </div>
              </Link>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel title="승인 대기">
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>회원 승인 요청</strong>
                  <p>회원관리에서 가입 정보를 확인한 뒤 승인 또는 반려하세요.</p>
                </div>
                <div className="admin-list-meta">
                  <AdminBadge tone={pendingBuyerCount ? "cyan" : "green"}>
                    {pendingBuyerCount}건
                  </AdminBadge>
                  <Link className="admin-button secondary small" href="/admin/members">
                    회원관리
                  </Link>
                </div>
              </div>
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>딜러 신청</strong>
                  <p>딜러몰 생성과 공개 설정은 딜러몰관리에서 처리하세요.</p>
                </div>
                <div className="admin-list-meta">
                  <AdminBadge tone={pendingDealerCount ? "gold" : "green"}>
                    {pendingDealerCount}건
                  </AdminBadge>
                  <Link className="admin-button secondary small" href="/admin/dealers">
                    딜러몰관리
                  </Link>
                </div>
              </div>
              {!pendingBuyerCount && !pendingDealerCount ? (
                <div className="admin-list-row">
                  <div className="admin-row-stack">
                    <strong>처리할 승인 요청이 없습니다.</strong>
                    <p>새 요청이 들어오면 이 영역에 건수로 표시됩니다.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="admin-grid-halves">
        <AdminPanel title="오늘 처리할 일">
          <div className="admin-list">
            <Link className="admin-list-row" href="/admin/orders">
              <div className="admin-row-stack">
                <strong>주문 처리</strong>
                <p>접수된 주문을 상품 준비중으로 넘기고 배송 처리까지 이어가세요.</p>
              </div>
              <div className="admin-list-meta">
                <AdminBadge tone={processingOrderCount ? "cyan" : "green"}>
                  {processingOrderCount}건
                </AdminBadge>
              </div>
            </Link>
            <Link className="admin-list-row" href="/admin/members">
              <div className="admin-row-stack">
                <strong>회원 승인</strong>
                <p>구매 회원 가입 요청을 확인하고 승인 또는 반려하세요.</p>
              </div>
              <div className="admin-list-meta">
                <AdminBadge tone={pendingBuyerCount ? "gold" : "green"}>
                  {pendingBuyerCount}건
                </AdminBadge>
              </div>
            </Link>
            <Link className="admin-list-row" href="/admin/dealers">
              <div className="admin-row-stack">
                <strong>딜러 신청</strong>
                <p>신규 딜러몰 요청과 공개 설정을 확인하세요.</p>
              </div>
              <div className="admin-list-meta">
                <AdminBadge tone={pendingDealerCount ? "violet" : "green"}>
                  {pendingDealerCount}건
                </AdminBadge>
              </div>
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel
          action={
            <Link className="admin-button secondary small" href="/admin/notices">
              공지관리
            </Link>
          }
          title="최근 공지"
        >
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
