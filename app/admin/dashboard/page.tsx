import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  approvalQueue,
  dashboardMetrics,
  inventoryAlerts,
  latestAdminNotices,
  recentOrders,
} from "../../_lib/admin-data";

export default function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <AdminHeader title="대시보드" />

      <AdminMetrics items={dashboardMetrics} />

      <div className="admin-grid-main">
        <AdminPanel title="최근 주문">
          <AdminTable
            columns="minmax(150px, 1fr) minmax(0, 1.5fr) minmax(110px, 0.8fr) 110px"
            headers={["주문번호", "회원 / 상품", "결제금액", "상태"]}
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
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="admin-grid-halves">
        <AdminPanel title="재고 알림">
          <div className="admin-list">
            {inventoryAlerts.map((item) => (
              <div className="admin-list-row" key={item.title}>
                <div className="admin-row-stack">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="admin-list-meta">
                  <AdminBadge tone={item.tone}>{item.level}</AdminBadge>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="최근 공지">
          <div className="admin-list">
            {latestAdminNotices.map((notice) => (
              <Link className="admin-list-row" href={notice.previewHref} key={notice.slug}>
                <div className="admin-row-stack">
                  <strong>{notice.title}</strong>
                  <p>
                    {notice.category} · {notice.date}
                  </p>
                </div>
                <div className="admin-list-meta">
                  <AdminBadge tone={notice.statusTone}>{notice.status}</AdminBadge>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
