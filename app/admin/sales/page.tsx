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
      <AdminHeader title="매출 / 정산" />

      <AdminMetrics items={salesMetrics} />

      <div className="admin-grid-side">
        <AdminPanel title="회원사별 매출 / 정산">
          <AdminTable
            columns="minmax(0, 1.1fr) minmax(0, 0.9fr) 110px 90px 100px 120px 90px"
            headers={["회원사", "소속 조직", "월 매출", "주문", "차감액", "예상 정산", "상태"]}
          >
            {salesCompanyRows.map((row) => (
              <div className="admin-table-row" key={row.company}>
                <div className="admin-row-stack">
                  <strong>
                    {row.company} · {row.type}
                  </strong>
                  <p>회원사 기준 월간 실적</p>
                </div>
                <span className="admin-row-muted">{row.parent}</span>
                <strong className="admin-row-price">{row.sales}</strong>
                <span className="admin-row-muted">{row.orders}</span>
                <span className="admin-row-muted">{row.deduction}</span>
                <strong className="admin-row-price">{row.estimated}</strong>
                <AdminBadge tone={row.tone}>{row.trend}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel title="유형별 집계">
            <div className="admin-list">
              {salesChannelRows.map((row) => (
                <div className="admin-list-row" key={row.label}>
                  <div className="admin-row-stack">
                    <strong>{row.label}</strong>
                    <p>{row.note}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={row.tone}>예상 정산 {row.ratio}</AdminBadge>
                    <span>{row.sales}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="월간 추이">
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

          <AdminPanel title="정산 메모">
            <ul className="admin-bullet-list">
              <li>웰니스강남과 라이프케어 파트너몰은 검수중 상태로 유지합니다.</li>
              <li>바이오파트너는 반품 차감 반영 후 정산액을 재확인합니다.</li>
              <li>직영 회원사는 본몰 기준으로 확정 정산합니다.</li>
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
