import { AdminHeader } from "../../_components/admin/admin-header";
import {
  AdminAuditLogDirectory,
  type AdminAuditLogListItem,
} from "../../_components/admin/admin-staff-directory";
import { AdminMetrics } from "../../_components/admin/admin-ui";
import {
  dateTimeValue,
  fetchAdminAuditLogs,
  idValue,
  stringValue,
  type HealthBoxRecord,
} from "../../_lib/health-box-api";

function asRecord(value: unknown) {
  return value as HealthBoxRecord;
}

export default async function AdminLogsPage() {
  const rawAuditLogs = await fetchAdminAuditLogs(500);
  const items: AdminAuditLogListItem[] = (rawAuditLogs ?? []).map((log, index) => {
    const record = asRecord(log);
    return {
      actionCode: stringValue(record, "actionCode") || "ADMIN_MUTATION",
      actionLabel: stringValue(record, "actionLabel") || "관리자 정보 변경",
      actorName: stringValue(record, "actorName") || "작업자 미확인",
      actorScope: stringValue(record, "actorScope"),
      createdAt: dateTimeValue(record, "createdAt") || "-",
      detailText: stringValue(record, "detailText"),
      id: idValue(record, "id") ?? index + 1,
      resultStatus: stringValue(record, "resultStatus") || "SUCCESS",
      targetId: stringValue(record, "targetId"),
      targetLabel: stringValue(record, "targetLabel"),
    };
  });

  const successCount = items.filter((item) => item.resultStatus === "SUCCESS").length;
  const failedCount = items.length - successCount;
  const actorCount = new Set(items.map((item) => `${item.actorScope}:${item.actorName}`)).size;

  return (
    <div className="admin-page">
      <AdminHeader title="로그관리" />
      <AdminMetrics
        items={[
          { label: "최근 기록", value: `${items.length}건`, hint: "최대 500건 조회", tone: "blue" },
          { label: "성공", value: `${successCount}건`, hint: "정상 처리된 작업", tone: "green" },
          { label: "실패", value: `${failedCount}건`, hint: "확인이 필요한 작업", tone: "rose" },
          { label: "작업자", value: `${actorCount}명`, hint: "소속·이름 기준", tone: "violet" },
        ]}
      />
      <AdminAuditLogDirectory items={items} />
    </div>
  );
}
