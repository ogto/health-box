import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { dealerMetrics, dealerRows } from "../../_lib/admin-data";

export default function AdminDealersPage() {
  return (
    <div className="admin-page">
      <AdminHeader title="딜러몰관리" />

      <AdminMetrics items={dealerMetrics} />

      <AdminPanel title="딜러몰">
        <AdminTable
          columns="minmax(0, 1fr) 96px 110px 120px 90px"
          headers={["딜러몰", "가입일", "누적 주문건수", "누적 판매", "상태"]}
        >
          {dealerRows.map((dealer) => (
            <div className="admin-table-row" key={dealer.name}>
              <strong>{dealer.name}</strong>
              <span className="admin-row-muted">{dealer.joinedAt}</span>
              <span className="admin-row-muted">{dealer.orderCount}</span>
              <strong className="admin-row-price">{dealer.totalSales}</strong>
              <AdminBadge tone={dealer.tone}>{dealer.status}</AdminBadge>
            </div>
          ))}
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
