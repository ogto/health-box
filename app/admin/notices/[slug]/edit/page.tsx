import Link from "next/link";
import { notFound } from "next/navigation";

import { saveNoticeAction } from "../../../../_actions/health-box-admin";
import { AdminHeader } from "../../../../_components/admin/admin-header";
import { AdminNoticeBodyEditor } from "../../../../_components/admin/admin-notice-body-editor";
import { AdminSubmitButton } from "../../../../_components/admin/admin-submit-button";
import { AdminPanel } from "../../../../_components/admin/admin-ui";
import {
  fetchAdminNotice,
  fetchAdminNotices,
  hasHealthBoxApi,
  type HealthBoxRecord,
} from "../../../../_lib/health-box-api";
import { findNoticeBySlug, mapNoticeRows } from "../../../../_lib/health-box-presenters";

function toNoticeRow(record: HealthBoxRecord | null) {
  if (!record) {
    return null;
  }

  return mapNoticeRows([record])[0] ?? null;
}

function extractNoticeIdFromFallbackSlug(slug: string) {
  const match = /^notice-(\d+)$/i.exec(slug);
  return match ? Number(match[1]) : null;
}

export default async function AdminNoticeEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fallbackNoticeId = extractNoticeIdFromFallbackSlug(slug);
  const notices = hasHealthBoxApi() ? await fetchAdminNotices() : null;
  const listedNotice = findNoticeBySlug(mapNoticeRows(notices), slug);
  const detailedNotice =
    hasHealthBoxApi() && (listedNotice?.recordId || fallbackNoticeId)
      ? toNoticeRow(await fetchAdminNotice(listedNotice?.recordId || fallbackNoticeId || 0))
      : null;
  const notice =
    listedNotice && detailedNotice
      ? { ...listedNotice, ...detailedNotice }
      : detailedNotice || listedNotice;

  if (!notice) {
    notFound();
  }

  return (
    <div className="admin-page">
      <AdminHeader
        title="공지 수정"
        actions={
          <div className="admin-inline-actions">
            <Link className="admin-button secondary" href={notice.previewHref}>
              공개 보기
            </Link>
            <Link className="admin-button secondary" href={notice.adminHref}>
              상세로 돌아가기
            </Link>
          </div>
        }
      />

      <form action={saveNoticeAction} className="admin-form-layout">
        <input name="id" type="hidden" value={String(notice.recordId ?? "")} />
        <input name="redirectTo" type="hidden" value={`/admin/notices/${notice.slug}`} />
        <input name="slug" type="hidden" value={notice.sourceSlug} />
        <input name="category" type="hidden" value={notice.category} />
        <input name="visibility" type="hidden" value={notice.visibility} />

        <div className="admin-form-main">
          <AdminPanel title="공지 내용">
            <div className="admin-field-grid">
              <label className="admin-field">
                <span>제목</span>
                <input className="admin-input" defaultValue={notice.title} name="title" type="text" />
              </label>
              <div className="admin-field">
                <span>내용</span>
                <AdminNoticeBodyEditor defaultBody={notice.bodyHtml || notice.paragraphs.join("\n")} />
              </div>
            </div>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="게시 상태">
            <div className="admin-status-stack">
              <label className="admin-field">
                <span>상태</span>
                <select className="admin-select" defaultValue={notice.status} name="status">
                  <option>게시중</option>
                  <option>상단 고정</option>
                  <option>임시 저장</option>
                </select>
              </label>
              <div className="admin-status-row">
                <span>작성자</span>
                <strong className="admin-row-price">{notice.editor}</strong>
              </div>
              <div className="admin-status-row">
                <span>수정일</span>
                <strong className="admin-row-price">{notice.updatedAt}</strong>
              </div>
            </div>
          </AdminPanel>

          <div className="admin-action-stack">
            {hasHealthBoxApi() ? (
              <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
                수정 저장
              </AdminSubmitButton>
            ) : (
              <button className="admin-button" disabled type="button">
                API 연결 필요
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
