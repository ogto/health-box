import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { orderCompanySummary, orderMetrics, orderRows } from "../../_lib/admin-data";

export default function AdminOrdersPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="주문관리"
        description="결제부터 출고, 반품 검토까지를 회원사 단위로 묶어 보는 주문 운영 화면입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/cart">
              장바구니 보기
            </Link>
            <Link className="admin-button" href="/admin/settlements">
              정산 영향 확인
            </Link>
          </>
        }
      />

      <AdminMetrics items={orderMetrics} />

      <div className="admin-grid-side">
        <AdminPanel
          kicker="Order Queue"
          title="주문 리스트"
          description="주문번호, 회원사, 실제 주문자, 주문상품을 함께 확인할 수 있도록 회원사 기준으로 정리했습니다."
        >
          <AdminTable
            columns="minmax(130px, 0.85fr) minmax(190px, 1.05fr) minmax(0, 1.3fr) minmax(115px, 0.75fr) 100px"
            headers={["주문번호", "회원사 / 주문자", "주문상품", "결제금액", "상태"]}
          >
            {orderRows.map((order) => (
              <div className="admin-table-row" key={order.number}>
                <div className="admin-row-stack">
                  <strong>{order.number}</strong>
                  <span>{order.placedAt}</span>
                </div>
                <div className="admin-row-stack">
                  <strong>
                    {order.company} · {order.companyType}
                  </strong>
                  <p>
                    {order.buyer} · {order.buyerType}
                  </p>
                </div>
                <div className="admin-row-stack">
                  <strong>{order.items}</strong>
                  <span>정산 귀속 회원사: {order.company}</span>
                </div>
                <strong className="admin-row-price">{order.amount}</strong>
                <AdminBadge tone={order.tone}>{order.status}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel
            kicker="Member Companies"
            title="회원사별 주문 현황"
            description="현재 주문이 발생한 회원사를 기준으로 묶어 봅니다."
          >
            <div className="admin-list">
              {orderCompanySummary.map((company) => (
                <div className="admin-list-row" key={company.company}>
                  <div className="admin-row-stack">
                    <strong>
                      {company.company} · {company.type}
                    </strong>
                    <p>{company.note}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={company.tone}>{company.orders}</AdminBadge>
                    <span>{company.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Shipping Notes"
            title="회원사 출고 우선순위"
            description="회원사 단위로 먼저 챙겨야 할 출고 흐름입니다."
          >
            <ul className="admin-bullet-list">
              <li>배송 준비 상태 중 딜러 회원사 주문을 먼저 송장 입력합니다.</li>
              <li>회원사 관리자 주문은 직영 일반회원 주문보다 묶음 포장을 우선합니다.</li>
              <li>정기배송 상품은 유산균/비타민 카테고리부터 묶음 포장합니다.</li>
              <li>반품 요청 건은 회원사 정산 반영 전 검수 메모를 남깁니다.</li>
            </ul>
          </AdminPanel>

          <AdminPanel
            kicker="Return Impact"
            title="회원사 정산 영향 메모"
            description="반품/취소가 어떤 회원사 정산에 반영되는지 따로 확인합니다."
          >
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>HB260421-0988 · 건강창고 직영 회원</strong>
                  <p>프로틴 벌크 뉴트리션 반품 요청 접수</p>
                </div>
                <AdminBadge tone="rose">차감 예정</AdminBadge>
              </div>
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>HB260421-0979 · 바이오파트너</strong>
                  <p>송장 입력 대기, 회원사 출고 마감 전 처리 필요</p>
                </div>
                <AdminBadge tone="gold">확인 필요</AdminBadge>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
