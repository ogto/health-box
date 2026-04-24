import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { saveProductAction } from "../../../_actions/health-box-admin";
import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../../_components/admin/admin-submit-button";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import {
  fetchAdminProduct,
  fetchAdminProducts,
  hasHealthBoxApi,
  type HealthBoxPageResponse,
  type HealthBoxRecord,
} from "../../../_lib/health-box-api";
import { findProductBySlug, mapProductRows } from "../../../_lib/health-box-presenters";

function toProductRow(record: HealthBoxRecord | null) {
  if (!record) {
    return null;
  }

  const pageLike: HealthBoxPageResponse<HealthBoxRecord> = {
    content: [record],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 1,
  };

  return mapProductRows(pageLike).items[0] ?? null;
}

function extractProductIdFromFallbackSlug(slug: string) {
  const match = /^product-(\d+)$/i.exec(slug);
  return match ? Number(match[1]) : null;
}

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fallbackProductId = extractProductIdFromFallbackSlug(slug);
  const page = hasHealthBoxApi() ? await fetchAdminProducts({ q: slug, page: 1, size: 20 }) : null;
  const listedProduct = findProductBySlug(mapProductRows(page).items, slug);
  const detailedProduct =
    hasHealthBoxApi() && (listedProduct?.recordId || fallbackProductId)
      ? toProductRow(await fetchAdminProduct(listedProduct?.recordId || fallbackProductId || 0))
      : null;
  const product =
    listedProduct && detailedProduct
      ? { ...listedProduct, ...detailedProduct }
      : detailedProduct || listedProduct;

  if (!product) {
    notFound();
  }

  const canSave = hasHealthBoxApi() && Boolean(product.recordId);

  return (
    <div className="admin-page">
      <AdminHeader
        title={product.title}
        actions={
          <Link className="admin-button" href={product.previewHref}>
            공개 페이지 보기
          </Link>
        }
      />

      <div className="admin-product-detail-hero">
        <div className="admin-product-detail-media">
          <div className="admin-product-detail-image">
            {product.image ? (
              <Image
                alt={product.title}
                className="object-cover"
                fill
                sizes="(max-width: 1180px) 100vw, 360px"
                src={product.image}
              />
            ) : (
              <div className="admin-empty-state">
                <strong>대표 이미지 없음</strong>
                <p>상품 이미지가 아직 등록되지 않았습니다.</p>
              </div>
            )}
          </div>
          <div className="admin-product-thumb-grid">
            {product.gallery.map((image, index) => (
              <div className="admin-product-thumb-card" key={`${image}-${index}`}>
                <Image alt={`${product.title} 썸네일 ${index + 1}`} className="object-cover" fill sizes="88px" src={image} />
              </div>
            ))}
            {!product.gallery.length ? <p className="admin-row-muted">추가 갤러리 이미지가 없습니다.</p> : null}
          </div>
        </div>

        <div className="admin-product-detail-summary">
          <div className="admin-pill-row">
            <AdminBadge tone={product.publishTone}>{product.publishStatus}</AdminBadge>
            {product.badge ? <AdminBadge tone={product.statusTone}>{product.badge}</AdminBadge> : null}
            <AdminBadge tone="cyan">{product.category}</AdminBadge>
          </div>

          <div className="admin-row-stack">
            <strong className="admin-detail-brand">{product.brand}</strong>
            <h2 className="admin-detail-product-title">{product.title}</h2>
            <p className="admin-detail-product-subtitle">{product.subtitle}</p>
          </div>

          <div className="admin-insight-grid">
            <div className="admin-insight-card">
              <span>상품코드</span>
              <strong>{product.id}</strong>
            </div>
            <div className="admin-insight-card">
              <span>월간 매출</span>
              <strong>{product.monthlySales}</strong>
            </div>
            <div className="admin-insight-card">
              <span>재고 수량</span>
              <strong>{product.inventoryCount}</strong>
            </div>
            <div className="admin-insight-card">
              <span>최근 수정</span>
              <strong>{product.updatedAt}</strong>
            </div>
          </div>

          <div className="admin-list">
            <div className="admin-list-row">
              <div className="admin-row-stack">
                <strong>운영 메모</strong>
                <p>{product.editorNote}</p>
              </div>
              <AdminBadge tone="gold">{product.displayStatus}</AdminBadge>
            </div>
            <div className="admin-list-row">
              <div className="admin-row-stack">
                <strong>노출 위치</strong>
                <p>{product.exposureZones.join(" · ")}</p>
              </div>
              <AdminBadge tone="blue">노출중</AdminBadge>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid-side">
        <div className="admin-stack">
          <AdminPanel title="기본 정보">
            <div className="admin-field-grid two read-only">
              <div className="admin-field read-only">
                <span>브랜드명</span>
                <strong>{product.brand}</strong>
              </div>
              <div className="admin-field read-only">
                <span>카테고리</span>
                <strong>{product.category}</strong>
              </div>
              <div className="admin-field read-only span-two">
                <span>상품 요약</span>
                <strong>{product.summary}</strong>
              </div>
              <div className="admin-field read-only span-two">
                <span>하이라이트</span>
                <strong>{product.highlights.join(" · ")}</strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="상세 본문 구성">
            <div className="admin-section-card-list">
              {product.detailSections.map((section, index) => (
                <div className="admin-section-card" key={section.title}>
                  <div className="admin-detail-block-head">
                    <span className="admin-step-index">{index + 1}</span>
                    <div className="admin-row-stack">
                      <strong>{section.title}</strong>
                      <p>{section.caption}</p>
                    </div>
                  </div>
                  <p className="admin-section-card-body">{section.body}</p>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="스펙 / 배송 안내">
            <div className="admin-spec-list">
              {product.specs.map((spec) => (
                <div className="admin-spec-row" key={spec.label}>
                  <span>{spec.label}</span>
                  <strong>{spec.value}</strong>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="admin-stack">
          <AdminPanel title="빠른 수정">
            <form action={saveProductAction} className="admin-status-stack">
              <input name="id" type="hidden" value={String(product.recordId ?? "")} />
              <input name="categoryId" type="hidden" value={String(product.categoryId ?? "")} />
              <input name="redirectTo" type="hidden" value={`/admin/products/${product.slug}`} />
              <label className="admin-field">
                <span>브랜드명</span>
                <input className="admin-input" defaultValue={product.brand} name="brandName" type="text" />
              </label>
              <label className="admin-field">
                <span>상품명</span>
                <input className="admin-input" defaultValue={product.title} name="name" type="text" />
              </label>
              <label className="admin-field">
                <span>짧은 소개 문구</span>
                <input className="admin-input" defaultValue={product.subtitle} name="subtitle" type="text" />
              </label>
              <label className="admin-field">
                <span>슬러그</span>
                <input className="admin-input" defaultValue={product.sourceSlug} name="slug" type="text" />
              </label>
              <label className="admin-field">
                <span>노출 상태</span>
                <input className="admin-input" defaultValue={product.publishStatus} name="publishStatus" type="text" />
              </label>
              <label className="admin-field">
                <span>판매 상태 코드</span>
                <input className="admin-input" defaultValue={product.status} name="status" type="text" />
              </label>
              <label className="admin-field">
                <span>대표 배지</span>
                <input className="admin-input" defaultValue={product.badge} name="badge" type="text" />
              </label>
              <label className="admin-field">
                <span>배송 문구</span>
                <input className="admin-input" defaultValue={product.shipping} name="shipping" type="text" />
              </label>
              <label className="admin-field">
                <span>대표 이미지 URL</span>
                <input className="admin-input" defaultValue={product.image} name="image" type="url" />
              </label>
              <label className="admin-field">
                <span>요약 설명</span>
                <textarea className="admin-textarea" defaultValue={product.summary} name="summary" />
              </label>
              <label className="admin-field">
                <span>운영 메모</span>
                <textarea className="admin-textarea" defaultValue={product.editorNote} name="note" />
              </label>
              {canSave ? (
                <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
                  수정 저장
                </AdminSubmitButton>
              ) : (
                <div className="admin-row-muted">API 상품 ID를 찾지 못해 저장 버튼을 비활성화했습니다.</div>
              )}
            </form>
          </AdminPanel>

          <AdminPanel title="상세 연결 상태">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>공개 상세 연결</span>
                <AdminBadge tone="blue">연결됨</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>상세 이미지 수</span>
                <strong>{product.detailImageCount}개</strong>
              </div>
              <div className="admin-status-row">
                <span>대표 썸네일</span>
                <strong>{product.gallery.length}컷</strong>
              </div>
              <div className="admin-status-row">
                <span>노출 위치</span>
                <strong>{product.exposureZones.join(" · ")}</strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="운영 메모">
            <ul className="admin-bullet-list">
              <li>{product.editorNote}</li>
              <li>상품 상세 이미지 {product.detailImageCount}개가 공개 화면에 연결되어 있습니다.</li>
              <li>회원가 문구는 현재 &quot;{product.price}&quot; 기준으로 노출됩니다.</li>
              <li>추천 세트와 메인 노출 위치 변경 시 기획전 페이지도 함께 점검합니다.</li>
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
