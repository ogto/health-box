import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { managedNotices, noticeMetrics } from "../../_lib/admin-data";

export default function AdminNoticesPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="공지관리"
        description="쇼핑몰 공지의 공개 상태, 상단 고정 여부, 운영 정책 전달 흐름을 관리하는 화면입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/notice">
              공지 목록 보기
            </Link>
            <Link className="admin-button" href="/admin/operation-settings">
              운영 정책 보기
            </Link>
          </>
        }
      />

      <AdminMetrics items={noticeMetrics} />

      <div className="admin-grid-side">
        <AdminPanel
          kicker="Notice List"
          title="공지 목록"
          description="카테고리를 나누지 않고 게시판형으로 관리하는 현재 구조 기준입니다."
        >
          <AdminTable
            columns="minmax(110px, 0.8fr) minmax(0, 1.6fr) minmax(120px, 0.9fr) 110px"
            headers={["분류", "제목", "수정일", "상태"]}
          >
            {managedNotices.map((notice) => (
              <Link className="admin-table-row" href={notice.previewHref} key={notice.slug}>
                <span className="admin-row-muted">{notice.category}</span>
                <div className="admin-row-stack">
                  <strong>{notice.title}</strong>
                  <p>{notice.summary}</p>
                </div>
                <span className="admin-row-muted">{notice.updatedAt}</span>
                <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
              </Link>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel
            kicker="Posting Guide"
            title="운영 가이드"
            description="공지 등록 시 우선 확인할 기준입니다."
          >
            <ul className="admin-bullet-list">
              <li>회원 승인/가격 노출 정책은 항상 상단 고정 공지로 유지합니다.</li>
              <li>배송/정기배송/기획전 정책은 실제 운영 시점에 맞춰 즉시 갱신합니다.</li>
              <li>딜러 구조 확장 안내는 내부 운영 결정 후 공개 범위를 조정합니다.</li>
            </ul>
          </AdminPanel>

          <AdminPanel
            kicker="Preview"
            title="공개 페이지 바로가기"
            description="실제 쇼핑몰 화면에서 바로 검수할 수 있습니다."
          >
            <div className="admin-list">
              {managedNotices.map((notice) => (
                <Link className="admin-list-row" href={notice.previewHref} key={notice.slug}>
                  <div className="admin-row-stack">
                    <strong>{notice.title}</strong>
                    <span>{notice.date}</span>
                  </div>
                  <AdminBadge tone={notice.tone}>{notice.status}</AdminBadge>
                </Link>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
