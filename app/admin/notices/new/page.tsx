import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";

const noticeBlocks = [
  {
    title: "본문",
    description: "공지 핵심 내용을 먼저 입력합니다.",
  },
  {
    title: "체크리스트",
    description: "회원이 바로 확인해야 할 항목을 정리합니다.",
  },
] as const;

export default function AdminNoticeNewPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="공지 작성"
        actions={
          <button className="admin-button" type="button">
            임시 저장
          </button>
        }
      />

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <AdminPanel title="기본 정보">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>분류</span>
                <select className="admin-select">
                  <option>운영정책</option>
                  <option>서비스안내</option>
                  <option>상품운영</option>
                  <option>구조확장</option>
                </select>
              </label>
              <label className="admin-field">
                <span>공개 범위</span>
                <select className="admin-select">
                  <option>전체 공개</option>
                  <option>회원 공개</option>
                </select>
              </label>
              <label className="admin-field span-two">
                <span>제목</span>
                <input className="admin-input" placeholder="공지 제목을 입력하세요" type="text" />
              </label>
              <label className="admin-field span-two">
                <span>요약</span>
                <textarea
                  className="admin-textarea"
                  placeholder="공지 목록에서 먼저 보여줄 요약 문구를 입력하세요"
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="상세 내용">
            <div className="admin-section-card-list">
              {noticeBlocks.map((block, index) => (
                <div className="admin-section-card" key={block.title}>
                  <div className="admin-detail-block-head">
                    <span className="admin-step-index">{index + 1}</span>
                    <div className="admin-row-stack">
                      <strong>{block.title}</strong>
                      <p>{block.description}</p>
                    </div>
                  </div>
                  <label className="admin-field">
                    <span>{block.title} 입력</span>
                    <textarea className="admin-textarea" placeholder={`${block.title} 내용을 입력하세요`} />
                  </label>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="게시 상태">
            <div className="admin-status-stack">
              <div className="admin-status-row">
                <span>작성 상태</span>
                <AdminBadge tone="gold">임시 저장</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>노출 상태</span>
                <AdminBadge tone="blue">게시 전</AdminBadge>
              </div>
              <div className="admin-status-row">
                <span>상단 고정</span>
                <AdminBadge tone="cyan">선택 가능</AdminBadge>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="옵션">
            <div className="admin-toggle-grid">
              <div className="admin-toggle-card">
                <div className="admin-row-stack">
                  <strong>상단 고정</strong>
                  <span>목록 상단 노출</span>
                </div>
                <button className="admin-switch" type="button">
                  <span />
                </button>
              </div>
              <div className="admin-toggle-card">
                <div className="admin-row-stack">
                  <strong>즉시 게시</strong>
                  <span>저장 후 바로 공개</span>
                </div>
                <button className="admin-switch is-on" type="button">
                  <span />
                </button>
              </div>
            </div>
          </AdminPanel>

          <div className="admin-action-stack">
            <button className="admin-button" type="button">
              공지 저장
            </button>
            <button className="admin-button secondary" type="button">
              미리보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
