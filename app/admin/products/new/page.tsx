import Link from "next/link";

import { saveProductAction } from "../../../_actions/health-box-admin";
import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminProductDetailBlocksEditor } from "../../../_components/admin/admin-product-detail-blocks-editor";
import { AdminProductImageUpload } from "../../../_components/admin/admin-product-image-upload";
import { AdminSubmitButton } from "../../../_components/admin/admin-submit-button";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import { hasHealthBoxApi } from "../../../_lib/health-box-api";

const statusOptions = [
  { label: "판매중", value: "ACTIVE" },
  { label: "판매중지", value: "INACTIVE" },
] as const;

const publishStatusOptions = [
  { label: "정상 판매", value: "정상 판매" },
  { label: "메인 노출중", value: "메인 노출중" },
  { label: "추천 운영", value: "추천 운영" },
  { label: "재고 주의", value: "재고 주의" },
  { label: "비공개", value: "비공개" },
] as const;

const priceExposureOptions = [
  { label: "회원가 노출", value: "MEMBER_ONLY" },
  { label: "정가/회원가 모두 노출", value: "PUBLIC" },
  { label: "가격 문의", value: "CONTACT" },
] as const;

export default function AdminProductNewPage() {
  const apiConnected = hasHealthBoxApi();

  return (
    <div className="admin-page">
      <AdminHeader
        title="상품 등록"
        actions={
          <Link className="admin-button secondary" href="/admin/products">
            목록으로
          </Link>
        }
      />

      <form action={saveProductAction} className="admin-form-layout">
        <input name="redirectTo" type="hidden" value="/admin/products" />
        <input name="toast" type="hidden" value="상품 등록이 완료되었습니다." />

        <div className="admin-form-main">
          <AdminPanel title="기본 정보">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>브랜드명</span>
                <input className="admin-input" name="brandName" placeholder="예: 건강창고" type="text" />
              </label>

              <label className="admin-field">
                <span>카테고리 ID</span>
                <input className="admin-input" min="1" name="categoryId" placeholder="예: 1" type="number" />
              </label>

              <label className="admin-field span-two">
                <span>상품명</span>
                <input className="admin-input" name="name" placeholder="상품명을 입력하세요" required type="text" />
              </label>

              <label className="admin-field span-two">
                <span>슬러그</span>
                <input
                  className="admin-input"
                  name="slug"
                  placeholder="예: daily-vitamin-balance"
                  required
                  type="text"
                />
              </label>

              <label className="admin-field span-two">
                <span>요약 설명</span>
                <textarea
                  className="admin-textarea"
                  name="summaryText"
                  placeholder="상품 목록과 상세 상단에 사용할 짧은 소개를 입력하세요."
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="상품 상세 콘텐츠">
            <AdminProductDetailBlocksEditor />
          </AdminPanel>

          <AdminPanel title="가격 / 정산">
            <div className="admin-field-grid three">
              <label className="admin-field">
                <span>소비자가</span>
                <input className="admin-input" min="0" name="consumerPrice" placeholder="예: 59000" type="number" />
              </label>

              <label className="admin-field">
                <span>회원가</span>
                <input className="admin-input" min="0" name="memberPrice" placeholder="예: 39000" type="number" />
              </label>

              <label className="admin-field">
                <span>공급가</span>
                <input className="admin-input" min="0" name="supplyPrice" placeholder="예: 25000" type="number" />
              </label>

              <label className="admin-field">
                <span>정산 기준가</span>
                <input
                  className="admin-input"
                  min="0"
                  name="settlementBasePrice"
                  placeholder="예: 30000"
                  type="number"
                />
              </label>

              <label className="admin-field">
                <span>정렬 순서</span>
                <input className="admin-input" min="0" name="sortOrder" placeholder="예: 10" type="number" />
              </label>

              <label className="admin-field">
                <span>가격 노출 정책</span>
                <select className="admin-select" defaultValue="MEMBER_ONLY" name="priceExposurePolicy">
                  {priceExposureOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="판매 / 배송 문구">
            <div className="admin-field-grid two">
              <label className="admin-field span-two">
                <span>판매 정책 문구</span>
                <textarea
                  className="admin-textarea"
                  name="salesPolicyText"
                  placeholder="회원 구매 조건, 할인, 묶음 판매 등 판매 안내 문구를 입력하세요."
                />
              </label>

              <label className="admin-field span-two">
                <span>배송 정책 문구</span>
                <textarea
                  className="admin-textarea"
                  name="deliveryPolicyText"
                  placeholder="예: 평일 오전 주문 건 당일 출고 / 본사 통합 배송"
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="노출 상태">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>판매 상태</span>
                <select className="admin-select" defaultValue="ACTIVE" name="status">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-field">
                <span>공개 상태</span>
                <select className="admin-select" defaultValue="정상 판매" name="publishStatus">
                  {publishStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="상품 이미지">
            <AdminProductImageUpload />
          </AdminPanel>

          <AdminPanel title="API 5.0 저장 필드">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>연동 상태</span>
                <AdminBadge tone={apiConnected ? "green" : "rose"}>
                  {apiConnected ? "연결됨" : "미연결"}
                </AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>저장 방식</span>
                <AdminBadge tone="blue">PUT</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>상세 콘텐츠</span>
                <strong>detailHtml</strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="등록 체크">
            <ul className="admin-bullet-list">
              <li>상품명과 슬러그는 필수입니다.</li>
              <li>대표 이미지는 상품 목록과 상세 상단에 사용됩니다.</li>
              <li>상세 콘텐츠는 텍스트/이미지 블록 순서대로 공개 페이지에 노출됩니다.</li>
              <li>등록 후 상품 목록과 공개 상품 영역 캐시가 갱신됩니다.</li>
            </ul>
          </AdminPanel>

          <div className="admin-action-stack">
            {apiConnected ? (
              <AdminSubmitButton className="admin-button" pendingLabel="저장 중...">
                상품 저장
              </AdminSubmitButton>
            ) : (
              <button className="admin-button" disabled type="button">
                API 연결 필요
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
