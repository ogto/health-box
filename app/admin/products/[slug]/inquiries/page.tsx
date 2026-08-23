import Link from "next/link";
import { notFound } from "next/navigation";

import { answerProductInquiryAction } from "../../../../_actions/health-box-admin";
import { AdminHeader } from "../../../../_components/admin/admin-header";
import { AdminBadge, AdminPanel } from "../../../../_components/admin/admin-ui";
import { fetchAdminProducts, hasHealthBoxApi } from "../../../../_lib/health-box-api";
import { findProductBySlug, mapProductRows } from "../../../../_lib/health-box-presenters";
import { fetchAdminProductInquiries } from "../../../../_lib/product-inquiries";

function fallbackProductId(slug: string) {
  const match = /^product-(\d+)$/i.exec(slug);
  return match ? Number(match[1]) : null;
}

export default async function AdminProductInquiriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ toast?: string; toastError?: string }>;
}) {
  const { slug } = await params;
  const messages = await searchParams;
  const page = hasHealthBoxApi() ? await fetchAdminProducts({ q: slug, page: 1, size: 20 }) : null;
  const product = findProductBySlug(mapProductRows(page).items, slug);
  const productId = product?.recordId || fallbackProductId(slug);

  if (!productId) {
    notFound();
  }

  const inquiries = await fetchAdminProductInquiries(productId);
  const redirectTo = `/admin/products/${slug}/inquiries`;

  return (
    <div className="admin-page">
      <AdminHeader
        title={`${product?.title || "상품"} Q&A`}
        actions={
          <Link className="admin-button secondary" href={`/admin/products/${slug}`}>
            상품 수정으로
          </Link>
        }
      />

      {messages.toast ? <p className="admin-inline-alert is-success">{messages.toast}</p> : null}
      {messages.toastError ? <p className="admin-inline-alert is-error">{messages.toastError}</p> : null}

      <AdminPanel
        title="상품 문의 답변"
        description="회원 문의를 확인하고 답변을 등록합니다. 비밀글 내용도 관리자에게는 표시됩니다."
      >
        <div className="admin-inquiry-list">
          {inquiries.map((inquiry) => (
            <article className="admin-inquiry-card" key={inquiry.id}>
              <div className="admin-inquiry-card-head">
                <div>
                  <AdminBadge tone={inquiry.answer ? "green" : "gold"}>
                    {inquiry.answer ? "답변완료" : "답변대기"}
                  </AdminBadge>
                  {inquiry.isPrivate ? <AdminBadge tone="violet">비밀글</AdminBadge> : null}
                </div>
                <span>{inquiry.authorName} · {inquiry.createdAt || "작성일 없음"}</span>
              </div>
              <p className="admin-inquiry-question">{inquiry.question}</p>
              <form action={answerProductInquiryAction} className="admin-inquiry-answer-form">
                <input name="inquiryId" type="hidden" value={inquiry.id} />
                <input name="productId" type="hidden" value={productId} />
                <input name="redirectTo" type="hidden" value={redirectTo} />
                <label className="admin-field">
                  <span>답변</span>
                  <textarea
                    className="admin-textarea"
                    defaultValue={inquiry.answer}
                    maxLength={2_000}
                    name="answer"
                    required
                  />
                </label>
                <button className="admin-button" type="submit">
                  {inquiry.answer ? "답변 수정" : "답변 등록"}
                </button>
              </form>
            </article>
          ))}

          {!inquiries.length ? (
            <div className="admin-empty-state">
              <strong>등록된 상품 문의가 없습니다.</strong>
              <p>외부 API에 접수된 문의가 생기면 이 화면에 표시됩니다.</p>
            </div>
          ) : null}
        </div>
      </AdminPanel>
    </div>
  );
}
