import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminMemberApprovalActions } from "../../_components/admin/admin-member-approval-actions";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  dateTimeValue,
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerMallMembers,
  fetchAdminDealerMalls,
  fetchAdminMembers,
  hasHealthBoxApi,
  idValue,
  stringValue,
} from "../../_lib/health-box-api";
import {
  buildDealerMetrics,
  buildMemberMetrics,
  mapDealerRows,
  mapMemberRows,
} from "../../_lib/health-box-presenters";

type MembersSearchParams = {
  dealerMallId?: string;
  memberApprovalError?: string;
};

function buildMembersReturnPath(dealerMallId: number | null) {
  if (!dealerMallId) {
    return "/admin/members";
  }

  return `/admin/members?dealerMallId=${dealerMallId}`;
}

function isHqBuyerApplication(application: Record<string, unknown>) {
  return /^hq-public$/i.test(stringValue(application, "inboundChannel"));
}

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
  const membersReturnPath = buildMembersReturnPath(selectedDealerId);

  const scopedMembers =
    hasHealthBoxApi() && selectedDealer?.id
      ? await fetchAdminDealerMallMembers(selectedDealer.id)
      : allMembers;

  const metrics = buildMemberMetrics(scopedMembers, dealers, buyerApplications);
  const rawMemberRows = mapMemberRows(scopedMembers);
  const dealerNameById = new Map(dealerRows.map((dealer) => [dealer.id, dealer.name]));
  const hqBuyerMemberIds = new Set(
    (buyerApplications ?? [])
      .filter(isHqBuyerApplication)
      .map((application) => idValue(application, "buyerMemberId"))
      .filter((buyerMemberId): buyerMemberId is number => Boolean(buyerMemberId)),
  );
  const memberRows = rawMemberRows.map((member) => {
    const hqMember = member.dealerId === 0 || (Boolean(member.id) && hqBuyerMemberIds.has(member.id ?? 0));
    const dealerName =
      hqMember
        ? "본사몰"
        : member.dealer !== "-"
          ? member.dealer
          : member.dealerId
            ? dealerNameById.get(member.dealerId) || selectedDealer?.name || "-"
            : selectedDealer?.name || "-";
    return {
      ...member,
      dealer: dealerName,
    };
  });

  const pendingBuyerApplications = (buyerApplications ?? []).filter((application) => {
    const dealerMallId = idValue(application, "dealerMallId");
    const status = stringValue(application, "status");

    if (status && !/^PENDING$/i.test(status)) {
      return false;
    }

    if (selectedDealer?.id) {
      return dealerMallId === selectedDealer.id;
    }

    return true;
  });
  const pendingBuyerRows = pendingBuyerApplications.map((application, index) => {
    const applicationId = idValue(application, "id", "applicationId") ?? index + 1;
    const dealerMallId = idValue(application, "dealerMallId");
    const dealerName =
      isHqBuyerApplication(application) || dealerMallId === 0
        ? "본사몰"
        : stringValue(application, "dealerMallName", "mallName", "dealer") ||
          (dealerMallId ? dealerNameById.get(dealerMallId) : "") ||
          "-";
    const phone = stringValue(application, "phone");
    const email = stringValue(application, "email");
    const contact = [phone, email].filter(Boolean).join(" / ") || "-";
    const submittedAt =
      dateTimeValue(application, "appliedAt", "createdAt", "submittedAt", "requestedAt") || "-";

    return {
      applicationId,
      contact,
      dealerName,
      memberName: stringValue(application, "name", "buyerName") || "이름 없음",
      submittedAt,
    };
  });

  return (
    <div className="admin-page">
      <AdminHeader title="회원관리" />

      {params.memberApprovalError ? (
        <div className="admin-feedback is-error">{params.memberApprovalError}</div>
      ) : null}

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
        title="승인 대기 회원"
        action={<span className="admin-row-muted">총 {pendingBuyerApplications.length}명</span>}
      >
        <AdminTable
          alignments={["left", "left", "left", "center", "center", "center"]}
          columns="minmax(0, 0.84fr) minmax(0, 0.92fr) minmax(0, 1fr) 132px 90px minmax(260px, 1.08fr)"
          emptyDescription={
            selectedDealer
              ? "선택한 딜러몰에 승인 대기 회원이 없습니다."
              : "승인 대기 회원 신청이 없습니다."
          }
          headers={["이름", "가입 경로", "연락처", "신청일", "상태", "처리"]}
          isEmpty={!pendingBuyerRows.length}
        >
          {pendingBuyerRows.map((application) => {
            return (
              <div className="admin-table-row" key={application.applicationId}>
                <strong>{application.memberName}</strong>
                <span className="admin-row-muted">{application.dealerName}</span>
                <span className="admin-row-muted" title={application.contact}>{application.contact}</span>
                <span className="admin-row-muted">{application.submittedAt}</span>
                <AdminBadge tone="gold">승인 대기</AdminBadge>
                {hasHealthBoxApi() ? (
                  <AdminMemberApprovalActions
                    applicationId={application.applicationId}
                    memberName={application.memberName || "해당"}
                    returnPath={membersReturnPath}
                  />
                ) : (
                  <span className="admin-row-muted">API 미연결</span>
                )}
              </div>
            );
          })}
        </AdminTable>
      </AdminPanel>

      <AdminPanel
        title="회원 목록"
        action={<span className="admin-row-muted">총 {memberRows.length}명</span>}
      >
        <AdminTable
          alignments={["left", "left", "left", "center", "center", "right", "center"]}
          columns="minmax(0, 0.82fr) minmax(0, 1.08fr) minmax(0, 0.9fr) 132px 84px 118px 92px"
          emptyDescription={
            selectedDealer
              ? "선택한 딜러몰에 속한 회원이 없습니다."
              : "조회 가능한 회원 데이터가 없습니다."
          }
          headers={["이름", "연락처", "가입 경로", "가입일", "주문", "누적 구매", "상태"]}
          isEmpty={!memberRows.length}
        >
          {memberRows.map((member, index) => (
            <div className="admin-table-row" key={`${member.name}-${member.joinedAt}-${index}`}>
              <strong title={member.name}>{member.name}</strong>
              <div className="admin-row-stack">
                <strong title={member.phone}>{member.phone}</strong>
                <p title={member.email}>{member.email}</p>
              </div>
              <strong title={member.dealer}>{member.dealer}</strong>
              <span className="admin-row-muted admin-cell-center">{member.joinedAt}</span>
              <span className="admin-row-muted admin-cell-center">{member.orders}</span>
              <strong className="admin-row-price admin-cell-right">{member.purchases}</strong>
              <AdminBadge className="admin-cell-center" tone={member.tone}>{member.status}</AdminBadge>
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
