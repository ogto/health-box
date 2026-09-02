import "client-only";

import ExcelJS from "exceljs";

import type { AdminOrderExportRow } from "../_components/admin/admin-order-excel-download-button";

export const SHIPPING_SPREADSHEET_HEADERS = [
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
] as const;

const COLUMN_WIDTHS = [18, 21, 14, 12, 16, 12, 16, 10, 32, 22, 54, 10, 14, 13, 16, 18, 20];
const TEXT_COLUMN_NUMBERS = [1, 5, 7, 8, 16, 17];

function shippingRowValues(row: AdminOrderExportRow) {
  return [
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
  ];
}

export async function createShippingWorkbook(rows: AdminOrderExportRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "건강창고";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("배송목록", {
    properties: { defaultRowHeight: 24 },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = SHIPPING_SPREADSHEET_HEADERS.map((header, index) => ({
    header,
    key: `column_${index + 1}`,
    width: COLUMN_WIDTHS[index],
  }));
  worksheet.autoFilter = {
    from: { column: 1, row: 1 },
    to: { column: SHIPPING_SPREADSHEET_HEADERS.length, row: 1 },
  };

  const headerRow = worksheet.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell) => {
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      bottom: { color: { argb: "FF276738" }, style: "thin" },
      left: { color: { argb: "FF9FC7AA" }, style: "thin" },
      right: { color: { argb: "FF9FC7AA" }, style: "thin" },
      top: { color: { argb: "FF276738" }, style: "thin" },
    };
    cell.fill = { fgColor: { argb: "FF2F7A3D" }, pattern: "solid", type: "pattern" };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  });

  for (const columnNumber of TEXT_COLUMN_NUMBERS) {
    worksheet.getColumn(columnNumber).numFmt = "@";
  }

  rows.forEach((row, index) => {
    const excelRow = worksheet.addRow(shippingRowValues(row));
    const productLineCount = Math.max(1, row.productDetails.split("\n").length);
    excelRow.height = Math.min(84, 24 + (productLineCount - 1) * 15);
    excelRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.alignment = {
        horizontal: [1, 3, 8, 12, 13, 14, 16, 17].includes(columnNumber) ? "center" : "left",
        vertical: "middle",
        wrapText: [9, 10, 11, 16, 17].includes(columnNumber),
      };
      cell.border = {
        bottom: { color: { argb: "FFDCE5DF" }, style: "thin" },
        left: { color: { argb: "FFE7EDE9" }, style: "thin" },
        right: { color: { argb: "FFE7EDE9" }, style: "thin" },
        top: { color: { argb: "FFDCE5DF" }, style: "thin" },
      };
      if (index % 2 === 1) {
        cell.fill = { fgColor: { argb: "FFF7FAF8" }, pattern: "solid", type: "pattern" };
      }
    });

    for (const columnNumber of [16, 17]) {
      const inputCell = excelRow.getCell(columnNumber);
      inputCell.fill = { fgColor: { argb: "FFFFF4CC" }, pattern: "solid", type: "pattern" };
      inputCell.font = { color: { argb: "FF7A4D00" } };
      inputCell.numFmt = "@";
    }

    excelRow.getCell(16).dataValidation = {
      allowBlank: true,
      formulae: ['"CJ대한통운,한진택배,롯데택배,로젠택배,우체국택배,쿠팡로지스틱스"'],
      showErrorMessage: false,
      type: "list",
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function worksheetRows(worksheet: ExcelJS.Worksheet) {
  const rows: string[][] = [];
  worksheet.eachRow((row) => {
    const values = Array.from(
      { length: Math.max(worksheet.columnCount, row.cellCount) },
      (_, index) => row.getCell(index + 1).text.trim(),
    );
    if (values.some(Boolean)) rows.push(values);
  });
  return rows;
}

function normalizedHeader(value: string) {
  return value.replace(/^\uFEFF/, "").replace(/[\s_-]/g, "").toLowerCase();
}

function hasShipmentHeaders(rows: string[][]) {
  const headers = rows[0]?.map(normalizedHeader) || [];
  return [
    ["주문번호", "orderNo", "orderNumber"],
    ["택배사", "배송사", "택배회사", "courier", "courierCompany"],
    ["송장번호", "운송장번호", "trackingNo", "trackingNumber"],
  ].every((aliases) =>
    aliases.some((alias) => headers.includes(normalizedHeader(alias))),
  );
}

export async function readShippingWorkbook(buffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  for (const worksheet of workbook.worksheets) {
    const rows = worksheetRows(worksheet);
    if (hasShipmentHeaders(rows)) return rows;
  }

  throw new Error("주문번호, 택배사, 송장번호 열이 있는 시트를 찾지 못했습니다.");
}
