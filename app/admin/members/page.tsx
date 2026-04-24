import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerMallMembers,
  fetchAdminDealerMalls,
  fetchAdminMembers,
  hasHealthBoxApi,
} from "../../_lib/health-box-api";
import {
  buildDealerMetrics,
  buildMemberMetrics,
  mapDealerRows,
  mapMemberRows,
} from "../../_lib/health-box-presenters";

type MembersSearchParams = {
  dealerMallId?: string;
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<MembersSearchParams>;
}) {
  const params = await searchParams;
  const [dealers, allMembers, buyerApplications] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminDealerMalls(),
        fetchAdminMembers(),
        fetchAdminBuyerSignupApplications(),
      ])
    : [null, null, null];

  const dealerRows = mapDealerRows(dealers);
  const selectedDealerId = Number(params.dealerMallId) || null;
  const selectedDealer = dealerRows.find((dealer) => dealer.id === selectedDealerId) || null;

  const scopedMembers =
    hasHealthBoxApi() && selectedDealer?.id
      ? await fetchAdminDealerMallMembers(selectedDealer.id)
      : allMembers;

  const metrics = buildMemberMetrics(scopedMembers, dealers, buyerApplications);
  const memberRows = mapMemberRows(scopedMembers);

  return (
    <div className="admin-page">
      <AdminHeader title="회원관리" />

      <AdminMetrics items={metrics} />

      <AdminPanel
        title="조회 범위"
        action={
          <span className="admin-row-muted">
            {selectedDealer ? `${selectedDealer.name} 기준` : "전체 딜러몰 기준"}
          </span>
        }
      >
        <div className="admin-filter-chip-set">
          <Link
            className={`admin-button secondary small${selectedDealer ? "" : " is-active"}`}
            href="/admin/members"
          >
            전체 회원
          </Link>
          {dealerRows.map((dealer) => (
            <Link
              className={`admin-button secondary small${selectedDealer?.id === dealer.id ? " is-active" : ""}`}
              href={`/admin/members?dealerMallId=${dealer.id}`}
              key={dealer.id}
            >
              {dealer.name}
            </Link>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel
        title="회원 목록"
        action={<span className="admin-row-muted">총 {memberRows.length}명</span>}
      >
        <AdminTable
          columns="minmax(0, 1fr) minmax(0, 1fr) 96px 72px 110px 90px"
          emptyDescription={
            selectedDealer
              ? "선택한 딜러몰에 속한 회원이 없습니다."
              : "조회 가능한 회원 데이터가 없습니다."
          }
          headers={["이름", "딜러몰", "가입일", "주문", "누적 구매", "상태"]}
          isEmpty={!memberRows.length}
        >
          {memberRows.map((member, index) => (
            <div className="admin-table-row" key={`${member.name}-${member.joinedAt}-${index}`}>
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

      {selectedDealer ? (
        <AdminPanel title="딜러몰 요약">
          <AdminMetrics items={buildDealerMetrics(dealers, scopedMembers, null)} />
        </AdminPanel>
      ) : null}
    </div>
  );
}
