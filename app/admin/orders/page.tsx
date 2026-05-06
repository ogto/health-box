import Link from "next/link";

import { bulkPrepareShipmentsAction } from "../../_actions/health-box-admin";
import { AdminComingSoonButton } from "../../_components/admin/admin-coming-soon-button";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminOrderBulkActions } from "../../_components/admin/admin-order-bulk-actions";
import { AdminOrderExcelDownloadButton } from "../../_components/admin/admin-order-excel-download-button";
import { AdminTableScrollMirror } from "../../_components/admin/admin-table-scroll-mirror";
import { AdminBadge, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminDealerMallOrders,
  fetchAdminDealerMalls,
  fetchAdminOrders,
  hasHealthBoxApi,
} from "../../_lib/health-box-api";
import { mapDealerRows, mapOrderRows } from "../../_lib/health-box-presenters";

type OrdersSearchParams = {
  dateFrom?: string;
  dateTo?: string;
  dealerMallId?: string;
  status?: string;
};

const bulkPrepareFormId = "admin-order-bulk-prepare-form";
const orderTableScrollerId = "admin-order-table-scroller";

function buildOrdersHref({
  dateFrom,
  dateTo,
  dealerMallId,
  status,
}: {
  dateFrom?: string;
  dateTo?: string;
  dealerMallId?: number | null;
  status?: string;
} = {}) {
  const params = new URLSearchParams();

  if (dealerMallId) {
    params.set("dealerMallId", String(dealerMallId));
  }

  if (dateFrom) {
    params.set("dateFrom", dateFrom);
  }

  if (dateTo) {
    params.set("dateTo", dateTo);
  }

  if (status) {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

function canBulkPrepareShipment(order: ReturnType<typeof mapOrderRows>[number]) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  return Boolean(order.shipmentId) && (!shipmentStatus || /PENDING|ORDERED|주문\s*접수/.test(shipmentStatus));
}

function orderDateText(value: string) {
  return value && value !== "-" ? value : "일시 없음";
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateBefore(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateInput(date);
}

function dateMonthsBefore(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return formatDateInput(date);
}

function rowDateKey(value: string) {
  const normalized = value.replace(/\./g, "-").replace(/\//g, "-");
  const match = normalized.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) {
    return "";
  }

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function matchesStatus(row: ReturnType<typeof mapOrderRows>[number], status: string) {
  if (!status) {
    return true;
  }

  const text = `${row.orderStatus} ${row.shipmentStatus} ${row.status}`.toUpperCase();
  if (status === "CANCELED") {
    return /CANCELED|취소/.test(text);
  }

  return text.includes(status);
}

function AdminOptionDisplay({
  option,
  optionPairs,
}: {
  option: string;
  optionPairs?: Array<{ name: string; value: string }>;
}) {
  if (!optionPairs?.length) {
    return <span className="admin-option-empty">없음</span>;
  }

  return <span className="admin-option-inline-text">{optionPairs.map((item) => `${item.name}: ${item.value}`).join(", ") || option}</span>;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const params = await searchParams;
  const selectedDealerId = Number(params.dealerMallId) || null;
  const today = formatDateInput(new Date());
  const dateFrom = params.dateFrom || dateMonthsBefore(3);
  const dateTo = params.dateTo || today;
  const selectedStatus = params.status || "";
  const [dealers, allOrders] = hasHealthBoxApi()
    ? await Promise.all([fetchAdminDealerMalls(), fetchAdminOrders()])
    : [null, null];

  const dealerRows = mapDealerRows(dealers);
  const selectedDealer = dealerRows.find((dealer) => dealer.id === selectedDealerId) || null;
  const orders =
    hasHealthBoxApi() && selectedDealer?.id
      ? await fetchAdminDealerMallOrders(selectedDealer.id)
      : allOrders;

  const orderRows = mapOrderRows(orders);
  const filteredOrderRows = orderRows.filter((order) => {
    const key = rowDateKey(order.placedAt);
    const inDateRange = !key || ((!dateFrom || key >= dateFrom) && (!dateTo || key <= dateTo));
    return inDateRange && matchesStatus(order, selectedStatus);
  });
  const exportRows = filteredOrderRows.map((order) => {
    const firstItem = order.itemDetails[0];
    const extraCount = Math.max(0, order.itemDetails.length - 1);
    const totalQuantity = order.itemDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    return {
      amount: order.amount,
      claimStatus: /취소|CANCELED/i.test(`${order.orderStatus} ${order.shipmentStatus} ${order.status}`) ? "취소" : "-",
      company: order.company,
      deliveryType: "일반배송",
      option: firstItem?.option || "없음",
      orderAt: orderDateText(order.placedAt),
      orderNo: order.number,
      productName: firstItem ? `${firstItem.productName}${extraCount ? ` 외 ${extraCount}개` : ""}` : order.items,
      quantity: `${totalQuantity || firstItem?.quantity || 0}개`,
      status: order.status,
    };
  });

  return (
    <div className="admin-page">
      <AdminHeader title="주문관리" />

      <AdminPanel title="조회 조건">
        <div className="admin-order-search-panel">
          <div className="admin-filter-chip-set">
            <Link
              className={`admin-button secondary small${selectedDealer ? "" : " is-active"}`}
              href={buildOrdersHref({ dateFrom, dateTo, status: selectedStatus })}
            >
              전체 주문
            </Link>
            {dealerRows.map((dealer) => (
              <Link
                className={`admin-button secondary small${selectedDealer?.id === dealer.id ? " is-active" : ""}`}
                href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: dealer.id, status: selectedStatus })}
                key={dealer.id}
              >
                {dealer.name}
              </Link>
            ))}
          </div>
          <form action="/admin/orders" className="admin-order-filter-form">
            {selectedDealer?.id ? <input name="dealerMallId" type="hidden" value={String(selectedDealer.id)} /> : null}
            <label className="admin-order-filter-field">
              <span>조회기간</span>
              <select className="admin-select" name="dateType" defaultValue="paymentDate">
                <option value="paymentDate">결제일</option>
                <option value="orderDate">주문일</option>
              </select>
            </label>
            <div className="admin-order-period-shortcuts">
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: today, dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus })}>
                오늘
              </Link>
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: dateBefore(7), dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus })}>
                1주일
              </Link>
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: dateMonthsBefore(1), dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus })}>
                1개월
              </Link>
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: dateMonthsBefore(3), dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus })}>
                3개월
              </Link>
            </div>
            <div className="admin-order-date-range">
              <input className="admin-input" defaultValue={dateFrom} name="dateFrom" type="date" />
              <span>~</span>
              <input className="admin-input" defaultValue={dateTo} name="dateTo" type="date" />
            </div>
            <label className="admin-order-filter-field">
              <span>상세조건</span>
              <select className="admin-select" defaultValue={selectedStatus} name="status">
                <option value="">전체</option>
                <option value="PENDING">주문 접수</option>
                <option value="PREPARING">상품 준비중</option>
                <option value="SHIPPED">배송중</option>
                <option value="DELIVERED">배송완료</option>
                <option value="CANCELED">취소완료</option>
              </select>
            </label>
            <button className="admin-button admin-order-search-button" type="submit">
              검색
            </button>
          </form>
        </div>
      </AdminPanel>

      <AdminPanel
        action={
          <div className="admin-order-list-actions">
            <div className="admin-order-list-actions-left">
              <AdminOrderExcelDownloadButton rows={exportRows} />
            </div>
            <AdminOrderBulkActions formId={bulkPrepareFormId} />
          </div>
        }
        title={`목록 (총 ${filteredOrderRows.length.toLocaleString("ko-KR")}건)`}
      >
        <form action={bulkPrepareShipmentsAction} id={bulkPrepareFormId}>
          <input name="redirectTo" type="hidden" value={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id, status: selectedStatus })} />
          <AdminTable
            alignments={["center", "left", "left", "center", "center", "left", "left", "left", "center", "right", "center"]}
            className="admin-order-thin-table"
            columns="64px 170px 180px 130px 130px 170px 280px 180px 90px 130px 120px"
            emptyDescription={
              selectedDealer
                ? "선택한 딜러몰의 주문 데이터가 없습니다."
                : "조회 가능한 주문 데이터가 없습니다."
            }
            headers={["선택", "주문번호", "주문일시", "주문상태", "배송속성", "회원사", "상품명", "옵션정보", "수량", "결제금액", "클레임상태"]}
            isEmpty={!filteredOrderRows.length}
            scrollerId={orderTableScrollerId}
          >
            {filteredOrderRows.map((order) => {
              const selectable = canBulkPrepareShipment(order);
              const firstItem = order.itemDetails[0];
              const extraCount = Math.max(0, order.itemDetails.length - 1);
              const totalQuantity = order.itemDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

              return (
                <div className="admin-table-row admin-order-table-row" key={order.number}>
                  <label className="admin-order-check-cell" title={selectable ? "상품 준비 처리 대상 선택" : "상품 준비 처리 대상이 아닙니다."}>
                    <input
                      aria-label={`${order.number} 선택`}
                      disabled={!selectable}
                      name="shipmentId"
                      type="checkbox"
                      value={String(order.shipmentId || "")}
                    />
                  </label>
                  <div className="admin-row-stack">
                    <Link className="admin-order-number-link" href={`/admin/orders/${order.id ?? order.number}`}>
                      {order.number}
                    </Link>
                  </div>
                  <div className="admin-row-stack">
                    <span>{orderDateText(order.placedAt)}</span>
                  </div>
                  <div className="admin-order-status-cell">
                    <AdminBadge tone={order.tone}>{order.status}</AdminBadge>
                    {order.pendingAgeLabel ? (
                      <AdminBadge className="admin-order-age-badge" tone={order.pendingAgeTone}>
                        {order.pendingAgeLabel}
                      </AdminBadge>
                    ) : null}
                  </div>
                  <div className="admin-row-stack">
                    <span>일반배송</span>
                  </div>
                  <div className="admin-row-stack">
                    <strong>{order.company}</strong>
                  </div>
                  <div className="admin-row-stack">
                    <strong>{firstItem ? `${firstItem.productName}${extraCount ? ` 외 ${extraCount}개` : ""}` : order.items}</strong>
                  </div>
                  <div className="admin-row-stack">
                    <AdminOptionDisplay option={firstItem?.option || "없음"} optionPairs={firstItem?.optionPairs} />
                  </div>
                  <div className="admin-row-stack admin-order-quantity-cell">
                    <span>{totalQuantity || firstItem?.quantity || 0}개</span>
                  </div>
                  <div className="admin-row-stack admin-order-price-cell">
                    <strong className="admin-row-price">{order.amount}</strong>
                  </div>
                  <div className="admin-row-stack">
                    <span>{/취소|CANCELED/i.test(`${order.orderStatus} ${order.shipmentStatus} ${order.status}`) ? "취소" : "-"}</span>
                  </div>
                </div>
              );
            })}
          </AdminTable>
          <AdminTableScrollMirror targetId={orderTableScrollerId} />
        </form>
      </AdminPanel>

      <section className="admin-order-management-guide" aria-label="주문 처리 안내">
        <div className="admin-order-management-row">
          <strong>주문관리</strong>
          <AdminComingSoonButton>발주 확인</AdminComingSoonButton>
          <AdminComingSoonButton>발송 처리</AdminComingSoonButton>
          <AdminComingSoonButton>발송 지연 처리</AdminComingSoonButton>
          <AdminComingSoonButton>배송지 정보 수정</AdminComingSoonButton>
          <AdminComingSoonButton>미결제 확인</AdminComingSoonButton>
        </div>
        <div className="admin-order-management-row">
          <strong>취소관리</strong>
          <AdminComingSoonButton>판매자 직접취소 처리</AdminComingSoonButton>
          <AdminComingSoonButton>취소 승인처리</AdminComingSoonButton>
          <AdminComingSoonButton>구매확정 후 취소처리</AdminComingSoonButton>
        </div>
        <div className="admin-order-management-row">
          <strong>반품교환관리</strong>
          <AdminComingSoonButton>반품 및 교환접수</AdminComingSoonButton>
          <AdminComingSoonButton>반품접수 후 처리</AdminComingSoonButton>
          <AdminComingSoonButton>교환접수 후 처리</AdminComingSoonButton>
        </div>
      </section>
    </div>
  );
}
