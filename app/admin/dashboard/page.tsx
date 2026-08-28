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
import { getAdminSession } from "../../_lib/admin-auth";

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
  const session = await getAdminSession();
  const dealerAdmin = session?.scopeType === "DEALER";
  const [orders, dealerApplications, buyerApplications, adminNotices] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminOrders(),
        dealerAdmin ? Promise.resolve([]) : fetchAdminDealerApplications(),
        fetchAdminBuyerSignupApplications(),
        fetchAdminNotices(),
      ])
    : [null, null, null, null];

  const metrics = buildDashboardMetrics(orders, dealerApplications, buyerApplications);
  if (dealerAdmin) {
    metrics[1] = {
      label: "확인할 주문",
      value: `${countProcessingOrders(orders)}건`,
      hint: "조회 전용",
      tone: "cyan",
    };
    metrics[3] = {
      label: "운영 범위",
      value: session?.scopeName || "딜러몰",
      hint: "내 딜러몰 데이터만 표시",
      tone: "violet",
    };
  }
  const recentOrders = mapRecentOrders(orders);
  const completedBuyerCount = (buyerApplications ?? []).filter((application) =>
    /^APPROVED$/i.test(textValue(application, "status")),
  ).length;
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
          <AdminPanel title="운영 알림">
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>자동 회원가입</strong>
                  <p>구매 회원은 별도 승인 없이 가입과 동시에 활성화됩니다.</p>
                </div>
                <div className="admin-list-meta">
                  <AdminBadge tone="green">
                    {completedBuyerCount}건
                  </AdminBadge>
                  <Link className="admin-button secondary small" href="/admin/members">
                    회원관리
                  </Link>
                </div>
              </div>
              {!dealerAdmin ? <div className="admin-list-row">
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
              </div> : null}
              {!pendingDealerCount && !dealerAdmin ? (
                <div className="admin-list-row">
                  <div className="admin-row-stack">
                    <strong>처리할 딜러 신청이 없습니다.</strong>
                    <p>새 딜러 신청이 들어오면 이 영역에 건수로 표시됩니다.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="admin-grid-halves">
        <AdminPanel title={dealerAdmin ? "오늘 확인할 내용" : "오늘 처리할 일"}>
          <div className="admin-list">
            <Link className="admin-list-row" href="/admin/orders">
              <div className="admin-row-stack">
                <strong>{dealerAdmin ? "주문 확인" : "주문 처리"}</strong>
                <p>{dealerAdmin ? "내 딜러몰 주문과 배송 진행 상태를 확인하세요." : "접수된 주문을 상품 준비중으로 넘기고 배송 처리까지 이어가세요."}</p>
              </div>
              <div className="admin-list-meta">
                <AdminBadge tone={processingOrderCount ? "cyan" : "green"}>
                  {processingOrderCount}건
                </AdminBadge>
              </div>
            </Link>
            <Link className="admin-list-row" href="/admin/members">
              <div className="admin-row-stack">
                <strong>회원가입 현황</strong>
                <p>자동으로 가입된 구매 회원과 가입 경로를 확인하세요.</p>
              </div>
              <div className="admin-list-meta">
                <AdminBadge tone="green">
                  {completedBuyerCount}건
                </AdminBadge>
              </div>
            </Link>
            {!dealerAdmin ? <Link className="admin-list-row" href="/admin/dealers">
              <div className="admin-row-stack">
                <strong>딜러 신청</strong>
                <p>신규 딜러몰 요청과 공개 설정을 확인하세요.</p>
              </div>
              <div className="admin-list-meta">
                <AdminBadge tone={pendingDealerCount ? "violet" : "green"}>
                  {pendingDealerCount}건
                </AdminBadge>
              </div>
            </Link> : null}
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
