import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import {
  fetchAdminDealerMalls,
  fetchAdminMonthlySales,
  fetchAdminMonthlySettlements,
  formatWon,
  hasHealthBoxApi,
  numberValue,
  stringValue,
} from "../../_lib/health-box-api";
import { mapDealerRows } from "../../_lib/health-box-presenters";

type SalesSearchParams = {
  dealerMallId?: string;
};

function parseAmount(value: string) {
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

function buildSummaryRows(
  bundles: Array<{
    dealer: ReturnType<typeof mapDealerRows>[number];
    sales: Record<string, unknown>[] | null;
    settlements: Record<string, unknown>[] | null;
  }>,
) {
  return bundles.map(({ dealer, sales, settlements }) => {
    const latestSales = sales?.[0] ?? null;
    const latestSettlement = settlements?.[0] ?? null;
    const status =
      stringValue(latestSettlement, "status") ||
      stringValue(latestSales, "status") ||
      dealer.status;

    return {
      dealerId: dealer.id,
      company: dealer.name,
      parent: "건강창고 본몰",
      sales: formatWon(numberValue(latestSales, "grossSales", "salesAmount", "netSales") ?? 0),
      orders: stringValue(latestSales, "orderCount") || "0건",
      deduction: formatWon(numberValue(latestSettlement, "deductionAmount", "deduction") ?? 0),
      estimated: formatWon(
        numberValue(latestSettlement, "estimatedSettlementAmount", "confirmedSettlementAmount", "estimated") ?? 0,
      ),
      trend: status,
      tone: dealer.tone,
    };
  });
}

function buildMetrics(
  rows: ReadonlyArray<{
    sales: string;
    estimated: string;
    deduction: string;
  }>,
) {
  if (!rows.length) {
    return [
      { label: "이번 달 매출", value: "0원", hint: "실데이터 없음", tone: "blue" as const },
      { label: "예상 정산액", value: "0원", hint: "실데이터 없음", tone: "cyan" as const },
      { label: "차감 검수", value: "0원", hint: "실데이터 없음", tone: "rose" as const },
      { label: "활성 딜러몰", value: "0곳", hint: "실데이터 없음", tone: "green" as const },
    ];
  }

  const gross = rows.reduce((sum, row) => sum + parseAmount(row.sales), 0);
  const estimated = rows.reduce((sum, row) => sum + parseAmount(row.estimated), 0);
  const deduction = rows.reduce((sum, row) => sum + parseAmount(row.deduction), 0);

  return [
    { label: "이번 달 매출", value: formatWon(gross), hint: "최신 월 집계 기준", tone: "blue" as const },
    { label: "예상 정산액", value: formatWon(estimated), hint: "딜러몰 최신 기준", tone: "cyan" as const },
    { label: "차감 검수", value: formatWon(deduction), hint: "반품 · 취소 반영", tone: "rose" as const },
    { label: "활성 딜러몰", value: `${rows.length}곳`, hint: "집계 가능한 딜러몰", tone: "green" as const },
  ];
}

function buildTimeline(
  sales: Record<string, unknown>[] | null,
  settlements: Record<string, unknown>[] | null,
) {
  if (!sales?.length && !settlements?.length) {
    return {
      trend: [],
      rows: [],
    };
  }

  const months = new Map<
    string,
    {
      month: string;
      gross: number;
      orders: string;
      deduction: number;
      estimated: number;
      status: string;
    }
  >();

  for (const item of sales ?? []) {
    const month = stringValue(item, "baseYearMonth") || "-";
    months.set(month, {
      month,
      gross: numberValue(item, "grossSales", "salesAmount", "netSales") ?? 0,
      orders: stringValue(item, "orderCount") || "0건",
      deduction: months.get(month)?.deduction ?? 0,
      estimated: months.get(month)?.estimated ?? 0,
      status: months.get(month)?.status || stringValue(item, "status") || "집계됨",
    });
  }

  for (const item of settlements ?? []) {
    const month = stringValue(item, "baseYearMonth") || "-";
    const current = months.get(month) || {
      month,
      gross: 0,
      orders: "0건",
      deduction: 0,
      estimated: 0,
      status: "검수중",
    };
    current.deduction = numberValue(item, "deductionAmount", "deduction") ?? current.deduction;
    current.estimated =
      numberValue(item, "estimatedSettlementAmount", "confirmedSettlementAmount", "estimated") ?? current.estimated;
    current.status = stringValue(item, "status") || current.status;
    months.set(month, current);
  }

  const rows = Array.from(months.values()).sort((left, right) => right.month.localeCompare(left.month));
  const maxGross = Math.max(...rows.map((row) => row.gross), 1);

  return {
    trend: rows
      .slice()
      .reverse()
      .map((row) => ({
        month: row.month,
        width: Math.max(18, Math.min(100, Math.round((row.gross / maxGross) * 100))),
        sales: formatWon(row.gross),
      })),
    rows,
  };
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<SalesSearchParams>;
}) {
  const params = await searchParams;
  const dealers = hasHealthBoxApi() ? await fetchAdminDealerMalls() : null;
  const dealerRows = mapDealerRows(dealers);

  const bundles =
    hasHealthBoxApi() && dealerRows.length
      ? await Promise.all(
          dealerRows.map(async (dealer) => ({
            dealer,
            sales: await fetchAdminMonthlySales(dealer.id),
            settlements: await fetchAdminMonthlySettlements(dealer.id),
          })),
        )
      : [];

  const summaryRows = bundles.length ? buildSummaryRows(bundles) : [];
  const metrics = buildMetrics(summaryRows);
  const selectedDealerId = Number(params.dealerMallId) || dealerRows[0]?.id || null;
  const selectedBundle = bundles.find((bundle) => bundle.dealer.id === selectedDealerId) || bundles[0] || null;
  const timeline = selectedBundle ? buildTimeline(selectedBundle.sales, selectedBundle.settlements) : { trend: [], rows: [] };

  return (
    <div className="admin-page">
      <AdminHeader title="매출 / 정산" />

      <AdminMetrics items={metrics} />

      <AdminPanel title="조회 딜러몰">
        <div className="admin-filter-chip-set">
          {dealerRows.map((dealer) => (
            <Link
              className={`admin-button secondary small${selectedDealerId === dealer.id ? " is-active" : ""}`}
              href={`/admin/sales?dealerMallId=${dealer.id}`}
              key={dealer.id}
            >
              {dealer.name}
            </Link>
          ))}
          {!dealerRows.length ? <p className="admin-row-muted">조회 가능한 딜러몰이 없습니다.</p> : null}
        </div>
      </AdminPanel>

      <div className="admin-grid-side">
        <AdminPanel title="회원사별 매출 / 정산">
          <AdminTable
            columns="minmax(0, 1.1fr) minmax(0, 0.9fr) 110px 90px 100px 120px 90px"
            emptyDescription="매출 / 정산 집계 데이터가 없습니다."
            headers={["회원사", "소속 조직", "월 매출", "주문", "차감액", "예상 정산", "상태"]}
            isEmpty={!summaryRows.length}
          >
            {summaryRows.map((row) => (
              <div className="admin-table-row" key={row.company}>
                <div className="admin-row-stack">
                  <strong>{row.company}</strong>
                  <p>딜러몰 기준 최신 월 집계</p>
                </div>
                <span className="admin-row-muted">{row.parent}</span>
                <strong className="admin-row-price">{row.sales}</strong>
                <span className="admin-row-muted">{row.orders}</span>
                <span className="admin-row-muted">{row.deduction}</span>
                <strong className="admin-row-price">{row.estimated}</strong>
                <AdminBadge tone={row.tone}>{row.trend}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel title="월간 추이">
            <div className="admin-sales-chart">
              {timeline.trend.map((item) => (
                <div className="admin-sales-chart-row" key={item.month}>
                  <span className="admin-sales-chart-label">{item.month}</span>
                  <div className="admin-sales-chart-track">
                    <div className="admin-sales-chart-bar" style={{ width: `${item.width}%` }} />
                  </div>
                  <strong className="admin-sales-chart-value">{item.sales}</strong>
                </div>
              ))}
              {!timeline.trend.length ? <p className="admin-row-muted">월간 추이 데이터가 없습니다.</p> : null}
            </div>
          </AdminPanel>

          <AdminPanel title="선택 딜러몰 월간 상세">
            {selectedBundle && timeline.rows.length ? (
              <div className="admin-list">
                {timeline.rows.map((row) => (
                  <div className="admin-list-row" key={row.month}>
                    <div className="admin-row-stack">
                      <strong>{row.month}</strong>
                      <p>주문 {row.orders} · 차감 {formatWon(row.deduction)}</p>
                    </div>
                    <div className="admin-list-meta">
                      <AdminBadge tone="blue">{row.status}</AdminBadge>
                      <span>{formatWon(row.estimated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-row-muted">월간 집계 데이터가 없습니다.</p>
            )}
          </AdminPanel>

          <AdminPanel title="정산 메모">
            <ul className="admin-bullet-list">
              <li>월간 집계는 선택한 딜러몰의 최신 기준으로 표기했습니다.</li>
              <li>차감액과 예상 정산액은 settlement summary 기준 값을 우선 사용합니다.</li>
              <li>실제 확정 금액 정책이 바뀌면 코드값 기반 정산 룰도 함께 맞춰야 합니다.</li>
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
