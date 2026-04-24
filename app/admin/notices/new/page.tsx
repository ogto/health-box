import { saveNoticeAction } from "../../../_actions/health-box-admin";
import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../../_components/admin/admin-submit-button";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import { hasHealthBoxApi } from "../../../_lib/health-box-api";

export default function AdminNoticeNewPage() {
  return (
    <div className="admin-page">
      <AdminHeader title="공지 작성" />

      <form action={saveNoticeAction} className="admin-form-layout">
        <input name="redirectTo" type="hidden" value="/admin/notices" />
        <input name="category" type="hidden" value="운영안내" />
        <input name="visibility" type="hidden" value="전체 공개" />

        <div className="admin-form-main">
          <AdminPanel title="공지 내용">
            <div className="admin-field-grid">
              <label className="admin-field">
                <span>제목</span>
                <input className="admin-input" name="title" placeholder="공지 제목을 입력하세요" type="text" />
              </label>
              <label className="admin-field">
                <span>내용</span>
                <textarea
                  className="admin-textarea"
                  name="body"
                  placeholder={"게시글 쓰듯이 바로 입력하세요.\n줄바꿈한 내용은 상세 화면에서도 그대로 문단으로 보입니다."}
                  rows={14}
                />
              </label>
            </div>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="게시 상태">
            <div className="admin-status-stack">
              <label className="admin-field">
                <span>상태</span>
                <select className="admin-select" defaultValue="게시중" name="status">
                  <option>게시중</option>
                  <option>상단 고정</option>
                  <option>임시 저장</option>
                </select>
              </label>
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
                공지 저장
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
