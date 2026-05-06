import { notFound } from "next/navigation";
import Link from "next/link";

import { MemberAccountLayout } from "../../_components/member-account-layout";
import { Breadcrumbs, NoticeRow, StoreShell } from "../../_components/store-ui";
import { getMemberSession } from "../../_lib/member-auth";
import {
  fetchStoreNoticeBySlug,
  fetchStoreNotices,
} from "../../_lib/storefront-content";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [runtime, session, notice, notices] = await Promise.all([
    getStorefrontRuntime(),
    getMemberSession(),
    fetchStoreNoticeBySlug(slug),
    fetchStoreNotices(),
  ]);
  const { dealer } = runtime;

  if (!notice) {
    notFound();
  }

  const latestNotices = notices.filter((entry) => entry.slug !== notice.slug).slice(0, 3);
  const noticeContent = (
    <>
      <div className="cart-page-head detail-page-head">
        <Link aria-label="공지사항 목록으로" className="cart-back-link" href="/notice">
          <span aria-hidden="true">‹</span>
        </Link>
        <h1>공지사항</h1>
        <div className="detail-page-meta">
          <strong>{notice.date}</strong>
        </div>
      </div>

      <div className="notice-detail-grid">
        <article className="notice-article">
          <div className="notice-head">
            <div className="detail-chip-row">
              <span className="detail-chip primary">{notice.category}</span>
              <span className="detail-chip">{notice.date}</span>
            </div>
            <h2 className="detail-title">{notice.title}</h2>
          </div>

          <div className="stack-paragraphs">
            {notice.paragraphs.length ? (
              notice.paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph}`}>{paragraph}</p>
              ))
            ) : (
              <p>등록된 공지 본문이 없습니다.</p>
            )}
          </div>

        </article>

        <aside className="side-stack">
          <div className="content-panel">
            <h3 className="section-panel-title">문의 안내</h3>
            <div className="info-panel compact">
              <div className="info-row">
                <strong>상담 시간</strong>
                <span>평일 09:00 - 18:00</span>
              </div>
              <div className="info-row">
                <strong>회원 정책</strong>
                <span>
                  {dealer
                    ? `${dealer.displayName} 회원 승인 이후 가격 및 주문 기능 제공`
                    : "회원 승인 이후 가격 및 주문 기능 제공"}
                </span>
              </div>
              <div className="info-row">
                <strong>문의 메일</strong>
                <span>{dealer?.supportEmail || "1everybuy@naver.com"}</span>
              </div>
            </div>
          </div>

          <div className="content-panel">
            <h3 className="section-panel-title">다른 공지 보기</h3>
            <div className="notice-list compact-list">
              {latestNotices.map((entry) => (
                <NoticeRow key={entry.slug} notice={entry} />
              ))}
              {!latestNotices.length ? (
                <p className="member-auth-empty">다른 공지가 아직 없습니다.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </>
  );

  return (
    <StoreShell activeKey="notice">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "공지사항" },
          ]}
        />

        {session ? (
          <MemberAccountLayout activeKey="notice" runtime={runtime} session={session}>
            {noticeContent}
          </MemberAccountLayout>
        ) : (
          noticeContent
        )}
      </section>
    </StoreShell>
  );
}
