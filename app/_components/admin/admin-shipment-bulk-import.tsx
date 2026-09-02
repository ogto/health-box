"use client";

import { useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";

import { bulkShipmentImportAction } from "../../_actions/health-box-admin";

type ShipmentImportRow = {
  courierCompany: string;
  orderNo: string;
  trackingNo: string;
};

type ParsedShipmentFile = {
  ignoredCount: number;
  rows: ShipmentImportRow[];
  sourceCount: number;
};

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 500;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (quoted) {
      if (character === '"' && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        currentCell += character;
      }
      continue;
    }

    if (character === '"' && currentCell === "") {
      quoted = true;
    } else if (character === ",") {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (character === "\n" || character === "\r") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      if (character === "\r" && nextCharacter === "\n") index += 1;
    } else {
      currentCell += character;
    }
  }

  if (quoted) {
    throw new Error("따옴표가 닫히지 않은 CSV입니다.");
  }
  if (currentCell || currentRow.length) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim()));
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").replace(/[\s_-]/g, "").toLowerCase();
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
}

function decodeCsv(buffer: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("euc-kr").decode(buffer);
  }
}

function buildImportData(text: string): ParsedShipmentFile {
  const csvRows = parseCsv(text);
  if (csvRows.length < 2) {
    throw new Error("처리할 주문 행이 없습니다.");
  }

  const headers = csvRows[0];
  const orderNoIndex = findHeaderIndex(headers, ["주문번호", "orderNo", "orderNumber"]);
  const courierIndex = findHeaderIndex(headers, ["택배사", "배송사", "택배회사", "courier", "courierCompany"]);
  const trackingIndex = findHeaderIndex(headers, ["송장번호", "운송장번호", "trackingNo", "trackingNumber"]);
  if ([orderNoIndex, courierIndex, trackingIndex].some((index) => index < 0)) {
    throw new Error("주문번호, 택배사, 송장번호 열이 모두 필요합니다. 배송용 엑셀 양식을 사용해주세요.");
  }

  const rows: ShipmentImportRow[] = [];
  const seenOrderNos = new Set<string>();
  const rowErrors: string[] = [];
  let ignoredCount = 0;

  csvRows.slice(1).forEach((csvRow, index) => {
    const sourceRowNumber = index + 2;
    const orderNo = (csvRow[orderNoIndex] || "").trim().replace(/^'/, "");
    const courierCompany = (csvRow[courierIndex] || "").trim();
    const trackingNo = (csvRow[trackingIndex] || "").trim().replace(/\s/g, "");

    if (!orderNo && !courierCompany && !trackingNo) return;
    if (!courierCompany && !trackingNo) {
      ignoredCount += 1;
      return;
    }
    if (!orderNo || !courierCompany || !trackingNo) {
      rowErrors.push(`${sourceRowNumber}행: 주문번호, 택배사, 송장번호를 모두 입력해주세요.`);
      return;
    }
    if (orderNo.length > 100 || courierCompany.length > 100 || trackingNo.length > 100) {
      rowErrors.push(`${sourceRowNumber}행: 입력값은 각각 100자 이하여야 합니다.`);
      return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(trackingNo)) {
      rowErrors.push(`${sourceRowNumber}행: 송장번호는 영문, 숫자, 하이픈(-)만 사용할 수 있습니다.`);
      return;
    }
    if (seenOrderNos.has(orderNo)) {
      rowErrors.push(`${sourceRowNumber}행: 주문번호 ${orderNo}가 중복되었습니다.`);
      return;
    }

    seenOrderNos.add(orderNo);
    rows.push({ courierCompany, orderNo, trackingNo });
  });

  if (rowErrors.length) {
    const summary = rowErrors.slice(0, 3).join(" / ");
    throw new Error(`${summary}${rowErrors.length > 3 ? ` 외 ${rowErrors.length - 3}건` : ""}`);
  }
  if (!rows.length) {
    throw new Error("택배사와 송장번호를 입력한 주문이 없습니다.");
  }
  if (rows.length > MAX_ROWS) {
    throw new Error(`한 번에 최대 ${MAX_ROWS}건까지 처리할 수 있습니다.`);
  }

  return { ignoredCount, rows, sourceCount: csvRows.length - 1 };
}

function ShipmentImportSubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();

  return (
    <button className="admin-button" disabled={pending || count === 0} type="submit">
      {pending ? "송장 등록 중..." : `${count}건 배송중 처리`}
    </button>
  );
}

