import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminDealerMalls,
  fetchAdminOrders,
  formatWon,
  hasHealthBoxApi,
  idValue,
  numberValue,
  stringValue,
  type HealthBoxRecord,
} from "../../_lib/health-box-api";
import { mapDealerRows, mapOrderRows } from "../../_lib/health-box-presenters";

type SalesSearchParams = {
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  settlement?: string;
  sort?: string;
  page?: string;
  size?: string;
};

type DealerSalesRow = {
  dealerId: number;
  dealerName: string;
  dealerCode: string;
  orderCount: number;
  itemCount: number;
  grossSales: number;
  canceledAmount: number;
  netSales: number;
  settlementAmount: number;
  latestOrderAt: string;
  status: "READY" | "REVIEW" | "EMPTY" | "EXCLUDED";
};

const pageSizeOptions = [20, 50, 100];

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateMonthsBefore(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return formatDateInput(date);
}

function dateBefore(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
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

function monthKey(value: string) {
  const key = rowDateKey(value);
  return key ? key.slice(0, 7) : "";
}

function parseWon(value: string) {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

function recordObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as HealthBoxRecord) : null;
}

function orderPaymentRecord(order: HealthBoxRecord) {
  return recordObject(order.payment);
}

function orderPaidAmount(order: HealthBoxRecord, mappedAmount: string) {
  const payment = orderPaymentRecord(order);
  return (
    numberValue(payment, "paidAmount", "amount", "totalAmount") ??
    numberValue(order, "totalPaymentAmount", "paidAmount", "amount", "totalAmount") ??
    parseWon(mappedAmount)
  );
}

function orderCanceledAmount(order: HealthBoxRecord) {
  const payment = orderPaymentRecord(order);
  return (
    numberValue(payment, "canceledAmount", "cancelAmount", "cancelledAmount") ??
    numberValue(order, "canceledPaymentAmount", "cancelAmount", "cancelledAmount") ??
    0
  );
}

function isCanceledOrder(order: HealthBoxRecord, mappedStatus: string) {
  const text = `${stringValue(order, "orderStatus", "status")} ${stringValue(order, "shipmentStatus")} ${mappedStatus}`;
  return /CANCELED|취소/i.test(text);
}

function orderSalesAmounts(order: HealthBoxRecord, mappedAmount: string, mappedStatus: string) {
  const gross = orderPaidAmount(order, mappedAmount);
  const canceled = isCanceledOrder(order, mappedStatus) ? gross : orderCanceledAmount(order);
  return {
    gross,
    canceled,
    net: Math.max(0, gross - canceled),
  };
}

function dealerIdFromOrder(order: HealthBoxRecord) {
  return idValue(order, "dealerMallId", "dealerId", "mallId") ?? 0;
}

function dealerNameFromOrder(order: HealthBoxRecord, fallback = "미지정 딜러몰") {
  return stringValue(order, "dealerNameSnapshot", "dealerMallName", "mallName", "company") || fallback;
}

function settlementStatusLabel(status: DealerSalesRow["status"]) {
  if (status === "READY") {
    return "정산 대기";
  }

  if (status === "REVIEW") {
    return "취소/차감 있음";
  }

  if (status === "EXCLUDED") {
    return "정산 제외";
  }

  return "매출 없음";
}

function settlementStatusTone(status: DealerSalesRow["status"]) {
  if (status === "READY") {
    return "cyan" as const;
  }

  if (status === "REVIEW") {
    return "gold" as const;
  }

  if (status === "EXCLUDED") {
    return "rose" as const;
  }

  return "blue" as const;
}

