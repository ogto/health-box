import { notFound } from "next/navigation";

import { Breadcrumbs, NoticeRow, StoreShell } from "../../_components/store-ui";
import { getNoticeBySlug, notices } from "../../_lib/store-data";

export function generateStaticParams() {
  return notices.map((notice) => ({ slug: notice.slug }));
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const notice = getNoticeBySlug(slug);

  if (!notice) {
    notFound();
  }

  const latestNotices = notices.filter((entry) => entry.slug !== notice.slug).slice(0, 3);

  return (
    <StoreShell activeKey="notice">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "공지사항" },
          ]}
        />

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
              {notice.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
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
                  <span>회원 승인 이후 가격 및 주문 기능 제공</span>
                </div>
                <div className="info-row">
                  <strong>문의 메일</strong>
                  <span>1everybuy@naver.com</span>
                </div>
              </div>
            </div>

            <div className="content-panel">
              <h3 className="section-panel-title">다른 공지 보기</h3>
              <div className="notice-list compact-list">
                {latestNotices.map((entry) => (
                  <NoticeRow key={entry.slug} notice={entry} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
