import type { Metadata } from "next";

import { DealerContractPrintView } from "../../_components/dealer-contract-print-view";

export const metadata: Metadata = {
  title: "딜러 계약서 확인·인쇄",
  description: "건강창고 딜러 계약서 원문 확인 및 인쇄",
  robots: { index: false, follow: false },
};

export default function DealerContractPage() {
  return <DealerContractPrintView />;
}
