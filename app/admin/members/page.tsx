import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { memberMetrics, memberRows } from "../../_lib/admin-data";

export default function AdminMembersPage() {
  return (
    <div className="admin-page">
      <AdminHeader title="회원관리" />

      <AdminMetrics items={memberMetrics} />

      <AdminPanel title="회원 목록">
        <AdminTable
          columns="minmax(0, 1fr) minmax(0, 1fr) 96px 72px 110px 90px"
          headers={["이름", "딜러몰", "가입일", "주문", "누적 구매", "상태"]}
        >
          {memberRows.map((member) => (
            <div className="admin-table-row" key={`${member.name}-${member.joinedAt}`}>
              <strong>{member.name}</strong>
              <div className="admin-row-stack">
                <strong>{member.dealer}</strong>
                <p>{member.organization}</p>
              </div>
              <span className="admin-row-muted">{member.joinedAt}</span>
              <span className="admin-row-muted">{member.orders}</span>
              <strong className="admin-row-price">{member.purchases}</strong>
              <AdminBadge tone={member.tone}>{member.status}</AdminBadge>
            </div>
          ))}
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
