import Link from "next/link";

import { bulkPrepareShipmentsAction } from "../../_actions/health-box-admin";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminReadOnlyNotice } from "../../_components/admin/admin-read-only-notice";
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
import { getAdminSession } from "../../_lib/admin-auth";

type OrdersSearchParams = {
  dateFrom?: string;
  dateTo?: string;
  dealerMallId?: string;
  status?: string;
  task?: string;
};

const bulkPrepareFormId = "admin-order-bulk-prepare-form";
const orderTableScrollerId = "admin-order-table-scroller";

function buildOrdersHref({
  dateFrom,
  dateTo,
  dealerMallId,
  status,
  task,
}: {
  dateFrom?: string;
  dateTo?: string;
  dealerMallId?: number | null;
  status?: string;
  task?: string;
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

  if (task) {
    params.set("task", task);
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

const orderTaskLabels: Record<string, string> = {
  prepare: "발주 확인",
  ship: "발송 처리",
  delay: "발송 지연 처리",
  address: "배송지 정보 수정",
  unpaid: "미결제 확인",
  sellerCancel: "판매자 직접취소 처리",
  cancelApproval: "취소 승인처리",
  completedCancel: "구매확정 후 취소처리",
  claimCreate: "반품 및 교환접수",
  returnProcess: "반품접수 후 처리",
  exchangeProcess: "교환접수 후 처리",
};

function matchesTask(row: ReturnType<typeof mapOrderRows>[number], task: string) {
  const orderStatus = String(row.orderStatus || "").toUpperCase();
  const shipmentStatus = String(row.shipmentStatus || "PENDING").toUpperCase();
  const paymentStatus = String(row.paymentStatus || "").toUpperCase();
  const canceled = orderStatus === "CANCELED" || shipmentStatus === "CANCELED" || paymentStatus === "CANCELED";

  switch (task) {
    case "prepare":
      return /PENDING|ORDERED|PARTIALLY_CANCELED/.test(shipmentStatus) && !canceled;
    case "ship":
      return /PREPARING|DELAYED/.test(shipmentStatus) && !canceled;
    case "delay":
      return /PENDING|ORDERED|PARTIALLY_CANCELED|PREPARING|DELAYED/.test(shipmentStatus) && !canceled;
    case "address":
      return !/SHIPPED|DELIVERED/.test(shipmentStatus) && !canceled;
    case "unpaid":
      return /READY|PENDING|WAITING/.test(paymentStatus);
    case "sellerCancel":
      return !canceled;
    case "cancelApproval":
      return row.activeClaimTypes.includes("CANCEL");
    case "completedCancel":
      return shipmentStatus === "DELIVERED" && !canceled;
    case "claimCreate":
      return !canceled;
    case "returnProcess":
      return row.activeClaimTypes.includes("RETURN");
    case "exchangeProcess":
      return row.activeClaimTypes.includes("EXCHANGE");
    default:
      return true;
  }
}

function canBulkPrepareShipment(order: ReturnType<typeof mapOrderRows>[number]) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  return Boolean(order.shipmentId) && (!shipmentStatus || /PENDING|ORDERED|PARTIALLY_CANCELED|주문\s*접수/.test(shipmentStatus));
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

  const text = `${row.orderStatus} ${row.shipmentStatus} ${row.status} ${row.claimStatus}`.toUpperCase();
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

function activeClaimForTask(order: ReturnType<typeof mapOrderRows>[number], task: string) {
  const claimType = task === "cancelApproval" ? "CANCEL" : task === "returnProcess" ? "RETURN" : task === "exchangeProcess" ? "EXCHANGE" : "";
  return claimType ? order.activeClaims.find((claim) => claim.type === claimType) : undefined;
}

function canSelectForTask(order: ReturnType<typeof mapOrderRows>[number], task: string) {
  if (!order.id) return false;
  if (!task || task === "prepare") return canBulkPrepareShipment(order);
  if (task === "unpaid") return false;
  if (task === "ship" || task === "delay") return Boolean(order.shipmentId);
  if (task === "cancelApproval" || task === "returnProcess" || task === "exchangeProcess") {
    return Boolean(activeClaimForTask(order, task)?.id);
  }
  return true;
}

function orderClaimLabel(order: ReturnType<typeof mapOrderRows>[number]) {
  if (order.activeClaimTypes.includes("CANCEL") || /REQUESTED/i.test(order.claimStatus)) return "취소 요청";
  if (order.activeClaimTypes.includes("RETURN")) return "반품 처리중";
  if (order.activeClaimTypes.includes("EXCHANGE")) return "교환 처리중";
  if (/취소|CANCELED/i.test(`${order.orderStatus} ${order.shipmentStatus} ${order.status}`)) return "취소";
  return "-";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<OrdersSearchParams>;
}) {
  const [params, session] = await Promise.all([searchParams, getAdminSession()]);
  const readOnly = session?.scopeType === "DEALER";
  const selectedDealerId = Number(params.dealerMallId) || null;
  const today = formatDateInput(new Date());
  const dateFrom = params.dateFrom || dateMonthsBefore(3);
  const dateTo = params.dateTo || today;
  const selectedStatus = params.status || "";
  const selectedTask = params.task && orderTaskLabels[params.task] ? params.task : "";
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
    return inDateRange && matchesStatus(order, selectedStatus) && matchesTask(order, selectedTask);
  });
  const exportRows = filteredOrderRows.map((order) => {
    const firstItem = order.itemDetails[0];
    const extraCount = Math.max(0, order.itemDetails.length - 1);
    const totalQuantity = order.itemDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    return {
      amount: order.amount,
      claimStatus: orderClaimLabel(order),
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
  const bulkRedirectTo = buildOrdersHref({
    dateFrom,
    dateTo,
    dealerMallId: selectedDealer?.id,
    status: selectedStatus,
    task: selectedTask,
  });
  const bulkRows = filteredOrderRows
    .filter((order) => order.id)
    .map((order) => {
      const activeClaim = activeClaimForTask(order, selectedTask);
      return {
        activeClaim: activeClaim?.id
          ? { id: activeClaim.id, status: activeClaim.status, type: activeClaim.type }
          : undefined,
        baseAddress: order.baseAddress,
        detailAddress: order.detailAddress,
        orderId: order.id as number,
        orderNo: order.number,
        receiverName: order.receiverName,
        receiverPhone: order.receiverPhone,
        shipmentId: order.shipmentId,
        zipCode: order.zipCode,
      };
    });

  return (
    <div className="admin-page">
      <AdminHeader title={readOnly ? "주문조회" : "주문관리"} />

      {readOnly ? <AdminReadOnlyNotice scopeName={session?.scopeName} /> : null}

      <AdminPanel title="조회 조건">
        <div className="admin-order-search-panel">
          <div className="admin-filter-chip-set">
            <Link
              className={`admin-button secondary small${selectedDealer ? "" : " is-active"}`}
              href={buildOrdersHref({ dateFrom, dateTo, status: selectedStatus, task: selectedTask })}
            >
              전체 주문
            </Link>
            {dealerRows.map((dealer) => (
              <Link
                className={`admin-button secondary small${selectedDealer?.id === dealer.id ? " is-active" : ""}`}
                href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: dealer.id, status: selectedStatus, task: selectedTask })}
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
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: today, dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus, task: selectedTask })}>
                오늘
              </Link>
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: dateBefore(7), dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus, task: selectedTask })}>
                1주일
              </Link>
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: dateMonthsBefore(1), dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus, task: selectedTask })}>
                1개월
              </Link>
              <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom: dateMonthsBefore(3), dateTo: today, dealerMallId: selectedDealer?.id, status: selectedStatus, task: selectedTask })}>
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
                <option value="DELAYED">발송 지연</option>
                <option value="SHIPPED">배송중</option>
                <option value="DELIVERED">배송완료</option>
                <option value="CANCELED">취소완료</option>
              </select>
            </label>
            {selectedTask ? <input name="task" type="hidden" value={selectedTask} /> : null}
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
              {selectedTask ? (
                <Link className="admin-button secondary small" href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id })}>
                  처리 필터 해제
                </Link>
              ) : null}
            </div>
            {!readOnly ? (
              <AdminOrderBulkActions
                formId={bulkPrepareFormId}
                redirectTo={bulkRedirectTo}
                rows={bulkRows}
                task={selectedTask}
              />
            ) : null}
          </div>
        }
        description={selectedTask ? `${orderTaskLabels[selectedTask]} 대상 주문입니다. 주문을 선택해 일괄 처리하거나 주문번호를 눌러 개별 처리하세요.` : undefined}
        title={`${selectedTask ? `${orderTaskLabels[selectedTask]} · ` : ""}목록 (총 ${filteredOrderRows.length.toLocaleString("ko-KR")}건)`}
      >
        <form action={readOnly || (selectedTask && selectedTask !== "prepare") ? undefined : bulkPrepareShipmentsAction} id={bulkPrepareFormId}>
          <input name="redirectTo" type="hidden" value={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id, status: selectedStatus, task: selectedTask })} />
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
              const selectable = !readOnly && canSelectForTask(order, selectedTask);
              const firstItem = order.itemDetails[0];
              const extraCount = Math.max(0, order.itemDetails.length - 1);
              const totalQuantity = order.itemDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

              return (
                <div className="admin-table-row admin-order-table-row" key={order.number}>
                  <label className="admin-order-check-cell" title={readOnly ? "조회 전용" : selectable ? `${selectedTask ? orderTaskLabels[selectedTask] : "상품 준비"} 대상 선택` : "현재 작업의 처리 대상이 아닙니다."}>
                    <input
                      aria-label={`${order.number} 선택`}
                      data-admin-order-select="true"
                      data-order-id={String(order.id || "")}
                      disabled={!selectable}
                      name={!selectedTask || selectedTask === "prepare" ? "shipmentId" : undefined}
                      type="checkbox"
                      value={!selectedTask || selectedTask === "prepare" ? String(order.shipmentId || "") : String(order.id || "")}
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
                    <span>{orderClaimLabel(order)}</span>
                  </div>
                </div>
              );
            })}
          </AdminTable>
          <AdminTableScrollMirror targetId={orderTableScrollerId} />
        </form>
      </AdminPanel>

      {!readOnly ? <section className="admin-order-management-guide" aria-label="주문 처리 안내">
        <div className="admin-order-management-row">
          <strong>주문관리</strong>
          <Link
            className={!selectedTask ? "is-active" : undefined}
            href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id })}
          >
            전체조회
          </Link>
          {[["prepare", "발주 확인"], ["ship", "발송 처리"], ["delay", "발송 지연 처리"], ["address", "배송지 정보 수정"], ["unpaid", "미결제 확인"]].map(([task, label]) => (
            <Link
              className={selectedTask === task ? "is-active" : undefined}
              href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id, task })}
              key={task}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="admin-order-management-row">
          <strong>취소관리</strong>
          {[["sellerCancel", "판매자 직접취소 처리"], ["cancelApproval", "취소 승인처리"], ["completedCancel", "구매확정 후 취소처리"]].map(([task, label]) => (
            <Link
              className={selectedTask === task ? "is-active" : undefined}
              href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id, task })}
              key={task}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="admin-order-management-row">
          <strong>반품교환관리</strong>
          {[["claimCreate", "반품 및 교환접수"], ["returnProcess", "반품접수 후 처리"], ["exchangeProcess", "교환접수 후 처리"]].map(([task, label]) => (
            <Link
              className={selectedTask === task ? "is-active" : undefined}
              href={buildOrdersHref({ dateFrom, dateTo, dealerMallId: selectedDealer?.id, task })}
              key={task}
            >
              {label}
            </Link>
          ))}
        </div>
      </section> : null}
    </div>
  );
}
