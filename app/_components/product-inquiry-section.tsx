"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProductInquiry } from "../_lib/product-inquiries";

function maskName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 1) {
    return trimmed || "회원";
  }
  return `${trimmed[0]}${"*".repeat(Math.min(2, trimmed.length - 1))}`;
}

export function ProductInquirySection({
  initialInquiries,
  loggedIn,
  productId,
  productSlug,
}: {
  initialInquiries: ProductInquiry[];
  loggedIn: boolean;
  productId?: number;
  productSlug: string;
}) {
  const [question, setQuestion] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitInquiry() {
    if (!productId || question.trim().length < 5) {
      setError("문의 내용을 5자 이상 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/member/products/${productId}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ question, privateYn: isPrivate ? "Y" : "N" }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string; ok?: boolean };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "상품 문의를 등록하지 못했습니다.");
      }

      const now = new Date().toLocaleDateString("ko-KR");
      setInquiries((current) => [
        {
          id: Date.now(),
          answer: "",
          answeredAt: "",
          authorName: "나",
          createdAt: now,
          isPrivate,
          question: question.trim(),
          status: "PENDING",
        },
        ...current,
      ]);
      setQuestion("");
      setIsPrivate(false);
      setMessage(data.message || "상품 문의를 등록했습니다.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "상품 문의를 등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="content-panel shop-inquiry-section" id="product-inquiries">
      <div className="shop-review-head">
        <h2 className="section-panel-title">상품 문의</h2>
        <strong>{inquiries.length}건</strong>
      </div>

      {loggedIn && productId ? (
        <div className="product-inquiry-form">
          <label>
            <span>문의 내용</span>
            <textarea
              maxLength={1_000}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="상품, 섭취, 배송 관련 문의를 남겨주세요. 개인정보는 입력하지 마세요."
              value={question}
            />
          </label>
          <div className="product-inquiry-form-actions">
            <label className="product-inquiry-private">
              <input checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} type="checkbox" />
              비밀글
            </label>
            <button className="button-primary" disabled={submitting} onClick={() => void submitInquiry()} type="button">
              {submitting ? "등록 중..." : "문의 등록"}
            </button>
          </div>
          {message ? <p className="member-auth-alert is-success">{message}</p> : null}
          {error ? <p className="member-auth-alert is-error">{error}</p> : null}
        </div>
      ) : (
        <div className="product-inquiry-login">
          <span>상품 문의는 회원 로그인 후 작성할 수 있습니다.</span>
          <Link className="button-secondary" href={`/login?next=/product/${productSlug}%23product-inquiries`}>
            로그인
          </Link>
        </div>
      )}

      <div className="product-inquiry-list">
        {inquiries.map((inquiry) => (
          <article className="product-inquiry-item" key={inquiry.id}>
            <div className="product-inquiry-meta">
              <span>{inquiry.answer ? "답변완료" : "답변대기"}</span>
              <span>{maskName(inquiry.authorName)}</span>
              <time>{inquiry.createdAt}</time>
            </div>
            <p>{inquiry.isPrivate && inquiry.authorName !== "나" ? "비밀글입니다." : inquiry.question}</p>
            {inquiry.answer && !inquiry.isPrivate ? (
              <div className="product-inquiry-answer">
                <strong>답변</strong>
                <p>{inquiry.answer}</p>
              </div>
            ) : null}
          </article>
        ))}
        {!inquiries.length ? <p className="shop-review-empty">등록된 상품 문의가 없습니다.</p> : null}
      </div>
    </article>
  );
}
