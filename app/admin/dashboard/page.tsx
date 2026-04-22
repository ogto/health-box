import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  approvalQueue,
  dashboardMetrics,
  dashboardShortcuts,
  inventoryAlerts,
  latestAdminNotices,
  recentOrders,
} from "../../_lib/admin-data";

export default function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="대시보드"
        description="주문, 회원 승인, 재고 알림, 최근 공지를 한 화면에서 확인하는 건강창고 관리자 메인입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/">
              쇼핑몰 보기
            </Link>
            <Link className="admin-button" href="/admin/orders">
              오늘 주문 확인
            </Link>
          </>
        }
      />

      <AdminMetrics items={dashboardMetrics} />

      <div className="admin-grid-main">
        <AdminPanel
          kicker="Realtime Orders"
          title="최근 주문"
          description="주문관리 화면으로 이어지는 최근 주문 요약입니다."
          action={
            <Link className="admin-inline-link" href="/admin/orders">
              전체 주문 보기
            </Link>
          }
        >
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
          <AdminPanel kicker="Quick Actions" title="바로가기">
            <div className="admin-shortcut-grid">
              {dashboardShortcuts.map((shortcut) => (
                <Link className="admin-shortcut-card" href={shortcut.href} key={shortcut.href}>
                  <strong>{shortcut.title}</strong>
                  <p>{shortcut.description}</p>
                </Link>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Approval Queue"
            title="승인 대기"
            description="회원 승인과 딜러 신청 검토가 필요한 항목입니다."
            action={
              <Link className="admin-inline-link" href="/admin/members">
                회원관리 이동
              </Link>
            }
          >
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
        <AdminPanel
          kicker="Inventory Signals"
          title="재고 및 노출 알림"
          description="메인 노출 상품과 입고 예정 상품 위주로 빠르게 보는 운영 메모입니다."
        >
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

        <AdminPanel
          kicker="Latest Notices"
          title="최근 공지"
          description="쇼핑몰 공지 노출 상태와 최근 업데이트 흐름입니다."
          action={
            <Link className="admin-inline-link" href="/admin/notices">
              공지관리 이동
            </Link>
          }
        >
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
