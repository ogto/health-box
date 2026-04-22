import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { approvalQueue, memberMetrics, memberRows } from "../../_lib/admin-data";

export default function AdminMembersPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="회원관리"
        description="회원 승인, 딜러 관리자 권한, 구매 이력 확인 흐름을 관리하는 화면입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/mypage">
              마이페이지 보기
            </Link>
            <Link className="admin-button" href="/admin/dealers">
              딜러 권한 보기
            </Link>
          </>
        }
      />

      <AdminMetrics items={memberMetrics} />

      <div className="admin-grid-side">
        <AdminPanel
          kicker="Members"
          title="회원 / 딜러 목록"
          description="구매 금액과 현재 권한 상태를 함께 확인합니다."
        >
          <AdminTable
            columns="minmax(0, 1.5fr) minmax(120px, 0.8fr) minmax(110px, 0.8fr) 110px"
            headers={["회원명", "구분", "누적 구매", "상태"]}
          >
            {memberRows.map((member) => (
              <div className="admin-table-row" key={`${member.name}-${member.joinedAt}`}>
                <div className="admin-row-stack">
                  <strong>{member.name}</strong>
                  <p>가입일 {member.joinedAt}</p>
                </div>
                <span className="admin-row-muted">{member.segment}</span>
                <strong className="admin-row-price">{member.purchases}</strong>
                <AdminBadge tone={member.tone}>{member.status}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel
            kicker="Approval Queue"
            title="승인 검토"
            description="신규 회원 및 딜러 관리자 신청 검토 항목입니다."
          >
            <div className="admin-list">
              {approvalQueue.map((item) => (
                <div className="admin-list-row" key={`${item.name}-${item.submittedAt}`}>
                  <div className="admin-row-stack">
                    <strong>{item.name}</strong>
                    <p>{item.note}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={item.type === "딜러 신청" ? "gold" : "cyan"}>
                      {item.type}
                    </AdminBadge>
                    <span>{item.submittedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Policy"
            title="권한 운영 기준"
            description="현재 단계에서 필요한 관리자 권한 기준입니다."
          >
            <ul className="admin-bullet-list">
              <li>일반 회원은 가격 확인과 구매 기능만 허용합니다.</li>
              <li>딜러 관리자는 자신이 속한 몰의 회원/주문 조회만 우선 허용합니다.</li>
              <li>세분 권한은 추후 DB 구조 반영 후 확장하는 전제로 유지합니다.</li>
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