export function AdminShipmentBulkImport({ redirectTo }: { redirectTo: string }) {
  const [fileName, setFileName] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParsedShipmentFile | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function resetFile() {
    setFileName("");
    setError("");
    setParsed(null);
  }

  function closeDialog() {
    setOpen(false);
    resetFile();
  }

  async function handleFile(file: File | undefined) {
    resetFile();
    if (!file) return;
    setFileName(file.name);

    if (!/\.csv$/i.test(file.name)) {
      setError("CSV 파일만 등록할 수 있습니다. 엑셀에서 CSV UTF-8 형식으로 저장해주세요.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    try {
      setParsed(buildImportData(decodeCsv(await file.arrayBuffer())));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "CSV 파일을 읽지 못했습니다.");
    }
  }

  return (
    <>
      <button className="admin-button small" onClick={() => setOpen(true)} type="button">
        송장 일괄 등록
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button aria-label="송장 일괄 등록 닫기" className="admin-info-dialog-backdrop" onClick={closeDialog} type="button" />
              <div aria-modal="true" className="admin-info-dialog admin-shipment-import-dialog" role="dialog">
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <strong>송장 일괄 등록</strong>
                    <p>배송용 엑셀의 택배사와 송장번호를 채운 뒤 CSV 파일을 등록하세요.</p>
                  </div>
                  <button aria-label="송장 일괄 등록 닫기" className="admin-info-dialog-close" onClick={closeDialog} type="button">×</button>
                </div>

                <form action={bulkShipmentImportAction} className="admin-info-dialog-body admin-shipment-import-form">
                  <input name="redirectTo" type="hidden" value={redirectTo} />
                  <input name="shipmentRows" type="hidden" value={JSON.stringify(parsed?.rows || [])} />

                  <ol className="admin-shipment-import-guide">
                    <li>현재 조건의 <strong>배송용 엑셀</strong>을 내려받습니다.</li>
                    <li>마지막의 <strong>택배사</strong>, <strong>송장번호</strong> 열을 채웁니다.</li>
                    <li>CSV UTF-8 형식으로 저장한 파일을 아래에 등록합니다.</li>
                  </ol>

                  <label className="admin-shipment-import-dropzone">
                    <strong>{fileName || "송장 CSV 파일 선택"}</strong>
                    <span>최대 500건 · 2MB · 비어 있는 송장 행은 제외</span>
                    <input accept=".csv,text/csv" onChange={(event) => void handleFile(event.target.files?.[0])} type="file" />
                  </label>

                  {error ? <div className="admin-shipment-import-error" role="alert">{error}</div> : null}

                  {parsed ? (
                    <div className="admin-shipment-import-summary">
                      <div>
                        <strong>처리 예정 {parsed.rows.length}건</strong>
                        <span>전체 {parsed.sourceCount}행 · 미입력 제외 {parsed.ignoredCount}행</span>
                      </div>
                      <div className="admin-shipment-import-preview">
                        {parsed.rows.slice(0, 5).map((row) => (
                          <div key={row.orderNo}>
                            <strong>{row.orderNo}</strong>
                            <span>{row.courierCompany} · {row.trackingNo}</span>
                          </div>
                        ))}
                        {parsed.rows.length > 5 ? <p>외 {(parsed.rows.length - 5).toLocaleString("ko-KR")}건</p> : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="admin-order-bulk-dialog-actions">
                    <button className="admin-button secondary" onClick={closeDialog} type="button">닫기</button>
                    <ShipmentImportSubmitButton count={parsed?.rows.length || 0} />
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
