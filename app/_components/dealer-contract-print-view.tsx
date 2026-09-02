"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DEALER_CONTRACT_PAGE_COUNT,
  DEALER_CONTRACT_PAGES,
  DEALER_CONTRACT_PDF_URL,
  DEALER_CONTRACT_PRINT_MESSAGE,
  DEALER_CONTRACT_TITLE,
  DEALER_CONTRACT_VERSION,
} from "@/lib/dealer-contract";

import styles from "../dealer-apply/contract/contract-print.module.css";

export function DealerContractPrintView() {
  const router = useRouter();
  const [loadedPages, setLoadedPages] = useState<number[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [printError, setPrintError] = useState("");
  const [printRequested, setPrintRequested] = useState(false);
  const ready = !loadError && loadedPages.length === DEALER_CONTRACT_PAGE_COUNT;

  function handlePrint() {
    if (!ready) return;
    setPrintError("");
    try {
      window.print();
      // A print dialog can be cancelled; the applicant confirms completion separately.
      const requestId = window.location.hash.slice(1);
      if (requestId && window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: DEALER_CONTRACT_PRINT_MESSAGE,
          version: DEALER_CONTRACT_VERSION,
          requestId,
        }, window.location.origin);
      }
      setPrintRequested(true);
    } catch {
      setPrintError("인쇄창을 열지 못했습니다. 인쇄 가능한 브라우저 또는 PC에서 다시 시도해주세요.");
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
        <div>
          <span className={styles.eyebrow}>계약서 확인·인쇄 · {DEALER_CONTRACT_VERSION}</span>
          <h1>{DEALER_CONTRACT_TITLE}</h1>
          <p>A4 전체 {DEALER_CONTRACT_PAGE_COUNT}쪽을 출력해주세요. 인쇄창에서 머리글·바닥글을 끄면 계약서만 출력됩니다.</p>
          <p>날인본 사진 확인을 통한 사전 승인 후, 계약서 원본 2부를 우편으로 교환하고 본사와 딜러가 각 1부씩 보관합니다.</p>
        </div>
        <div className={styles.actions}>
          <button className="button-primary" disabled={!ready} onClick={handlePrint} type="button">
            {ready ? `계약서 ${DEALER_CONTRACT_PAGE_COUNT}쪽 인쇄` : loadError ? "계약서 불러오기 실패" : `계약서 준비 중 (${loadedPages.length}/${DEALER_CONTRACT_PAGE_COUNT})`}
          </button>
          <a className="button-secondary" download={`${DEALER_CONTRACT_TITLE} ${DEALER_CONTRACT_VERSION}.pdf`} href={DEALER_CONTRACT_PDF_URL}>원본 PDF 저장</a>
          <button className="button-secondary" onClick={returnToApplication} type="button">신청 화면으로 돌아가기</button>
        </div>
        {loadError ? (
          <p className={styles.error} role="alert">계약서 일부를 불러오지 못했습니다. 새로고침 후 모든 페이지가 보이는지 확인해주세요.</p>
        ) : null}
        {printError ? <p className={styles.error} role="alert">{printError}</p> : null}
        {printRequested ? (
          <p className={styles.notice} role="status">출력을 마쳤다면 신청 화면으로 돌아가 ‘출력 완료’를 확인해주세요. 인쇄를 취소했다면 먼저 다시 출력해주세요.</p>
        ) : null}
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
