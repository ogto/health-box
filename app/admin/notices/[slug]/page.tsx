import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminBadge } from "../../../_components/admin/admin-ui";
import {
  fetchAdminNotice,
  fetchAdminNotices,
  hasHealthBoxApi,
  type HealthBoxRecord,
} from "../../../_lib/health-box-api";
import { findNoticeBySlug, mapNoticeRows } from "../../../_lib/health-box-presenters";

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

export default async function AdminNoticeDetailPage({
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
        title="공지 상세"
        actions={
          <div className="admin-inline-actions">
            <Link className="admin-button" href={notice.editHref}>
              수정하기
            </Link>
          </div>
        }
      />

      <div className="admin-notice-detail-shell">
        <article className="notice-article admin-notice-article">
          <div className="notice-head admin-notice-head">
            <div className="detail-chip-row">
              <span className="detail-chip primary">{notice.category}</span>
              <span className="detail-chip">{notice.date}</span>
              <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
            </div>
            <h2 className="detail-title admin-notice-detail-title">{notice.title}</h2>
          </div>

          <div className="admin-notice-detail-body">
            <div className="stack-paragraphs">
              {notice.paragraphs.length ? (
                notice.paragraphs.map((paragraph: string, index: number) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))
              ) : (
                <p>등록된 공지 본문이 없습니다.</p>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
