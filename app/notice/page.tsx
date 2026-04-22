import Link from "next/link";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { notices } from "../_lib/store-data";
import { storefrontConfig } from "../_lib/storefront-config";

export default function NoticeListPage() {
  const { brand } = storefrontConfig;

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
            <p className="section-kicker">Notice</p>
            <h2 className="detail-title">공지사항</h2>
            <p className="detail-copy">
              운영 안내, 배송 공지, 상품 운영 소식 등을 한 번에 확인할 수 있습니다.
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
            </div>
          </article>

          <aside className="side-stack">
            <div className="content-panel">
              <p className="section-kicker">고객센터</p>
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
                  <strong>바로가기</strong>
                  <span>
                    <Link href="/mypage">마이페이지</Link> · <Link href="/cart">장바구니</Link>
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </StoreShell>
  );
}
