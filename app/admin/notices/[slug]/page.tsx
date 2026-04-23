import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import { getManagedNoticeBySlug, managedNotices } from "../../../_lib/admin-data";

export function generateStaticParams() {
  return managedNotices.map((notice) => ({ slug: notice.slug }));
}

export default async function AdminNoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const notice = getManagedNoticeBySlug(slug);

  if (!notice) {
    notFound();
  }

  return (
    <div className="admin-page">
      <AdminHeader
        title={notice.title}
        actions={
          <>
            <Link className="admin-button secondary" href={notice.previewHref}>
              공개 보기
            </Link>
            <button className="admin-button" type="button">
              수정 저장
            </button>
          </>
        }
      />

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <AdminPanel title="기본 정보">
            <div className="admin-field-grid two">
              <div className="admin-field read-only">
                <span>분류</span>
                <strong>{notice.category}</strong>
              </div>
              <div className="admin-field read-only">
                <span>공개 범위</span>
                <strong>{notice.visibility}</strong>
              </div>
              <div className="admin-field read-only span-two">
                <span>요약</span>
                <strong>{notice.summary}</strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="본문">
            <div className="admin-section-card-list">
              {notice.paragraphs.map((paragraph, index) => (
                <div className="admin-section-card" key={`${notice.slug}-paragraph-${index}`}>
                  <div className="admin-detail-block-head">
                    <span className="admin-step-index">{index + 1}</span>
                    <div className="admin-row-stack">
                      <strong>본문 {index + 1}</strong>
                    </div>
                  </div>
                  <p className="admin-section-card-body">{paragraph}</p>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="체크리스트">
            <ul className="admin-bullet-list">
              {notice.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="게시 상태">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>게시 상태</span>
                <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
              </div>
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

          <AdminPanel title="운영 메모">
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>슬러그</strong>
                  <p>{notice.slug}</p>
                </div>
              </div>
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>공개 링크</strong>
                  <p>{notice.previewHref}</p>
                </div>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
