import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import ExcelJS from "exceljs";
import ts from "typescript";

// Exercise the real client helper in Node without loading React or Next.js.
// Only the client-only marker is stubbed; ExcelJS is the installed runtime.
const source = await readFile(new URL("../app/_lib/admin-shipment-spreadsheet.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
});
const helper = {};
new Function("require", "exports", outputText)((name) => {
  if (name === "client-only") return {};
  if (name === "exceljs") return ExcelJS;
  throw new Error(`Unexpected test import: ${name}`);
}, helper);

const sample = {
  amount: "42,800원",
  baseAddress: "테스트시 테스트로 1",
  buyerName: "테스트 주문자",
  buyerPhone: "01001234567",
  claimStatus: "없음",
  company: "본사몰",
  deliveryType: "일반배송",
  detailAddress: "테스트 101호",
  option: "옵션 A",
  orderAt: "2026.09.02 12:00",
  orderNo: "20260902-0001",
  productDetails: "테스트 상품 / 옵션 A / 2개\n두 번째 상품 / 1개",
  productName: "테스트 상품 외 1개",
  quantity: "3개",
  receiverName: "테스트 수령인",
  receiverPhone: "01009876543",
  status: "상품 준비중",
  zipCode: "03000",
};

const orderWorkbook = new ExcelJS.Workbook();
await orderWorkbook.xlsx.load(await helper.createOrderWorkbook([sample]));
const orderSheet = orderWorkbook.getWorksheet("주문목록");
assert.ok(orderSheet);
assert.equal(orderSheet.rowCount, 2);
assert.deepEqual(orderSheet.getRow(1).values.slice(1), [...helper.ORDER_SPREADSHEET_HEADERS]);
assert.deepEqual(orderSheet.getRow(2).values.slice(1), [
  sample.orderNo, sample.orderAt, sample.status, sample.deliveryType, sample.company,
  sample.productName, sample.option, 3, 42800, sample.claimStatus,
]);
assert.equal(orderSheet.getCell("A2").numFmt, "@");
assert.equal(orderSheet.getCell("H2").numFmt, "#,##0");
assert.equal(orderSheet.getCell("I2").numFmt, '#,##0"원"');
assert.equal(orderSheet.getCell("I2").alignment.horizontal, "right");
assert.equal(orderSheet.views[0].ySplit, 1);
assert.ok(orderSheet.autoFilter);
console.log("PASS: order XLSX preserves all ten fields with numeric quantities and amounts");

const edgeWorkbook = new ExcelJS.Workbook();
await edgeWorkbook.xlsx.load(await helper.createOrderWorkbook([
  { ...sample, productName: '=HYPERLINK("https://example.com","상품")', quantity: "0개", amount: "0원" },
  { ...sample, orderNo: "00001234", quantity: "1,234개", amount: "미정" },
]));
const edgeSheet = edgeWorkbook.getWorksheet("주문목록");
assert.equal(edgeSheet.getCell("F2").type, ExcelJS.ValueType.String);
assert.equal(edgeSheet.getCell("F2").formula, undefined);
assert.equal(edgeSheet.getCell("H2").value, 0);
assert.equal(edgeSheet.getCell("I2").value, 0);
assert.equal(edgeSheet.getCell("A3").value, "00001234");
assert.equal(edgeSheet.getCell("H3").value, 1234);
assert.equal(edgeSheet.getCell("I3").value, "미정");
const emptyWorkbook = new ExcelJS.Workbook();
await emptyWorkbook.xlsx.load(await helper.createOrderWorkbook([]));
assert.equal(emptyWorkbook.getWorksheet("주문목록").rowCount, 1);
console.log("PASS: zero values, textual identifiers, literal formula-like text and empty exports are safe");

const bytes = await helper.createShippingWorkbook([sample]);
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(bytes);
const sheet = workbook.getWorksheet("배송목록");
assert.ok(sheet, "Shipping worksheet exists");
assert.deepEqual(sheet.getRow(1).values.slice(1), [...helper.SHIPPING_SPREADSHEET_HEADERS]);
assert.equal(sheet.views[0].state, "frozen");
assert.equal(sheet.views[0].ySplit, 1);
assert.ok(sheet.autoFilter);
assert.equal(sheet.getCell("L2").value, 3);
assert.equal(sheet.getCell("M2").value, 42800);
for (const column of [1, 5, 7, 8, 16, 17]) {
  assert.equal(sheet.getRow(2).getCell(column).numFmt, "@", `Text format in column ${column}`);
}
for (const column of [16, 17]) {
  assert.equal(sheet.getRow(2).getCell(column).fill.fgColor.argb, "FFFFF4CC");
}
sheet.getCell("P2").value = "CJ대한통운";
sheet.getCell("Q2").value = "001234567890";
const parsed = await helper.readShippingWorkbook(await workbook.xlsx.writeBuffer());
assert.equal(parsed.length, 2);
assert.equal(parsed[1][0], sample.orderNo);
assert.equal(parsed[1][4], "01001234567");
assert.equal(parsed[1][7], "03000");
assert.equal(parsed[1][16], "001234567890");
console.log("PASS: styled XLSX export and re-import preserve identifiers and leading zeros");

const sparseWorkbook = new ExcelJS.Workbook();
sparseWorkbook.addWorksheet("안내").addRow(["송장 정보를 다음 시트에 입력하세요."]);
const sparseSheet = sparseWorkbook.addWorksheet("택배사 결과");
sparseSheet.getRow(1).values = ["주문 번호", "배송사", "운송장번호"];
sparseSheet.getRow(2).values = ["20260902-0001", "CJ대한통운", "001234567890"];
sparseSheet.getRow(10).values = ["20260902-0002", "우체국택배", "009876543210"];
const sparseRows = await helper.readShippingWorkbook(await sparseWorkbook.xlsx.writeBuffer());
assert.equal(sparseRows.length, 3);
assert.equal(sparseRows[2][0], "20260902-0002");
assert.equal(sparseRows[2][2], "009876543210");
console.log("PASS: blank rows, secondary worksheet and carrier header aliases are supported");

const invalidWorkbook = new ExcelJS.Workbook();
invalidWorkbook.addWorksheet("잘못된 양식").addRow(["상품명", "가격"]);
await assert.rejects(
  helper.readShippingWorkbook(await invalidWorkbook.xlsx.writeBuffer()),
  /주문번호, 택배사, 송장번호/,
);
await assert.rejects(helper.readShippingWorkbook(new ArrayBuffer(0)));
console.log("PASS: missing headers and invalid XLSX are rejected");

const downloadSource = await readFile(new URL("../app/_components/admin/admin-order-excel-download-button.tsx", import.meta.url), "utf8");
const importSource = await readFile(new URL("../app/_components/admin/admin-shipment-bulk-import.tsx", import.meta.url), "utf8");
assert.doesNotMatch(downloadSource + importSource + source, /csv/i);
assert.ok(importSource.includes('accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"'));
assert.ok(importSource.includes('if (!/\\.xlsx$/i.test(file.name))'));
assert.ok(downloadSource.includes('downloadXlsx("orders")'));
assert.ok(downloadSource.includes('downloadXlsx("shipping")'));
console.log("PASS: order and shipping downloads are XLSX-only; upload no longer accepts CSV");
