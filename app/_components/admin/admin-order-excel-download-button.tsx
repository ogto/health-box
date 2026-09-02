"use client";

import { useState } from "react";

import { dispatchAdminToast } from "./admin-toast";

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

function todayKey() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
}

function downloadBlob(blob: Blob, fileName: string) {
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
  const [downloading, setDownloading] = useState<"orders" | "shipping" | null>(null);

  async function downloadXlsx(kind: "orders" | "shipping") {
    if (downloading) return;
    setDownloading(kind);
    try {
      const { createOrderWorkbook, createShippingWorkbook } = await import("../../_lib/admin-shipment-spreadsheet");
      const workbook = kind === "orders"
        ? await createOrderWorkbook(rows)
        : await createShippingWorkbook(shippingRows);
      downloadBlob(
        new Blob([workbook], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `health-box-${kind}-${todayKey()}.xlsx`,
      );
    } catch {
      dispatchAdminToast(`${kind === "orders" ? "주문" : "배송용"} 엑셀 파일을 만들지 못했습니다. 다시 시도해주세요.`, "error");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="admin-order-excel-actions">
      <button
        className="admin-button secondary small"
        disabled={!rows.length || downloading !== null}
        onClick={() => void downloadXlsx("orders")}
        title="현재 조회 결과의 주문을 XLSX 형식으로 내려받습니다."
        type="button"
      >
        {downloading === "orders" ? "엑셀 생성 중..." : "주문 엑셀"}
      </button>
      <button
        className="admin-button secondary small"
        disabled={!shippingRows.length || downloading !== null}
        onClick={() => void downloadXlsx("shipping")}
        title="현재 조회 결과 중 발송 전 주문을 XLSX 형식으로 내려받습니다."
        type="button"
      >
        {downloading === "shipping" ? "엑셀 생성 중..." : "배송용 엑셀"}
      </button>
    </div>
  );
}
