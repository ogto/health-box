export const ADMIN_PERMISSION_GROUPS = [
  {
    label: "기본",
    description: "관리자 첫 화면과 운영 현황을 확인합니다.",
    items: [{ code: "DASHBOARD_VIEW", label: "대시보드 조회" }],
  },
  {
    label: "주문·배송",
    description: "주문을 확인하고 배송·취소 업무를 처리합니다.",
    items: [
      { code: "ORDER_VIEW", label: "주문 조회" },
      { code: "ORDER_PROCESS", label: "배송·취소 처리" },
    ],
  },
  {
    label: "상품·카테고리",
    description: "상품과 분류 정보를 조회하거나 변경합니다.",
    items: [
      { code: "PRODUCT_VIEW", label: "상품 조회" },
      { code: "PRODUCT_MANAGE", label: "상품 등록·수정" },
      { code: "CATEGORY_MANAGE", label: "카테고리 관리" },
    ],
  },
  {
    label: "회원·딜러",
    description: "회원과 딜러 신청을 확인하고 승인·반려합니다.",
    items: [
      { code: "MEMBER_VIEW", label: "회원 조회" },
      { code: "MEMBER_MANAGE", label: "회원 승인·반려" },
      { code: "DEALER_VIEW", label: "딜러 조회" },
      { code: "DEALER_MANAGE", label: "딜러 승인·반려" },
    ],
  },
  {
    label: "매출·콘텐츠",
    description: "매출 자료와 홈페이지 콘텐츠를 관리합니다.",
    items: [
      { code: "SALES_VIEW", label: "매출·정산 조회" },
      { code: "STOREFRONT_MANAGE", label: "홈페이지 관리" },
      { code: "NOTICE_MANAGE", label: "공지 관리" },
    ],
  },
  {
    label: "조직 관리",
    description: "직원 권한과 관리자 활동 이력을 관리합니다.",
    items: [
      { code: "STAFF_MANAGE", label: "직원·권한 관리" },
      { code: "AUDIT_LOG_VIEW", label: "활동 로그 조회" },
    ],
  },
] as const;

export const ALL_ADMIN_PERMISSION_CODES = ADMIN_PERMISSION_GROUPS.flatMap((group) =>
  group.items.map((item) => item.code),
);

export const DEALER_ADMIN_PERMISSION_CODES = [
  "DASHBOARD_VIEW",
  "ORDER_VIEW",
  "ORDER_PROCESS",
  "SALES_VIEW",
  "MEMBER_VIEW",
  "MEMBER_MANAGE",
  "STOREFRONT_MANAGE",
  "NOTICE_MANAGE",
  "STAFF_MANAGE",
  "AUDIT_LOG_VIEW",
] as const;

export const ADMIN_PERMISSION_LABELS = Object.fromEntries(
  ADMIN_PERMISSION_GROUPS.flatMap((group) => group.items.map((item) => [item.code, item.label])),
) as Record<string, string>;
