import Link from "next/link";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { fetchStoreNotices } from "../_lib/storefront-content";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export default async function NoticeListPage() {
  const { brand, dealer } = await getStorefrontRuntime();
  const notices = await fetchStoreNotices();

  return (
    <StoreShell activeKey="notice">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "공지사항" },
          ]}
        />

        <div className="notice-index-layout">
          <article className="content-panel notice-index-panel">
            <h2 className="detail-title">공지사항</h2>
            <p className="detail-copy">
              {dealer
                ? `${dealer.mallName} 운영 일정, 배송 안내, 상품 관련 공지를 한 곳에서 확인하실 수 있습니다.`
                : "운영 일정, 배송 안내, 상품 관련 공지를 한 곳에서 확인하실 수 있습니다."}
            </p>

            <div className="notice-table notice-table-standalone">
              <div className="notice-table-head">
                <span>분류</span>
                <span>제목</span>
                <span>등록일</span>
              </div>
              {notices.map((notice) => (
                <Link className="notice-table-row" href={`/notice/${notice.slug}`} key={notice.slug}>
                  <span className="notice-table-category">{notice.category}</span>
                  <p>{notice.title}</p>
                  <span className="notice-table-date">{notice.date}</span>
                </Link>
              ))}
              {!notices.length ? (
                <div className="content-panel">
                  <p className="detail-copy">등록된 공지가 아직 없습니다.</p>
                </div>
              ) : null}
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
                  <strong>운영 정책</strong>
                  <span>{brand.policyMessage}</span>
                </div>
                <div className="info-row">
                  <strong>문의 메일</strong>
                  <span>{dealer?.supportEmail || "1everybuy@naver.com"}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
