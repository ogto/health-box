"use client";

type AdminOrderExportRow = {
  amount: string;
  claimStatus: string;
  company: string;
  deliveryType: string;
  option: string;
  orderAt: string;
  orderNo: string;
  productName: string;
  quantity: string;
  status: string;
};

function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsv(rows: AdminOrderExportRow[]) {
  const headers = [
    "주문번호",
    "주문일시",
    "주문상태",
    "배송속성",
    "회원사",
    "상품명",
    "옵션정보",
    "수량",
    "결제금액",
    "클레임상태",
  ];
  const lines = rows.map((row) => [
    row.orderNo,
    row.orderAt,
    row.status,
    row.deliveryType,
    row.company,
    row.productName,
    row.option,
    row.quantity,
    row.amount,
    row.claimStatus,
  ]);

  return [headers, ...lines]
    .map((line) => line.map((cell) => escapeCsvCell(String(cell || ""))).join(","))
    .join("\n");
}

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

export function AdminOrderExcelDownloadButton({ rows }: { rows: AdminOrderExportRow[] }) {
  function downloadCsv() {
    const csv = `\uFEFF${buildCsv(rows)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `health-box-orders-${todayKey()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="admin-button secondary small" disabled={!rows.length} onClick={downloadCsv} type="button">
      엑셀다운
    </button>
  );
}
