import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  salesChannelRows,
  salesCompanyRows,
  salesMetrics,
  salesMonthlyTrend,
} from "../../_lib/admin-data";

export default function AdminSalesPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="매출관리"
        description="회원사별 매출 흐름과 채널 비중, 월간 실적 추이를 함께 확인하는 매출 관리 화면입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/admin/orders">
              주문 흐름 보기
            </Link>
            <Link className="admin-button" href="/admin/settlements">
              정산 보드 보기
            </Link>
          </>
        }
      />

      <AdminMetrics items={salesMetrics} />

      <div className="admin-grid-side">
        <AdminPanel
          kicker="Company Sales"
          title="회원사별 매출 현황"
          description="이번 달 매출을 회원사 기준으로 나눠서 확인하는 기본 보드입니다."
        >
          <AdminTable
            columns="minmax(180px, 1.2fr) minmax(120px, 0.9fr) minmax(110px, 0.75fr) 90px 110px"
            headers={["회원사", "매출", "주문건수", "비중", "추이"]}
          >
            {salesCompanyRows.map((row) => (
              <div className="admin-table-row" key={row.company}>
                <div className="admin-row-stack">
                  <strong>
                    {row.company} · {row.type}
                  </strong>
                  <p>회원사 기준 월간 실적</p>
                </div>
                <strong className="admin-row-price">{row.sales}</strong>
                <span className="admin-row-muted">{row.orders}</span>
                <span className="admin-row-muted">{row.share}</span>
                <AdminBadge tone={row.tone}>{row.trend}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel
            kicker="Channel Mix"
            title="회원사 유형별 매출"
            description="직영, 딜러, 제휴 회원사로 구분한 매출 비중입니다."
          >
            <div className="admin-list">
              {salesChannelRows.map((row) => (
                <div className="admin-list-row" key={row.label}>
                  <div className="admin-row-stack">
                    <strong>{row.label}</strong>
                    <p>{row.note}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={row.tone}>{row.ratio}</AdminBadge>
                    <span>{row.sales}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Monthly Trend"
            title="월간 추이"
            description="회원사 전체 매출 기준 최근 4개월 추이입니다."
          >
            <div className="admin-sales-chart">
              {salesMonthlyTrend.map((item) => (
                <div className="admin-sales-chart-row" key={item.month}>
                  <span className="admin-sales-chart-label">{item.month}</span>
                  <div className="admin-sales-chart-track">
                    <div className="admin-sales-chart-bar" style={{ width: `${item.width}%` }} />
                  </div>
                  <strong className="admin-sales-chart-value">{item.sales}</strong>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Sales Notes"
            title="운영 메모"
            description="매출 화면에서 먼저 확인할 포인트입니다."
          >
            <ul className="admin-bullet-list">
              <li>회원사별 매출은 주문 귀속 회원사 기준으로 집계합니다.</li>
              <li>반품 요청 건은 매출에는 포함되지만 정산 전 차감 메모를 남깁니다.</li>
              <li>직영 회원사와 딜러 회원사의 비중을 함께 확인해야 확장 판단이 쉽습니다.</li>
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
