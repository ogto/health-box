export const DEALER_CONTRACT_VERSION = "V3";
export const DEALER_CONTRACT_TITLE = "건강창고 딜러몰 위탁영업 딜러 계약서";
export const DEALER_CONTRACT_PDF_URL = "/documents/dealer-agreement-v3.pdf";
export const DEALER_CONTRACT_PRINT_URL = "/dealer-apply/contract";
export const DEALER_CONTRACT_PAGE_COUNT = 7;
export const DEALER_CONTRACT_PRINT_MESSAGE = "health-box:dealer-contract-print-requested";
export const DEALER_CONTRACT_PAGES = Array.from(
  { length: DEALER_CONTRACT_PAGE_COUNT },
  (_, index) => `/documents/dealer-agreement-v3/page-${index + 1}.png`,
);
