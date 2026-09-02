"use client";

export type AdminOrderExportRow = {
  amount: string;
  baseAddress: string;
  buyerName: string;
  buyerPhone: string;
  claimStatus: string;
  company: string;
  deliveryType: string;
  detailAddress: string;
  option: string;
  orderAt: string;
  orderNo: string;
  productDetails: string;
  productName: string;
  quantity: string;
  receiverName: string;
  receiverPhone: string;
  status: string;
  zipCode: string;
};

function escapeCsvCell(value: string) {
  let normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Excel에서 수식으로 해석될 수 있는 주문자 입력값은 텍스트로 고정한다.
  if (/^[=+\-@\t]/.test(normalized)) {
    normalized = `'${normalized}`;
  }

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function serializeCsv(headers: string[], lines: string[][]) {
  return [headers, ...lines]
    .map((line) => line.map((cell) => escapeCsvCell(String(cell || ""))).join(","))
    .join("\n");
}

function buildOrderCsv(rows: AdminOrderExportRow[]) {
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

  return serializeCsv(headers, lines);
}

function buildShippingCsv(rows: AdminOrderExportRow[]) {
  const headers = [
    "주문번호",
    "주문일시",
    "주문상태",
    "주문자명",
    "주문자연락처",
    "수령인명",
    "수령인연락처",
    "우편번호",
    "기본주소",
    "상세주소",
    "상품정보",
    "총수량",
    "결제금액",
    "배송속성",
    "회원사",
    "택배사",
    "송장번호",
  ];
  const lines = rows.map((row) => [
    row.orderNo,
    row.orderAt,
    row.status,
    row.buyerName,
    row.buyerPhone,
    row.receiverName,
    row.receiverPhone,
    row.zipCode,
    row.baseAddress,
    row.detailAddress,
    row.productDetails,
    row.quantity,
    row.amount,
    row.deliveryType,
    row.company,
    "",
    "",
  ]);

  return serializeCsv(headers, lines);
}

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

function downloadCsv(csv: string, fileName: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminOrderExcelDownloadButton({
  rows,
  shippingRows,
}: {
  rows: AdminOrderExportRow[];
  shippingRows: AdminOrderExportRow[];
}) {
  return (
    <div className="admin-order-excel-actions">
      <button
        className="admin-button secondary small"
        disabled={!rows.length}
        onClick={() => downloadCsv(buildOrderCsv(rows), `health-box-orders-${todayKey()}.csv`)}
        type="button"
      >
        주문 엑셀
      </button>
      <button
        className="admin-button secondary small"
        disabled={!shippingRows.length}
        onClick={() => downloadCsv(buildShippingCsv(shippingRows), `health-box-shipping-${todayKey()}.csv`)}
        title="현재 조회 결과 중 발송 전 주문만 내려받습니다."
        type="button"
      >
        배송용 엑셀
      </button>
    </div>
  );
}
