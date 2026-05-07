import Link from "next/link";

import { deleteNoticeAction } from "../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "../../_components/admin/admin-confirm-submit-button";
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
          alignments={["left", "left", "left", "left", "center", "center"]}
          columns="minmax(110px, 0.7fr) minmax(0, 1.7fr) minmax(90px, 0.7fr) minmax(120px, 0.8fr) 110px 82px"
          emptyDescription="등록된 공지 데이터가 없습니다."
          headers={["분류", "제목", "작성자", "등록일", "상태", "삭제"]}
          isEmpty={!rows.length}
        >
          {rows.map((notice) => {
            const deleteFormId = `admin-notice-delete-${notice.slug}`;

            return (
              <div className="admin-table-row" key={notice.slug}>
                <span className="admin-row-muted">{notice.category}</span>
                <Link className="admin-notice-title-link" href={notice.adminHref}>
                  {notice.title}
                </Link>
                <span className="admin-row-muted">{notice.editor}</span>
                <span className="admin-row-muted">{notice.date}</span>
                <AdminBadge className="admin-cell-center" tone={notice.tone}>{notice.status}</AdminBadge>
                {notice.recordId ? (
                  <>
                    <form action={deleteNoticeAction} id={deleteFormId}>
                      <input name="id" type="hidden" value={String(notice.recordId)} />
                      <input name="slug" type="hidden" value={notice.slug} />
                    </form>
                    <AdminConfirmSubmitButton
                      className="admin-button danger small admin-cell-center"
                      confirmMessage={`"${notice.title}" 공지를 삭제할까요? 삭제 후에는 공지 목록과 공개 페이지에서 보이지 않습니다.`}
                      confirmTitle="공지 삭제"
                      form={deleteFormId}
                      pendingLabel="삭제중..."
                      tone="danger"
                    >
                      삭제
                    </AdminConfirmSubmitButton>
                  </>
                ) : (
                  <span className="admin-row-muted admin-cell-center">-</span>
                )}
              </div>
            );
          })}
        </AdminTable>
      </AdminPanel>
    </div>
  );
}
