import { AdminHeader } from "../../_components/admin/admin-header";
import {
  AdminStaffDirectory,
  type AdminStaffDealerOption,
  type AdminStaffListItem,
} from "../../_components/admin/admin-staff-directory";
import { AdminMetrics } from "../../_components/admin/admin-ui";
import { AdminReadOnlyNotice } from "../../_components/admin/admin-read-only-notice";
import {
  dateTimeValue,
  fetchAdminDealerMalls,
  fetchAdminStaff,
  idValue,
  stringValue,
  type HealthBoxRecord,
} from "../../_lib/health-box-api";
import { getAdminSession } from "../../_lib/admin-auth";

type StaffSearchParams = {
  staffError?: string;
  staffSaved?: string;
};

function asRecord(value: unknown) {
  return value as HealthBoxRecord;
}

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<StaffSearchParams>;
}) {
  const [params, session, rawStaff, rawDealers] = await Promise.all([
    searchParams,
    getAdminSession(),
    fetchAdminStaff(),
    fetchAdminDealerMalls(),
  ]);
  const dealerAdmin = session?.scopeType === "DEALER";

  const dealers: AdminStaffDealerOption[] = (rawDealers ?? []).map((dealer, index) => ({
    id: idValue(dealer, "id", "dealerMallId") ?? index + 1,
    name: stringValue(dealer, "mallName", "displayName", "name") || `딜러몰 ${index + 1}`,
  }));

  const items: AdminStaffListItem[] = (rawStaff ?? []).map((staff, index) => {
    const record = asRecord(staff);
    const roleType = /^OWNER$/i.test(stringValue(record, "roleType")) ? "OWNER" : "STAFF";
    const scopeType = /^DEALER$/i.test(stringValue(record, "scopeType")) ? "DEALER" : "HQ";
    const status = /^INACTIVE$/i.test(stringValue(record, "status")) ? "INACTIVE" : "ACTIVE";
    return {
      dealerMallId: idValue(record, "dealerMallId"),
      email: stringValue(record, "email"),
      id: idValue(record, "id") ?? index + 1,
      joinedAt: dateTimeValue(record, "joinedAt", "createdAt") || "-",
      lastLoginAt: dateTimeValue(record, "lastLoginAt") || "-",
      loginId: stringValue(record, "loginId"),
      memo: stringValue(record, "memo"),
      name: stringValue(record, "name") || "이름 없음",
      permissionCodes: Array.isArray(staff.permissionCodes)
        ? staff.permissionCodes.filter((code): code is string => typeof code === "string")
        : [],
      phone: stringValue(record, "phone") || "-",
      positionName: stringValue(record, "positionName"),
      roleType,
      scopeName: stringValue(record, "scopeName") || (scopeType === "HQ" ? "본사몰" : "딜러몰"),
      scopeType,
      status,
    };
  });

  const activeCount = items.filter((staff) => staff.status === "ACTIVE").length;
  const hqCount = items.filter((staff) => staff.scopeType === "HQ").length;
  const dealerCount = items.filter((staff) => staff.scopeType === "DEALER").length;
  const ownerCount = items.filter((staff) => staff.roleType === "OWNER").length;

  return (
    <div className="admin-page">
      <AdminHeader title={dealerAdmin ? "직원조회" : "직원관리"} />
      {params.staffSaved ? <div className="admin-feedback is-success">{params.staffSaved}</div> : null}
      {params.staffError ? <div className="admin-feedback is-error">{params.staffError}</div> : null}
      <AdminMetrics
        items={[
          { label: "전체 직원", value: `${items.length}명`, hint: "등록 계정 기준", tone: "blue" },
          { label: "사용 중", value: `${activeCount}명`, hint: "로그인 허용 예정", tone: "green" },
          {
            label: "소속 구분",
            value: dealerAdmin ? session?.scopeName || "딜러몰" : `본사 ${hqCount} · 딜러 ${dealerCount}`,
            hint: dealerAdmin ? "내 딜러몰 직원만 표시" : "직원 소속 기준",
            tone: "cyan",
          },
          { label: "대표자", value: `${ownerCount}명`, hint: "전체 권한 보유", tone: "violet" },
        ]}
      />
      {dealerAdmin ? <AdminReadOnlyNotice scopeName={session?.scopeName} /> : null}
      <AdminStaffDirectory
        dealers={dealers}
        items={items}
        readOnly={dealerAdmin}
        lockedScope={dealerAdmin && session?.dealerMallId ? {
          dealerMallId: session.dealerMallId,
          name: session.scopeName,
        } : undefined}
      />
    </div>
  );
}
