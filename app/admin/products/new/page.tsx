import { saveProductAction } from "../../../_actions/health-box-admin";
import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../../_components/admin/admin-submit-button";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import { hasHealthBoxApi } from "../../../_lib/health-box-api";

export default function AdminProductNewPage() {
  return (
    <div className="admin-page">
      <AdminHeader title="신규 상품 등록" />

      <form action={saveProductAction} className="admin-form-layout">
        <input name="redirectTo" type="hidden" value="/admin/products" />

        <div className="admin-form-main">
          <AdminPanel title="기본 정보">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>브랜드명</span>
                <input className="admin-input" name="brandName" placeholder="예: 건강창고 셀렉트" type="text" />
              </label>
              <label className="admin-field">
                <span>카테고리 ID</span>
                <input className="admin-input" name="categoryId" placeholder="예: 1" type="number" />
              </label>
              <label className="admin-field span-two">
                <span>상품명</span>
                <input className="admin-input" name="name" placeholder="상품명을 입력하세요" type="text" />
              </label>
              <label className="admin-field span-two">
                <span>짧은 소개 문구</span>
                <input className="admin-input" name="subtitle" placeholder="목록용 짧은 소개 문구" type="text" />
              </label>
              <label className="admin-field span-two">
                <span>슬러그</span>
                <input className="admin-input" name="slug" placeholder="예: daily-vitamin-balance-plus" type="text" />
              </label>
              <label className="admin-field span-two">
                <span>요약 설명</span>
                <textarea className="admin-textarea" name="summary" placeholder="상품 요약을 입력하세요" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="운영 설정">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>노출 상태</span>
                <select className="admin-select" defaultValue="정상 판매" name="publishStatus">
                  <option>메인 노출중</option>
                  <option>정상 판매</option>
                  <option>재고 주의</option>
                  <option>추천 운영</option>
                </select>
              </label>
              <label className="admin-field">
                <span>판매 상태 코드</span>
                <select className="admin-select" defaultValue="ACTIVE" name="status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
              <label className="admin-field">
                <span>대표 배지</span>
                <input className="admin-input" name="badge" placeholder="예: 베스트" type="text" />
              </label>
              <label className="admin-field">
                <span>배송 문구</span>
                <input className="admin-input" name="shipping" placeholder="예: 오늘 출고 가능" type="text" />
              </label>
              <label className="admin-field span-two">
                <span>대표 이미지 URL</span>
                <input className="admin-input" name="image" placeholder="https://..." type="url" />
              </label>
              <label className="admin-field span-two">
                <span>운영 메모</span>
                <textarea className="admin-textarea" name="note" placeholder="재고, 추천 영역, 운영 메모를 입력하세요" />
              </label>
            </div>
          </AdminPanel>

        </div>

        <div className="admin-form-side">
          <AdminPanel title="등록 상태">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>작성 상태</span>
                <AdminBadge tone="gold">신규 작성</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>API 연동</span>
                <AdminBadge tone={hasHealthBoxApi() ? "green" : "rose"}>
                  {hasHealthBoxApi() ? "연결됨" : "미연결"}
                </AdminBadge>
              </div>
            </div>
          </AdminPanel>

          <div className="admin-action-stack">
            {hasHealthBoxApi() ? (
              <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
                등록 요청 저장
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