function buildSalesHref(
  base: Pick<SalesSearchParams, "dateFrom" | "dateTo" | "q" | "settlement" | "sort" | "size">,
  overrides: Partial<SalesSearchParams> = {},
) {
  const params = new URLSearchParams();
  const next = { ...base, ...overrides };

  for (const [key, value] of Object.entries(next)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/admin/sales?${query}` : "/admin/sales";
}

function normalizePageSize(value?: string) {
  const size = Number(value) || 20;
  return pageSizeOptions.includes(size) ? size : 20;
}

function aggregateDealerRows({
  dealers,
  orders,
  dateFrom,
  dateTo,
}: {
  dealers: ReturnType<typeof mapDealerRows>;
  orders: HealthBoxRecord[] | null;
  dateFrom: string;
  dateTo: string;
}) {
  const mappedOrders = mapOrderRows(orders);
  const rows = new Map<number, DealerSalesRow>();

  for (const dealer of dealers) {
    rows.set(dealer.id, {
      dealerId: dealer.id,
      dealerName: dealer.name,
      dealerCode: dealer.dealerCode,
      orderCount: 0,
      itemCount: 0,
      grossSales: 0,
      canceledAmount: 0,
      netSales: 0,
      settlementAmount: 0,
      latestOrderAt: "-",
      status: "EMPTY",
    });
  }

  mappedOrders.forEach((mapped, index) => {
    const raw = orders?.[index] ?? {};
    const key = rowDateKey(mapped.placedAt);
    if (key && ((dateFrom && key < dateFrom) || (dateTo && key > dateTo))) {
      return;
    }

    const dealerId = dealerIdFromOrder(raw);
    const existing =
      rows.get(dealerId) ??
      {
        dealerId,
        dealerName: dealerNameFromOrder(raw),
        dealerCode: dealerId ? `ID ${dealerId}` : "-",
        orderCount: 0,
        itemCount: 0,
        grossSales: 0,
        canceledAmount: 0,
        netSales: 0,
        settlementAmount: 0,
        latestOrderAt: "-",
        status: "EMPTY" as const,
      };

    const { gross, canceled, net } = orderSalesAmounts(raw, mapped.amount, mapped.status);
    const itemCount = mapped.itemDetails.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    existing.orderCount += 1;
    existing.itemCount += itemCount || mapped.itemDetails.length || 1;
    existing.grossSales += gross;
    existing.canceledAmount += canceled;
    existing.netSales += net;
    existing.settlementAmount += net;
    existing.latestOrderAt =
      existing.latestOrderAt === "-" || mapped.placedAt.localeCompare(existing.latestOrderAt) > 0
        ? mapped.placedAt
        : existing.latestOrderAt;
    existing.status = existing.netSales <= 0 ? "EXCLUDED" : existing.canceledAmount > 0 ? "REVIEW" : "READY";

    rows.set(dealerId, existing);
  });

  return Array.from(rows.values());
}

function buildMonthlyTrend(orders: HealthBoxRecord[] | null, dateFrom: string, dateTo: string) {
  const mappedOrders = mapOrderRows(orders);
  const months = new Map<string, { month: string; gross: number; net: number; orders: number }>();

  mappedOrders.forEach((mapped, index) => {
    const raw = orders?.[index] ?? {};
    const key = rowDateKey(mapped.placedAt);
    if (key && ((dateFrom && key < dateFrom) || (dateTo && key > dateTo))) {
      return;
    }

    const month = monthKey(mapped.placedAt) || "일시 없음";
    const current = months.get(month) ?? { month, gross: 0, net: 0, orders: 0 };
    const { gross, net } = orderSalesAmounts(raw, mapped.amount, mapped.status);
    current.gross += gross;
    current.net += net;
    current.orders += 1;
    months.set(month, current);
  });

  const rows = Array.from(months.values()).sort((left, right) => left.month.localeCompare(right.month));
  const maxNet = Math.max(...rows.map((row) => row.net), 1);

  return rows.map((row) => ({
    ...row,
    width: Math.max(12, Math.round((row.net / maxNet) * 100)),
  }));
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<SalesSearchParams>;
}) {
  const params = await searchParams;
  const today = formatDateInput(new Date());
  const dateFrom = params.dateFrom || dateMonthsBefore(3);
  const dateTo = params.dateTo || today;
  const query = (params.q || "").trim();
  const settlementFilter = params.settlement || "";
  const sort = params.sort || "net-desc";
  const pageSize = normalizePageSize(params.size);
  const currentPage = Math.max(1, Number(params.page) || 1);
  const [dealers, orders] = hasHealthBoxApi() ? await Promise.all([fetchAdminDealerMalls(), fetchAdminOrders()]) : [null, null];
  const dealerRows = mapDealerRows(dealers);
  const salesRows = aggregateDealerRows({ dealers: dealerRows, orders, dateFrom, dateTo });
  const metricRows = salesRows.filter((row) => !settlementFilter || row.status === settlementFilter);
  const filteredRows = salesRows.filter((row) => {
    const matchesQuery =
      !query ||
      row.dealerName.toLowerCase().includes(query.toLowerCase()) ||
      row.dealerCode.toLowerCase().includes(query.toLowerCase());
    const matchesSettlement = !settlementFilter || row.status === settlementFilter;
    return matchesQuery && matchesSettlement;
  }).sort((left, right) => {
    if (sort === "net-asc") {
      return left.netSales - right.netSales || left.dealerName.localeCompare(right.dealerName, "ko-KR");
    }

    if (sort === "orders-desc") {
      return right.orderCount - left.orderCount || right.netSales - left.netSales;
    }

    if (sort === "latest-desc") {
      return right.latestOrderAt.localeCompare(left.latestOrderAt) || right.netSales - left.netSales;
    }

    if (sort === "name-asc") {
      return left.dealerName.localeCompare(right.dealerName, "ko-KR");
    }

    return right.netSales - left.netSales || left.dealerName.localeCompare(right.dealerName, "ko-KR");
  });
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalGross = metricRows.reduce((sum, row) => sum + row.grossSales, 0);
  const totalCanceled = metricRows.reduce((sum, row) => sum + row.canceledAmount, 0);
  const totalNet = metricRows.reduce((sum, row) => sum + row.netSales, 0);
  const totalOrders = metricRows.reduce((sum, row) => sum + row.orderCount, 0);
  const readyCount = metricRows.filter((row) => row.status === "READY").length;
  const reviewCount = metricRows.filter((row) => row.status === "REVIEW").length;
  const emptyCount = metricRows.filter((row) => row.status === "EMPTY").length;
  const trendRows = buildMonthlyTrend(orders, dateFrom, dateTo);
  const hrefBase = {
    dateFrom,
    dateTo,
    q: query,
    settlement: settlementFilter,
    sort,
    size: String(pageSize),
  };

  const metrics = [
    { label: "건강창고 총 매출", value: formatWon(totalGross), hint: "조회기간 결제금액", tone: "blue" as const },
    { label: "실매출", value: formatWon(totalNet), hint: "취소 차감 후", tone: "green" as const },
    { label: "취소/차감", value: formatWon(totalCanceled), hint: "취소 및 부분취소", tone: "rose" as const },
    { label: "정산 대상 딜러", value: `${readyCount + reviewCount}곳`, hint: `${totalOrders.toLocaleString("ko-KR")}건 주문`, tone: "cyan" as const },
  ];

  return (
    <div className="admin-page">
      <AdminHeader title="매출 / 정산" />

      <AdminMetrics items={metrics} />

      <div className="admin-sales-layout">
        <AdminPanel title="정산 상태 요약">
          <div className="admin-sales-status-grid">
            <div>
              <span>정산 대기</span>
              <strong>{readyCount.toLocaleString("ko-KR")}곳</strong>
            </div>
            <div>
              <span>취소/차감 있음</span>
              <strong>{reviewCount.toLocaleString("ko-KR")}곳</strong>
            </div>
            <div>
              <span>매출 없음</span>
              <strong>{emptyCount.toLocaleString("ko-KR")}곳</strong>
            </div>
            <div>
              <span>예정 정산액</span>
              <strong>{formatWon(totalNet)}</strong>
            </div>
          </div>
          <p className="admin-sales-note">
            취소/차감 있음은 취소 또는 부분취소 금액이 있는 딜러몰입니다. 정산 예정액은 현재 주문 결제금액에서 취소/차감액을 뺀 기준입니다.
          </p>
        </AdminPanel>

        <AdminPanel title="월별 매출 흐름">
          <div className="admin-sales-chart">
            {trendRows.map((item) => (
              <div className="admin-sales-chart-row admin-sales-chart-row-wide" key={item.month}>
                <span className="admin-sales-chart-label">{item.month}</span>
                <div className="admin-sales-chart-track">
                  <div className="admin-sales-chart-bar" style={{ width: `${item.width}%` }} />
                </div>
                <strong className="admin-sales-chart-value">{formatWon(item.net)}</strong>
              </div>
            ))}
            {!trendRows.length ? <p className="admin-row-muted">조회기간 매출 데이터가 없습니다.</p> : null}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="조회 조건">
        <form action="/admin/sales" className="admin-sales-filter-form">
          <label className="admin-order-filter-field admin-sales-period-field">
            <span>조회기간</span>
            <div className="admin-order-period-shortcuts">
              <Link className="admin-button secondary small" href={buildSalesHref(hrefBase, { dateFrom: today, dateTo: today, page: "1" })}>
                오늘
              </Link>
              <Link className="admin-button secondary small" href={buildSalesHref(hrefBase, { dateFrom: dateBefore(7), dateTo: today, page: "1" })}>
                1주일
              </Link>
              <Link className="admin-button secondary small" href={buildSalesHref(hrefBase, { dateFrom: dateMonthsBefore(1), dateTo: today, page: "1" })}>
                1개월
              </Link>
              <Link className="admin-button secondary small" href={buildSalesHref(hrefBase, { dateFrom: dateMonthsBefore(3), dateTo: today, page: "1" })}>
                3개월
              </Link>
            </div>
          </label>
          <div className="admin-order-date-range admin-sales-date-range">
            <input className="admin-input" defaultValue={dateFrom} name="dateFrom" type="date" />
            <span>~</span>
            <input className="admin-input" defaultValue={dateTo} name="dateTo" type="date" />
          </div>
          <label className="admin-order-filter-field">
            <span>딜러몰 검색</span>
            <input className="admin-input" defaultValue={query} name="q" placeholder="딜러몰명, 코드" />
          </label>
          <label className="admin-order-filter-field">
            <span>정산 상태</span>
            <select className="admin-select" defaultValue={settlementFilter} name="settlement">
              <option value="">전체</option>
              <option value="READY">정산 대기</option>
              <option value="REVIEW">취소/차감 있음</option>
              <option value="EXCLUDED">정산 제외</option>
              <option value="EMPTY">매출 없음</option>
            </select>
          </label>
          <label className="admin-order-filter-field">
            <span>조회 순서</span>
            <select className="admin-select" defaultValue={sort} name="sort">
              <option value="net-desc">매출 높은순</option>
              <option value="net-asc">매출 낮은순</option>
              <option value="orders-desc">주문 많은순</option>
              <option value="latest-desc">최근 주문순</option>
              <option value="name-asc">딜러몰 이름순</option>
            </select>
          </label>
          <input name="size" type="hidden" value={String(pageSize)} />
          <button className="admin-button admin-order-search-button admin-sales-submit-button" type="submit">
            검색
          </button>
        </form>
      </AdminPanel>

      <AdminPanel
        action={
          <div className="admin-sales-table-actions">
            <span>
              총 {filteredRows.length.toLocaleString("ko-KR")}곳 · {page.toLocaleString("ko-KR")} / {totalPages.toLocaleString("ko-KR")}쪽
            </span>
            <div className="admin-sales-size-links" aria-label="페이지당 표시 개수">
              {pageSizeOptions.map((size) => (
                <Link
                  className={size === pageSize ? "is-active" : ""}
                  href={buildSalesHref(hrefBase, { page: "1", size: String(size) })}
                  key={size}
                >
                  {size}
                </Link>
              ))}
            </div>
          </div>
        }
        title="딜러몰별 매출 / 정산"
      >
        <AdminTable
          alignments={["left", "center", "right", "right", "right", "right", "center", "left"]}
          columns="minmax(220px, 1.2fr) 90px 130px 130px 130px 130px 110px 150px"
          emptyDescription="조건에 맞는 딜러몰 매출 데이터가 없습니다."
          headers={["딜러몰", "주문", "총 매출", "취소/차감", "실매출", "정산 예정", "정산 상태", "최근 주문"]}
          isEmpty={!pageRows.length}
        >
          {pageRows.map((row) => (
            <div className="admin-table-row admin-sales-row" key={row.dealerId || row.dealerName}>
              <div className="admin-row-stack">
                <strong>{row.dealerName}</strong>
                <p>{row.dealerCode}</p>
              </div>
              <span className="admin-cell-center">{row.orderCount.toLocaleString("ko-KR")}건</span>
              <strong className="admin-row-price admin-cell-right">{formatWon(row.grossSales)}</strong>
              <span className="admin-row-muted admin-cell-right">{formatWon(row.canceledAmount)}</span>
              <strong className="admin-row-price admin-cell-right">{formatWon(row.netSales)}</strong>
              <strong className="admin-row-price admin-cell-right">{formatWon(row.settlementAmount)}</strong>
              <AdminBadge className="admin-cell-center" tone={settlementStatusTone(row.status)}>
                {settlementStatusLabel(row.status)}
              </AdminBadge>
              <span className="admin-row-muted">{row.latestOrderAt}</span>
            </div>
          ))}
        </AdminTable>

        <div className="admin-pagination">
          <Link
            className={`admin-pagination-button${page <= 1 ? " is-disabled" : ""}`}
            href={buildSalesHref(hrefBase, { page: String(Math.max(1, page - 1)) })}
          >
            이전
          </Link>
          <div className="admin-pagination-pages">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNumber = start + index;
              return (
                <Link
                  className={`admin-pagination-page${pageNumber === page ? " is-active" : ""}`}
                  href={buildSalesHref(hrefBase, { page: String(pageNumber) })}
                  key={pageNumber}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
          <Link
            className={`admin-pagination-button${page >= totalPages ? " is-disabled" : ""}`}
            href={buildSalesHref(hrefBase, { page: String(Math.min(totalPages, page + 1)) })}
          >
            다음
          </Link>
        </div>
      </AdminPanel>
    </div>
  );
}
