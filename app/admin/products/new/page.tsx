import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import { productExposureSlots, productUploadFlow, uploadMediaGuide } from "../../../_lib/admin-data";

const detailBlocks = [
  {
    title: "도입 섹션",
    description: "상품 핵심 포인트와 첫 구매 이유를 바로 읽히게 구성",
  },
  {
    title: "상세 설명 섹션",
    description: "루틴, 섭취 흐름, 운영 포인트를 이미지와 함께 배치",
  },
  {
    title: "스펙/보관 안내",
    description: "섭취 방법, 포장 단위, 배송·보관 정보를 요약",
  },
] as const;

export default function AdminProductNewPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="신규 상품 등록"
        actions={
          <>
            <button className="admin-button" type="button">
              임시 저장
            </button>
          </>
        }
      />

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <AdminPanel title="기본 정보">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>브랜드명</span>
                <input className="admin-input" defaultValue="건강창고 셀렉트" type="text" />
              </label>
              <label className="admin-field">
                <span>상품 카테고리</span>
                <select className="admin-input">
                  <option>종합비타민</option>
                  <option>장 건강</option>
                  <option>단백질</option>
                  <option>눈 건강</option>
                </select>
              </label>
              <label className="admin-field span-two">
                <span>상품명</span>
                <input
                  className="admin-input"
                  defaultValue="예: 데일리 비타민 밸런스 플러스"
                  type="text"
                />
              </label>
              <label className="admin-field span-two">
                <span>짧은 소개 문구</span>
                <input
                  className="admin-input"
                  defaultValue="예: 첫 구매 회원에게 가장 많이 제안하는 기본 영양 루틴"
                  type="text"
                />
              </label>
              <label className="admin-field span-two">
                <span>슬러그</span>
                <input
                  className="admin-input"
                  defaultValue="daily-vitamin-balance-plus"
                  type="text"
                />
              </label>
              <label className="admin-field span-two">
                <span>운영 메모</span>
                <textarea
                  className="admin-textarea"
                  defaultValue="메인 노출 가능성, 재고 확인 포인트, 추천 세트 연결 메모를 남깁니다."
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="가격 / 노출 설정">
            <div className="admin-field-grid three">
              <label className="admin-field">
                <span>소비자 노출 문구</span>
                <input className="admin-input" defaultValue="회원가 로그인 후 확인" type="text" />
              </label>
              <label className="admin-field">
                <span>출고 상태</span>
                <select className="admin-input">
                  <option>오늘 출고 가능</option>
                  <option>재구매 추천</option>
                  <option>묶음 구성 가능</option>
                  <option>추천 세트 운영</option>
                </select>
              </label>
              <label className="admin-field">
                <span>대표 배지</span>
                <select className="admin-input">
                  <option>베스트</option>
                  <option>인기</option>
                  <option>추천</option>
                  <option>신상품</option>
                </select>
              </label>
            </div>

            <div className="admin-toggle-grid">
              <div className="admin-toggle-card">
                <div className="admin-row-stack">
                  <strong>메인 비주얼 후보</strong>
                  <p>대표 상품으로 메인 썸네일 또는 히어로 배너에 연결</p>
                </div>
                <button className="admin-switch is-on" type="button">
                  <span />
                </button>
              </div>
              <div className="admin-toggle-card">
                <div className="admin-row-stack">
                  <strong>베스트상품 노출</strong>
                  <p>메인 베스트상품 섹션 및 베스트 페이지에 노출</p>
                </div>
                <button className="admin-switch is-on" type="button">
                  <span />
                </button>
              </div>
              <div className="admin-toggle-card">
                <div className="admin-row-stack">
                  <strong>추천상품 노출</strong>
                  <p>추천상품 섹션 또는 기획전과 연동</p>
                </div>
                <button className="admin-switch" type="button">
                  <span />
                </button>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="썸네일 / 상세 이미지">
            <div className="admin-upload-grid">
              <div className="admin-upload-slot featured">
                <span className="admin-upload-label">대표 썸네일</span>
                <strong>1:1 썸네일 이미지 업로드</strong>
                <p>상품 리스트와 상세 첫 화면에 사용하는 기본 이미지</p>
              </div>
              <div className="admin-upload-slot">
                <span className="admin-upload-label">상세 대표컷</span>
                <strong>확대 팝업용 추가컷</strong>
                <p>썸네일 클릭 시 보여줄 제품 클로즈업 이미지</p>
              </div>
              <div className="admin-upload-slot">
                <span className="admin-upload-label">상세 섹션 01</span>
                <strong>루틴 소개 이미지</strong>
                <p>상품 상세 본문 첫 블록에 사용하는 세로형 이미지</p>
              </div>
              <div className="admin-upload-slot">
                <span className="admin-upload-label">상세 섹션 02</span>
                <strong>보조 상세 이미지</strong>
                <p>섭취 가이드 또는 세트 제안용 이미지</p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="상세 본문 구성">
            <div className="admin-stack">
              {detailBlocks.map((block, index) => (
                <div className="admin-detail-block" key={block.title}>
                  <div className="admin-detail-block-head">
                    <span className="admin-step-index">{index + 1}</span>
                    <div className="admin-row-stack">
                      <strong>{block.title}</strong>
                      <p>{block.description}</p>
                    </div>
                  </div>
                  <div className="admin-field-grid two">
                    <label className="admin-field span-two">
                      <span>블록 제목</span>
                      <input className="admin-input" defaultValue={block.title} type="text" />
                    </label>
                    <label className="admin-field span-two">
                      <span>본문 설명</span>
                      <textarea
                        className="admin-textarea"
                        defaultValue={`${block.title}에서 보여줄 설명 문구를 입력합니다.`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="등록 상태">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>작성 상태</span>
                <AdminBadge tone="gold">임시 저장</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>검수 상태</span>
                <AdminBadge tone="cyan">이미지 확인 필요</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>공개 상태</span>
                <AdminBadge tone="blue">노출 전</AdminBadge>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="등록 체크리스트">
            <div className="admin-step-list compact">
              {productUploadFlow.map((step, index) => (
                <div className="admin-step-row" key={step.title}>
                  <span className="admin-step-index">{index + 1}</span>
                  <div className="admin-row-stack">
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="이미지 가이드">
            <ul className="admin-bullet-list">
              {uploadMediaGuide.map((guide) => (
                <li key={guide}>{guide}</li>
              ))}
            </ul>
          </AdminPanel>

          <AdminPanel title="노출 위치">
            <div className="admin-slot-grid compact">
              {productExposureSlots.map((slot) => (
                <div className="admin-slot-card" key={slot.title}>
                  <span>{slot.title}</span>
                  <strong>{slot.value}</strong>
                </div>
              ))}
            </div>
          </AdminPanel>

          <div className="admin-action-stack">
            <button className="admin-button" type="button">
              등록 요청 저장
            </button>
            <button className="admin-button secondary" type="button">
              미리보기 생성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
