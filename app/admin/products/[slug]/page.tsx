import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteProductAction, saveProductAction } from "../../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "../../../_components/admin/admin-confirm-submit-button";
import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminProductDetailBlocksEditor } from "../../../_components/admin/admin-product-detail-blocks-editor";
import { AdminProductImageUpload } from "../../../_components/admin/admin-product-image-upload";
import { AdminProductOptionsEditor } from "../../../_components/admin/admin-product-options-editor";
import {
  AdminPolicyTemplatePicker,
  type AdminPolicyTemplate,
} from "../../../_components/admin/admin-policy-template-picker";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import {
  fetchAdminCategories,
  fetchAdminProduct,
  fetchAdminProducts,
  fetchAdminDeliveryPolicies,
  fetchAdminSalesPolicies,
  hasHealthBoxApi,
  type HealthBoxPageResponse,
  type HealthBoxRecord,
  type HealthBoxSalesPolicy,
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

function mapPolicyTemplates(
  policies: HealthBoxSalesPolicy[] | null,
  type: "delivery" | "sales",
): AdminPolicyTemplate[] {
  return (policies || [])
    .filter((policy) => policy.id && policy.title && policy.content)
    .map((policy) => ({
      content: policy.content || "",
      id: `${type}-${policy.id}`,
      policyId: policy.id,
      sortOrder: policy.sortOrder ?? 0,
      status: policy.status || "ACTIVE",
      title: policy.title || "",
      type,
    }));
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

  const productId = product.recordId ?? fallbackProductId;
  const canSave = hasHealthBoxApi() && Boolean(productId);
  const productImages = Array.from(new Set([product.image, ...product.gallery].filter(Boolean)));
  const imageCount = productImages.length;
  const [salesPolicyTemplates, deliveryPolicyTemplates, categories] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminSalesPolicies().then((policies) => mapPolicyTemplates(policies, "sales")),
        fetchAdminDeliveryPolicies().then((policies) => mapPolicyTemplates(policies, "delivery")),
        fetchAdminCategories(),
      ])
    : [[], [], []];

  return (
    <div className="admin-page">
      <AdminHeader
        title="상품 수정"
        actions={
          <>
            <Link aria-label="상품 목록으로 돌아가기" className="admin-icon-button" href="/admin/products" title="상품 목록">
              <BackIcon />
            </Link>
            <Link className="admin-button" href={product.previewHref}>
              공개 페이지 보기
            </Link>
          </>
        }
      />

      <form action={saveProductAction} className="admin-product-edit-form" id="admin-product-save-form">
        <input name="id" type="hidden" value={String(productId ?? "")} />
        <input name="redirectTo" type="hidden" value={`/admin/products/${product.slug}`} />
        <input name="toast" type="hidden" value="상품 수정이 완료되었습니다." />

        <div className="admin-product-edit-topbar">
          <div>
            <span>상품 ID {product.id}</span>
            <strong>{product.title}</strong>
          </div>
          <div className="admin-pill-row">
            <AdminBadge tone={product.publishTone}>{product.publishStatus || "공개 상태 없음"}</AdminBadge>
            <AdminBadge tone="cyan">{product.category || "카테고리 미지정"}</AdminBadge>
            <AdminBadge tone={product.statusTone}>{product.status || "상태 미지정"}</AdminBadge>
          </div>
        </div>

        <section className="admin-product-edit-layout">
          <aside className="admin-product-edit-media">
            <AdminProductImageUpload defaultImages={productImages} />
          </aside>

          <div className="admin-product-edit-main">
            <AdminPanel
              className="admin-product-core-panel"
              title="기본 정보"
              description="상품명, 브랜드명, 검색과 공유에 쓰이는 정보를 관리합니다."
            >
              <div className="admin-field-grid two">
                <label className="admin-field span-two admin-title-field">
                  <span>상품명</span>
                  <input className="admin-input admin-title-input" defaultValue={product.title} name="name" required type="text" />
                </label>
                <label className="admin-field">
                  <span>브랜드명</span>
                  <input className="admin-input" defaultValue={product.brand} name="brandName" type="text" />
                </label>
                <label className="admin-field">
                  <span>카테고리</span>
                  <select className="admin-select" defaultValue={String(product.categoryId ?? categories?.[0]?.id ?? 1)} name="categoryId">
                    {categories?.length ? (
                      categories.map((category) => (
                        <option key={category.id || category.slug || category.name} value={category.id}>
                          {category.name || category.categoryCode || `카테고리 ${category.id}`}
                        </option>
                      ))
                    ) : (
                      <option value={product.categoryId ?? 1}>{product.category || "기본 카테고리"}</option>
                    )}
                  </select>
                </label>
              </div>
            </AdminPanel>

            <AdminPanel title="가격 정보" description="고객에게 보이는 가격과 정산 기준 가격입니다.">
              <div className="admin-price-grid">
                <label className="admin-field admin-price-field">
                  <span>소비자가</span>
                  <input className="admin-input" defaultValue={product.consumerPrice ?? ""} min="0" name="consumerPrice" type="number" />
                </label>
                <label className="admin-field admin-price-field">
                  <span>회원가</span>
                  <input className="admin-input" defaultValue={product.memberPrice ?? ""} min="0" name="memberPrice" type="number" />
                </label>
                <label className="admin-field admin-price-field">
                  <span>공급가</span>
                  <input className="admin-input" defaultValue={product.supplyPrice ?? ""} min="0" name="supplyPrice" type="number" />
                </label>
                <label className="admin-field admin-price-field">
                  <span>정산 기준가</span>
                  <input
                    className="admin-input"
                    defaultValue={product.settlementBasePrice ?? ""}
                    min="0"
                    name="settlementBasePrice"
                    type="number"
                  />
                </label>
              </div>
            </AdminPanel>

            <AdminPanel title="옵션 / 옵션별 재고" description="상품의 선택 옵션별로 가격과 재고를 관리합니다.">
              <AdminProductOptionsEditor
                defaultConsumerPrice={product.consumerPrice}
                defaultMemberPrice={product.memberPrice}
                defaultOptionGroups={product.optionGroups}
                defaultOptionUseYn={product.optionUseYn}
                defaultSettlementBasePrice={product.settlementBasePrice}
                defaultSkus={product.skus}
                defaultSupplyPrice={product.supplyPrice}
                productName={product.title}
              />
            </AdminPanel>

            <div className="admin-product-edit-columns">
              <AdminPanel title="판매 상태" description="판매 가능 여부와 가격 노출 정책을 설정합니다.">
                <div className="admin-field-grid two">
                  <label className="admin-field">
                    <span>판매 상태</span>
                    <select className="admin-select" defaultValue={product.status || "ACTIVE"} name="status">
                      <option value="ACTIVE">판매중</option>
                      <option value="INACTIVE">판매중지</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>공개 상태</span>
                    <input className="admin-input" defaultValue={product.publishStatus} name="publishStatus" type="text" />
                  </label>
                  <label className="admin-field">
                    <span>가격 노출</span>
                    <select className="admin-select" defaultValue={product.priceExposurePolicy || "MEMBER_ONLY"} name="priceExposurePolicy">
                      <option value="MEMBER_ONLY">회원가 노출</option>
                      <option value="PUBLIC">정가/회원가 모두 노출</option>
                      <option value="CONTACT">가격 문의</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>정렬 순서</span>
                    <input className="admin-input" defaultValue={product.sortOrder ?? ""} min="0" name="sortOrder" type="number" />
                  </label>
                </div>
              </AdminPanel>

              <AdminPanel title="저장 전 확인" description="대표 이미지와 가격 노출 상태를 확인하세요.">
                <div className="admin-product-check-list">
                  <div>
                    <span>등록 이미지</span>
                    <strong>{imageCount}개</strong>
                  </div>
                  <div>
                    <span>현재 회원가</span>
                    <strong>{product.price}</strong>
                  </div>
                  <div>
                    <span>최근 수정</span>
                    <strong>{product.updatedAt || "수정 이력 없음"}</strong>
                  </div>
                </div>
              </AdminPanel>
            </div>

            <AdminPanel title="상품 상세 콘텐츠" description="텍스트와 이미지를 원하는 순서대로 쌓아 상세 페이지를 구성합니다.">
              <AdminProductDetailBlocksEditor defaultHtml={product.detailHtml} />
            </AdminPanel>

            <AdminPanel title="판매/배송 문구" description="상품 상세 하단과 구매 안내에 노출되는 운영 문구입니다.">
              <div className="admin-field-grid two">
                <div className="span-two">
                  <AdminPolicyTemplatePicker
                    defaultValue={product.salesPolicyText}
                    initialTemplates={salesPolicyTemplates}
                    label="판매정책"
                    name="salesPolicyText"
                    type="sales"
                  />
                </div>
                <div className="span-two">
                  <AdminPolicyTemplatePicker
                    defaultValue={product.deliveryPolicyText || product.shipping}
                    initialTemplates={deliveryPolicyTemplates}
                    label="배송정책"
                    name="deliveryPolicyText"
                    type="delivery"
                  />
                </div>
              </div>
            </AdminPanel>
          </div>
        </section>

        <div className="admin-product-save-strip is-bottom">
          <div>
            <strong>{product.updatedAt || "수정 이력 없음"}</strong>
            <span>변경 내용을 확인한 뒤 상품 정보를 저장합니다.</span>
          </div>
          {canSave ? (
            <div className="admin-product-save-actions">
              <AdminConfirmSubmitButton
                className="admin-button danger admin-delete-button"
                confirmMessage="이 상품을 삭제 처리할까요? 상품은 물리 삭제되지 않고 삭제 상태로 전환됩니다."
                confirmTitle="상품 삭제"
                form="admin-product-delete-form"
                pendingLabel="삭제 처리중..."
                tone="danger"
              >
                상품 삭제
              </AdminConfirmSubmitButton>
              <AdminConfirmSubmitButton
                className="admin-button admin-save-button"
                confirmMessage="변경한 상품 정보를 저장할까요?"
                confirmTitle="상품 수정"
                form="admin-product-save-form"
                pendingLabel="수정 중..."
              >
                상품 수정
              </AdminConfirmSubmitButton>
            </div>
          ) : (
            <button className="admin-button admin-save-button" disabled type="button">
              상품 ID 없음
            </button>
          )}
        </div>
      </form>

      <form action={deleteProductAction} id="admin-product-delete-form">
        <input name="id" type="hidden" value={String(productId ?? "")} />
        <input name="slug" type="hidden" value={product.sourceSlug} />
      </form>
    </div>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
