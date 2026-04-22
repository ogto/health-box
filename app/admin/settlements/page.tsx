import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { settlementCompanySummary, settlementMetrics, settlementRows } from "../../_lib/admin-data";

export default function AdminSettlementsPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="정산관리"
        description="회원사별 정산 흐름을 기준으로, 초기 고정비율 정산부터 이후 상품별 수익률 세분화까지 염두에 둔 화면입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/admin/orders">
              주문 영향 보기
            </Link>
            <Link className="admin-button" href="/admin/dealers">
              조직별 정산 보기
            </Link>
          </>
        }
      />

      <AdminMetrics items={settlementMetrics} />

      <div className="admin-grid-side">
        <AdminPanel
          kicker="Settlement Board"
          title="회원사별 정산 현황"
          description="월별 합계가 아니라 회원사 단위로 정산 귀속을 먼저 확인하는 구조입니다."
        >
          <AdminTable
            columns="120px minmax(180px, 1.1fr) minmax(0, 1.15fr) minmax(120px, 0.9fr) 100px"
            headers={["정산월", "회원사", "정산 기준", "예상 정산액", "상태"]}
          >
            {settlementRows.map((row) => (
              <div className="admin-table-row" key={`${row.month}-${row.company}`}>
                <strong>{row.month}</strong>
                <div className="admin-row-stack">
                  <strong>
                    {row.company} · {row.companyType}
                  </strong>
                  <p>{row.policy}</p>
                </div>
                <div className="admin-row-stack">
                  <strong>총 매출 {row.gross}</strong>
                  <span>차감액 {row.deduction}</span>
                </div>
                <strong className="admin-row-price">{row.estimated}</strong>
                <AdminBadge tone={row.tone}>{row.status}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel
            kicker="Member Companies"
            title="회원사 정산 요약"
            description="이번 달 정산 대상 회원사의 상태를 빠르게 봅니다."
          >
            <div className="admin-list">
              {settlementCompanySummary.map((company) => (
                <div className="admin-list-row" key={company.company}>
                  <div className="admin-row-stack">
                    <strong>
                      {company.company} · {company.type}
                    </strong>
                    <p>{company.note}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={company.tone}>정산 대상</AdminBadge>
                    <span>{company.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Phase 1"
            title="회원사 기준 정산 원칙"
            description="MVP 오픈 이후 가장 현실적인 운영 흐름입니다."
          >
            <ul className="admin-bullet-list">
              <li>회원사별 월 매출 기준 일괄 고정비율(예: 25%)로 먼저 시뮬레이션합니다.</li>
              <li>반품/취소는 회원사별 차감 항목으로 역계상해 별도 표시합니다.</li>
              <li>정산 자동화보다 회원사별 확인 가능한 보드를 먼저 안정화합니다.</li>
            </ul>
          </AdminPanel>

          <AdminPanel
            kicker="Phase 2"
            title="고도화 단계"
            description="회원사 구조를 전제로 추후 추가될 가능성이 높은 확장 범위입니다."
          >
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>상품별 수익률</strong>
                  <p>카테고리/상품 단위 수익률 반영</p>
                </div>
                <AdminBadge tone="cyan">후속 개발</AdminBadge>
              </div>
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>회원사별 정산</strong>
                  <p>회원사 유형과 조직 구조에 연결된 정산 기준 분리</p>
                </div>
                <AdminBadge tone="gold">설계 필요</AdminBadge>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
