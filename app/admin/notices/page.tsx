import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { managedNotices, noticeMetrics } from "../../_lib/admin-data";

export default function AdminNoticesPage() {
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

      <AdminMetrics items={noticeMetrics} />

      <AdminPanel title="공지 목록">
        <AdminTable
          columns="minmax(110px, 0.7fr) minmax(0, 1.7fr) minmax(90px, 0.7fr) minmax(120px, 0.8fr) 110px"
          headers={["분류", "제목", "작성자", "수정일", "상태"]}
        >
          {managedNotices.map((notice) => (
            <Link className="admin-table-row" href={notice.adminHref} key={notice.slug}>
              <span className="admin-row-muted">{notice.category}</span>
              <div className="admin-row-stack">
                <strong>{notice.title}</strong>
                <p>{notice.summary}</p>
              </div>
              <span className="admin-row-muted">{notice.editor}</span>
              <span className="admin-row-muted">{notice.updatedAt}</span>
              <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
            </Link>
          ))}
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
