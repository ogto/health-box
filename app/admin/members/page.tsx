import { AdminHeader } from "../../_components/admin/admin-header";
import {
  AdminMembersDirectory,
  type AdminMemberApplicationListItem,
  type AdminMemberDealerOption,
  type AdminMemberListItem,
} from "../../_components/admin/admin-members-directory";
import { AdminMetrics } from "../../_components/admin/admin-ui";
import { AdminReadOnlyNotice } from "../../_components/admin/admin-read-only-notice";
import { getAdminSession } from "../../_lib/admin-auth";
import type { AdminTone } from "../../_lib/admin-data";
import {
  dateTimeValue,
  fetchAdminBuyerSignupApplications,
  fetchAdminDealerMalls,
  fetchAdminMembers,
  hasHealthBoxApi,
  idValue,
  stringValue,
} from "../../_lib/health-box-api";
import { buildMemberMetrics, mapDealerRows, mapMemberRows } from "../../_lib/health-box-presenters";

type MembersSearchParams = {
  dealerMallId?: string;
  memberApprovalError?: string;
};

function isHqBuyerApplication(application: Record<string, unknown>) {
  return /^hq-public$/i.test(stringValue(application, "inboundChannel"));
}

function applicationStatus(status: string): {
  label: string;
  raw: string;
  tone: AdminTone;
} {
  if (/^APPROVED$/i.test(status)) {
    return { label: "가입 완료", raw: "APPROVED", tone: "green" };
  }
  if (/^REJECTED$/i.test(status)) {
    return { label: "반려", raw: "REJECTED", tone: "rose" };
  }
  return { label: "처리 대기", raw: "PENDING", tone: "gold" };
}

function memberStatus(status: string): {
  key: "ACTIVE" | "INACTIVE";
  label: string;
  tone: AdminTone;
} {
  if (/ACTIVE|활성|정상/i.test(status) && !/INACTIVE|비활성/i.test(status)) {
    return { key: "ACTIVE", label: "활성", tone: "green" };
  }
  if (/SUSPENDED|중지|정지/i.test(status)) {
    return { key: "INACTIVE", label: "이용 중지", tone: "rose" };
  }
  return { key: "INACTIVE", label: status && status !== "-" ? status : "비활성", tone: "cyan" };
}

function marketingConsent(value: string) {
  return /^Y$/i.test(value) ? "동의" : "미동의";
}

function selectedDealerId(value: string | undefined) {
  if (value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<MembersSearchParams>;
}) {
  const [params, session] = await Promise.all([searchParams, getAdminSession()]);
  const dealerAdmin = session?.scopeType === "DEALER";
  const [dealers, allMembers, buyerApplications] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminDealerMalls(),
        fetchAdminMembers(),
        fetchAdminBuyerSignupApplications(),
      ])
    : [null, null, null];

  const dealerRows = mapDealerRows(dealers, allMembers);
  const dealerNameById = new Map(dealerRows.map((dealer) => [dealer.id, dealer.name]));
  const dealerOptions: AdminMemberDealerOption[] = [
    { id: 0, name: "본사몰" },
    ...dealerRows.map((dealer) => ({ id: dealer.id, name: dealer.name })),
  ];
  const hqBuyerMemberIds = new Set(
    (buyerApplications ?? [])
      .filter(isHqBuyerApplication)
      .map((application) => idValue(application, "buyerMemberId"))
      .filter((buyerMemberId): buyerMemberId is number => buyerMemberId !== null),
  );

  const memberRows: AdminMemberListItem[] = mapMemberRows(allMembers).map((member, index) => {
    const source = allMembers?.[index] ?? {};
    const hqMember = member.dealerId === 0 || (member.id !== null && hqBuyerMemberIds.has(member.id));
    const dealerId = hqMember ? 0 : member.dealerId ?? -1;
    const dealerName = hqMember
      ? "본사몰"
      : member.dealer !== "-"
        ? member.dealer
        : member.dealerId
          ? dealerNameById.get(member.dealerId) || "가입 경로 미확인"
          : "가입 경로 미확인";
    const status = memberStatus(member.status);

    return {
      birthDate: stringValue(source, "birthDate") || "-",
      consentVersion: stringValue(source, "consentDocumentVersion") || "-",
      dealer: dealerName,
      dealerId,
      email: member.email,
      id: member.id,
      joinedAt: member.joinedAt,
      marketingConsent: marketingConsent(stringValue(source, "marketingConsentYn")),
      name: member.name,
      orders: member.orders,
      organization: member.organization,
      phone: member.phone,
      privacyAgreedAt: dateTimeValue(source, "privacyAgreedAt") || "-",
      purchases: member.purchases,
      status: status.label,
      statusKey: status.key,
      statusTone: status.tone,
      termsAgreedAt: dateTimeValue(source, "termsAgreedAt") || "-",
      thirdPartyAgreedAt: dateTimeValue(source, "thirdPartyAgreedAt") || "-",
    };
  });

  const applicationRows: AdminMemberApplicationListItem[] = (buyerApplications ?? []).map((application, index) => {
    const applicationId = idValue(application, "id", "applicationId") ?? index + 1;
    const rawDealerMallId = idValue(application, "dealerMallId");
    const hqApplication = isHqBuyerApplication(application) || rawDealerMallId === 0;
    const dealerMallId = hqApplication ? 0 : rawDealerMallId ?? -1;
    const dealerName = hqApplication
      ? "본사몰"
      : stringValue(application, "dealerMallName", "mallName", "dealer") ||
        (rawDealerMallId ? dealerNameById.get(rawDealerMallId) : "") ||
        "가입 경로 미확인";
    const status = applicationStatus(stringValue(application, "status"));

    return {
      applicationId,
      approvedAt: dateTimeValue(application, "approvedAt") || "-",
      birthDate: stringValue(application, "birthDate") || "-",
      consentVersion: stringValue(application, "consentDocumentVersion") || "-",
      dealerMallId,
      dealerName,
      email: stringValue(application, "email") || "-",
      marketingConsent: marketingConsent(stringValue(application, "marketingConsentYn")),
      memberName: stringValue(application, "name", "buyerName") || "이름 없음",
      phone: stringValue(application, "phone") || "-",
      rejectReason: stringValue(application, "rejectReason"),
      status: status.raw,
      statusLabel: status.label,
      statusTone: status.tone,
      submittedAt: dateTimeValue(application, "appliedAt", "createdAt", "submittedAt", "requestedAt") || "-",
    };
  });

  return (
    <div className="admin-page">
      <AdminHeader title={dealerAdmin ? "회원조회" : "회원관리"} />

      {params.memberApprovalError ? <div className="admin-feedback is-error">{params.memberApprovalError}</div> : null}

      <AdminMetrics items={buildMemberMetrics(allMembers, dealers, buyerApplications)} />

      {dealerAdmin ? <AdminReadOnlyNotice scopeName={session?.scopeName} /> : null}

      <AdminMembersDirectory
        actionsEnabled={false}
        applications={applicationRows}
        dealerOptions={dealerOptions}
        initialDealerId={selectedDealerId(params.dealerMallId)}
        members={memberRows}
      />
    </div>
  );
}
