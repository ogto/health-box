"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DEALER_CONTRACT_PAGE_COUNT,
  DEALER_CONTRACT_PAGES,
  DEALER_CONTRACT_PDF_URL,
  DEALER_CONTRACT_PREPARED_MESSAGE,
  DEALER_CONTRACT_TITLE,
  DEALER_CONTRACT_VERSION,
} from "@/lib/dealer-contract";

import styles from "../dealer-apply/contract/contract-print.module.css";

export function DealerContractPrintView() {
  const router = useRouter();
  const [loadedPages, setLoadedPages] = useState<number[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const ready = !loadError && loadedPages.length === DEALER_CONTRACT_PAGE_COUNT;

  function notifyApplication() {
    // Browsers cannot confirm physical printing or saving to disk; the applicant confirms separately.
    const requestId = window.location.hash.slice(1);
    if (requestId && window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: DEALER_CONTRACT_PREPARED_MESSAGE,
        version: DEALER_CONTRACT_VERSION,
        requestId,
      }, window.location.origin);
    }
  }

  function handlePrint() {
    if (!ready || saving) return;
    setActionError("");
    try {
      window.print();
      notifyApplication();
    } catch {
      setActionError("인쇄창을 열지 못했습니다. 인쇄 가능한 브라우저 또는 PC에서 다시 시도해주세요.");
    }
  }

  async function handleSave() {
    if (saving) return;
    setActionError("");
    setSaving(true);
    try {
      const response = await fetch(DEALER_CONTRACT_PDF_URL);
      if (!response.ok) throw new Error("Contract download failed");
      const file = await response.blob();
      if (!file.size || file.type !== "application/pdf") throw new Error("Invalid contract PDF");
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${DEALER_CONTRACT_TITLE}.pdf`;
      document.body.appendChild(link);
      try {
        link.click();
        notifyApplication();
      } finally {
        link.remove();
        // Give the browser time to consume the download before releasing the blob.
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch {
      setActionError("계약서를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  function returnToApplication() {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
    } else {
      router.push("/dealer-apply");
    }
  }

  return (
    <main className={styles.screen}>
      <header className={styles.toolbar}>
        <h1>{DEALER_CONTRACT_TITLE}</h1>
        <div className={styles.actions}>
          <button className="button-primary" disabled={!ready || saving} onClick={handlePrint} type="button">인쇄</button>
          <button aria-busy={saving} className="button-secondary" disabled={saving} onClick={handleSave} type="button">저장</button>
          <button className="button-secondary" disabled={saving} onClick={returnToApplication} type="button">신청 화면으로 돌아가기</button>
        </div>
        {!ready && !loadError ? <p role="status">계약서 준비 중 ({loadedPages.length}/{DEALER_CONTRACT_PAGE_COUNT})</p> : null}
        {saving ? <p role="status">저장할 파일을 준비하고 있습니다.</p> : null}
        {loadError ? (
          <p className={styles.error} role="alert">계약서 일부를 불러오지 못했습니다. 새로고침 후 모든 페이지가 보이는지 확인해주세요.</p>
        ) : null}
        {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}
      </header>

      <div className={styles.pages} aria-label={`계약서 원문 ${DEALER_CONTRACT_PAGE_COUNT}쪽`}>
        {DEALER_CONTRACT_PAGES.map((src, index) => (
          <div className={styles.page} key={src}>
            <Image
              alt={`${DEALER_CONTRACT_TITLE} ${index + 1}쪽`}
              height={3508}
              loading="eager"
              onError={() => setLoadError(true)}
              onLoad={() => setLoadedPages((pages) => pages.includes(index) ? pages : [...pages, index])}
              src={src}
              unoptimized
              width={2481}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
