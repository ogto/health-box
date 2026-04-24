import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { fetchAdminNotices, hasHealthBoxApi } from "../../_lib/health-box-api";
import { buildNoticeMetrics, mapNoticeRows } from "../../_lib/health-box-presenters";

export default async function AdminNoticesPage() {
  const notices = hasHealthBoxApi() ? await fetchAdminNotices() : null;
  const metrics = buildNoticeMetrics(notices);
  const rows = mapNoticeRows(notices);

  return (
    <div className="admin-page">
      <AdminHeader
        title="공지관리"
        actions={
          <Link className="admin-button" href="/admin/notices/new">
            공지 작성
          </Link>
        }
      />

      <AdminMetrics items={metrics} />

      <AdminPanel
        title="공지 목록"
        action={<span className="admin-row-muted">총 {rows.length}건</span>}
      >
        <AdminTable
          columns="minmax(110px, 0.7fr) minmax(0, 1.7fr) minmax(90px, 0.7fr) minmax(120px, 0.8fr) 110px"
          emptyDescription="등록된 공지 데이터가 없습니다."
          headers={["분류", "제목", "작성자", "등록일", "상태"]}
          isEmpty={!rows.length}
        >
          {rows.map((notice) => (
            <Link className="admin-table-row" href={notice.adminHref} key={notice.slug}>
              <span className="admin-row-muted">{notice.category}</span>
              <strong>{notice.title}</strong>
              <span className="admin-row-muted">{notice.editor}</span>
              <span className="admin-row-muted">{notice.date}</span>
              <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
            </Link>
          ))}
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
