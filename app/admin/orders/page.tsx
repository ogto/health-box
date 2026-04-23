import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { orderCompanySummary, orderMetrics, orderRows } from "../../_lib/admin-data";

export default function AdminOrdersPage() {
  return (
    <div className="admin-page">
      <AdminHeader title="주문관리" />

      <AdminMetrics items={orderMetrics} />

      <div className="admin-grid-side">
        <AdminPanel title="주문 리스트">
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
          <AdminPanel title="회원사 요약">
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

          <AdminPanel title="처리 필요">
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>딜러 회원사 출고 우선</strong>
                  <p>배송 준비 상태의 딜러 주문부터 송장 입력</p>
                </div>
                <AdminBadge tone="blue">출고 우선</AdminBadge>
              </div>
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>반품 주문 확인</strong>
                  <p>정산 반영 전 검수 메모와 차감 여부 확인</p>
                </div>
                <AdminBadge tone="rose">차감 예정</AdminBadge>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
