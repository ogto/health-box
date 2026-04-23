import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import { getManagedProductBySlug, managedProducts } from "../../../_lib/admin-data";

export function generateStaticParams() {
  return managedProducts.map((product) => ({ slug: product.slug }));
}

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getManagedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="admin-page">
      <AdminHeader
        title={product.title}
        actions={
          <>
            <Link className="admin-button" href={product.previewHref}>
              공개 페이지 보기
            </Link>
          </>
        }
      />

      <div className="admin-product-detail-hero">
        <div className="admin-product-detail-media">
          <div className="admin-product-detail-image">
            <Image
              alt={product.title}
              className="object-cover"
              fill
              sizes="(max-width: 1180px) 100vw, 360px"
              src={product.image}
            />
          </div>
          <div className="admin-product-thumb-grid">
            {product.gallery.map((image, index) => (
              <div className="admin-product-thumb-card" key={`${image}-${index}`}>
                <Image alt={`${product.title} 썸네일 ${index + 1}`} className="object-cover" fill sizes="88px" src={image} />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-product-detail-summary">
          <div className="admin-pill-row">
            <AdminBadge tone={product.publishTone}>{product.publishStatus}</AdminBadge>
            <AdminBadge tone={product.statusTone}>{product.badge}</AdminBadge>
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
          <AdminPanel title="노출 / 판매 상태">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>공개 상태</span>
                <AdminBadge tone={product.publishTone}>{product.publishStatus}</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>메인 운영</span>
                <AdminBadge tone={product.statusTone}>{product.displayStatus}</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>배송 안내</span>
                <AdminBadge tone="cyan">{product.shipping}</AdminBadge>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="바로가기">
            <div className="admin-action-stack">
              <Link className="admin-button" href={product.previewHref}>
                공개 상세 보기
              </Link>
              <Link className="admin-button secondary" href="/admin/notices">
                연관 공지 확인
              </Link>
              <Link className="admin-button secondary" href="/admin/products/new">
                유사 상품 복제 등록
              </Link>
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
