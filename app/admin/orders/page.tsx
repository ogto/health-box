import Link from "next/link";

import { cancelOrderAction, partialCancelOrderAction, updateShipmentStatusAction } from "../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "../../_components/admin/admin-confirm-submit-button";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../_components/admin/admin-submit-button";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminDealerMallOrders,
  fetchAdminDealerMalls,
  fetchAdminOrder,
  fetchAdminOrders,
  hasHealthBoxApi,
  idValue,
  numberValue,
  stringValue,
} from "../../_lib/health-box-api";
import { buildOrderMetrics, mapDealerRows, mapOrderRows } from "../../_lib/health-box-presenters";

type OrdersSearchParams = {
  dealerMallId?: string;
  orderId?: string;
};

function buildOrderHref(orderId: string | number | null | undefined, dealerMallId?: number | null) {
  const params = new URLSearchParams();

  if (dealerMallId) {
    params.set("dealerMallId", String(dealerMallId));
  }

  if (orderId !== null && orderId !== undefined && orderId !== "") {
    params.set("orderId", String(orderId));
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

function buildCompanySummary(rows: ReturnType<typeof mapOrderRows>) {
  const grouped = new Map<
    string,
    {
      company: string;
      type: string;
      amount: number;
      orders: number;
    }
  >();

  for (const row of rows) {
    const current = grouped.get(row.company) || {
      company: row.company,
      type: row.companyType,
      amount: 0,
      orders: 0,
    };

    current.amount += Number(row.amount.replace(/[^0-9]/g, "")) || 0;
    current.orders += 1;
    grouped.set(row.company, current);
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 4)
    .map((item) => ({
      company: item.company,
      type: item.type,
      orders: `${item.orders}건`,
      amount: `${item.amount.toLocaleString("ko-KR")}원`,
      note: `${item.type} 주문 기준 집계`,
      tone: "blue" as const,
    }));
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const selectedDealerId = Number(params.dealerMallId) || null;
  const [dealers, allOrders] = hasHealthBoxApi()
    ? await Promise.all([fetchAdminDealerMalls(), fetchAdminOrders()])
    : [null, null];

  const dealerRows = mapDealerRows(dealers);
  const selectedDealer = dealerRows.find((dealer) => dealer.id === selectedDealerId) || null;
  const orders =
    hasHealthBoxApi() && selectedDealer?.id
      ? await fetchAdminDealerMallOrders(selectedDealer.id)
      : allOrders;

  const metrics = buildOrderMetrics(orders);
  const orderRows = mapOrderRows(orders);
  const companyRows = buildCompanySummary(orderRows);
  const selectedOrder =
    orderRows.find(
      (order) =>
        String(order.id ?? "") === params.orderId || order.number === params.orderId,
    ) ||
    orderRows.find((order) => order.shipmentId) ||
    orderRows[0] ||
    null;
  const selectedOrderDetail =
    hasHealthBoxApi() && selectedOrder?.id
      ? await fetchAdminOrder(selectedOrder.id)
      : null;
  const selectedOrderItems = Array.isArray(selectedOrderDetail?.items)
    ? (selectedOrderDetail.items as Array<Record<string, unknown>>)
    : [];

  return (
    <div className="admin-page">
      <AdminHeader title="주문관리" />

      <AdminMetrics items={metrics} />

      <AdminPanel title="조회 범위">
        <div className="admin-filter-chip-set">
          <Link
            className={`admin-button secondary small${selectedDealer ? "" : " is-active"}`}
            href="/admin/orders"
          >
            전체 주문
          </Link>
          {dealerRows.map((dealer) => (
            <Link
              className={`admin-button secondary small${selectedDealer?.id === dealer.id ? " is-active" : ""}`}
              href={buildOrderHref(null, dealer.id)}
              key={dealer.id}
            >
              {dealer.name}
            </Link>
          ))}
        </div>
      </AdminPanel>

      <div className="admin-grid-side">
        <AdminPanel title="주문 리스트">
          <AdminTable
            columns="minmax(130px, 0.8fr) minmax(190px, 1.05fr) minmax(0, 1.2fr) minmax(115px, 0.72fr) 96px 82px"
            emptyDescription={
              selectedDealer
                ? "선택한 딜러몰의 주문 데이터가 없습니다."
                : "조회 가능한 주문 데이터가 없습니다."
            }
            headers={["주문번호", "회원사 / 주문자", "주문상품", "결제금액", "상태", "관리"]}
            isEmpty={!orderRows.length}
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
                <Link
                  className="admin-button secondary small"
                  href={buildOrderHref(order.id ?? order.number, selectedDealer?.id)}
                >
                  보기
                </Link>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel title="주문 상세 / 취소">
            {selectedOrder ? (
              <div className="admin-status-stack">
                <div className="admin-list-row">
                  <div className="admin-row-stack">
                    <strong>{selectedOrder.number}</strong>
                    <p>
                      {stringValue(selectedOrderDetail, "receiverName") || selectedOrder.buyer} ·{" "}
                      {stringValue(selectedOrderDetail, "receiverPhone", "ordererPhone") || "-"}
                    </p>
                    <span>
                      {[stringValue(selectedOrderDetail, "zipCode"), stringValue(selectedOrderDetail, "baseAddress"), stringValue(selectedOrderDetail, "detailAddress")]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </div>
                  <AdminBadge tone={selectedOrder.tone}>{selectedOrder.status}</AdminBadge>
                </div>
                <form action={cancelOrderAction} id="admin-order-cancel-form">
                  <input name="orderId" type="hidden" value={String(selectedOrder.id ?? "")} />
                  <input name="redirectTo" type="hidden" value={buildOrderHref(selectedOrder.id ?? selectedOrder.number, selectedDealer?.id)} />
                </form>
                {selectedOrder.id ? (
                  <AdminConfirmSubmitButton
                    className="admin-button danger"
                    confirmMessage="이 주문을 전체 취소할까요? 남은 수량 기준으로 SKU 재고가 복구됩니다."
                    confirmTitle="주문 전체 취소"
                    form="admin-order-cancel-form"
                    pendingLabel="취소중..."
                    tone="danger"
                  >
                    주문 전체 취소
                  </AdminConfirmSubmitButton>
                ) : null}
              </div>
            ) : (
              <p className="admin-row-muted">조회된 주문이 없습니다.</p>
            )}
          </AdminPanel>
          <AdminPanel title="회원사 요약">
            <div className="admin-list">
              {companyRows.map((company) => (
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
              {!companyRows.length ? <p className="admin-row-muted">회원사별 주문 집계가 없습니다.</p> : null}
            </div>
          </AdminPanel>

          <AdminPanel title="배송 상태 변경">
            {selectedOrder ? (
              selectedOrder.shipmentId && hasHealthBoxApi() ? (
                <form action={updateShipmentStatusAction} className="admin-status-stack">
                  <input name="shipmentId" type="hidden" value={String(selectedOrder.shipmentId)} />
                  <input
                    name="redirectTo"
                    type="hidden"
                    value={buildOrderHref(selectedOrder.id ?? selectedOrder.number, selectedDealer?.id)}
                  />
                  <div className="admin-list-row">
                    <div className="admin-row-stack">
                      <strong>{selectedOrder.number}</strong>
                      <p>
                        {selectedOrder.company} · {selectedOrder.buyer}
                      </p>
                    </div>
                    <AdminBadge tone={selectedOrder.tone}>{selectedOrder.status}</AdminBadge>
                  </div>
                  <label className="admin-field">
                    <span>배송 상태</span>
                    <select className="admin-select" defaultValue={selectedOrder.status} name="shipmentStatus">
                      <option value="결제 완료">결제 완료</option>
                      <option value="배송 준비">배송 준비</option>
                      <option value="송장 입력 완료">송장 입력 완료</option>
                      <option value="출고 완료">출고 완료</option>
                      <option value="배송 완료">배송 완료</option>
                      <option value="취소">취소</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>택배사</span>
                    <input className="admin-input" name="courierCompany" placeholder="예: CJ대한통운" type="text" />
                  </label>
                  <label className="admin-field">
                    <span>송장 번호</span>
                    <input className="admin-input" name="trackingNo" placeholder="송장 번호를 입력하세요" type="text" />
                  </label>
                  <label className="admin-field">
                    <span>출고일시</span>
                    <input className="admin-input" name="shippedAt" type="datetime-local" />
                  </label>
                  <label className="admin-field">
                    <span>배송완료일시</span>
                    <input className="admin-input" name="deliveredAt" type="datetime-local" />
                  </label>
                  <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
                    배송 상태 저장
                  </AdminSubmitButton>
                </form>
              ) : (
                <div className="admin-row-stack">
                  <strong>{selectedOrder.number}</strong>
                  <p>이 주문은 연결된 배송 레코드가 없어 상태 변경 UI를 노출하지 않았습니다.</p>
                </div>
              )
            ) : (
              <p className="admin-row-muted">조회할 주문이 없습니다.</p>
            )}
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
