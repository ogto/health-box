import { notices, products } from "./store-data";

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export type AdminTone = "blue" | "cyan" | "green" | "gold" | "violet" | "rose";

export type AdminMetric = {
  label: string;
  value: string;
  hint: string;
  tone: AdminTone;
};

export type AdminShortcut = {
  href: string;
  title: string;
  description: string;
};

export const dashboardMetrics: AdminMetric[] = [
  { label: "오늘 주문", value: "48건", hint: "결제완료 32 · 배송준비 16", tone: "blue" },
  { label: "승인 대기 회원", value: "12명", hint: "딜러 신청 3 · 일반회원 9", tone: "cyan" },
  { label: "오늘 출고 예정", value: "27건", hint: "당일출고 기준 오전 집계", tone: "green" },
  { label: "이번 달 매출", value: formatWon(42800000), hint: "반품 차감 전 추정치", tone: "gold" },
];

export const dashboardShortcuts: AdminShortcut[] = [
  {
    href: "/admin/storefront",
    title: "홈페이지 관리",
    description: "로고, 메인 비주얼, 공통 배너, 메타 정보 관리",
  },
  {
    href: "/admin/products",
    title: "상품 관리",
    description: "노출 상태, 추천 세트, 상세 구성 점검",
  },
  {
    href: "/admin/orders",
    title: "주문 관리",
    description: "주문 상태, 출고 예정, 반품 요청 확인",
  },
  {
    href: "/admin/sales",
    title: "매출 관리",
    description: "회원사별 매출, 채널별 흐름, 월간 실적 확인",
  },
  {
    href: "/admin/members",
    title: "회원 관리",
    description: "승인 대기, 회원 등급, 딜러 관리자 검토",
  },
  {
    href: "/admin/dealers",
    title: "딜러 구조",
    description: "본사-본몰-딜러몰 확장 구조 점검",
  },
];

export const recentOrders = [
  {
    number: "HB260422-1024",
    member: "웰니스강남",
    items: "데일리 멀티비타민 코어 외 2건",
    amount: formatWon(438000),
    status: "배송 준비",
    statusTone: "blue" as const,
    date: "2026.04.22 10:42",
  },
  {
    number: "HB260422-1018",
    member: "라이프케어몰",
    items: "유산균 밸런스 박스",
    amount: formatWon(189000),
    status: "결제 완료",
    statusTone: "cyan" as const,
    date: "2026.04.22 09:55",
  },
  {
    number: "HB260422-1009",
    member: "건강창고 회원",
    items: "오메가 · 루테인 더블 케어",
    amount: formatWon(124000),
    status: "출고 완료",
    statusTone: "green" as const,
    date: "2026.04.22 08:31",
  },
  {
    number: "HB260421-0988",
    member: "바이오파트너",
    items: "프로틴 벌크 뉴트리션 외 1건",
    amount: formatWon(312000),
    status: "반품 검토",
    statusTone: "rose" as const,
    date: "2026.04.21 17:12",
  },
] as const;

export const approvalQueue = [
  {
    name: "서울 강남 웰니스몰 운영자",
    type: "딜러 신청",
    submittedAt: "2026.04.22 09:20",
    note: "소속 조직: 웰니스강남 딜러몰 · 하위 회원 148명 관리 권한 요청",
  },
  {
    name: "이서현",
    type: "일반 회원",
    submittedAt: "2026.04.22 08:54",
    note: "소속 조직: 웰니스강남 딜러몰 · 일반 회원 승인 요청",
  },
  {
    name: "라이프케어 파트너스",
    type: "딜러 신청",
    submittedAt: "2026.04.21 16:03",
    note: "소속 조직: 라이프케어 파트너몰 · 지역 딜러몰 운영 신청",
  },
] as const;

export const memberApprovalQueue = approvalQueue.filter((item) => item.type !== "딜러 신청");

export const dealerApprovalQueue = approvalQueue.filter((item) => item.type === "딜러 신청");

export const inventoryAlerts = [
  {
    title: "데일리 멀티비타민 코어",
    detail: "대표 상품 · 메인 히어로 노출중",
    level: "재고 여유 6일",
    tone: "gold" as const,
  },
  {
    title: "유산균 밸런스 박스",
    detail: "재구매 비중 상위",
    level: "입고 예정 2026.04.24",
    tone: "cyan" as const,
  },
  {
    title: "프로틴 벌크 뉴트리션",
    detail: "묶음 주문 비중 높음",
    level: "대용량 포장 14개 잔여",
    tone: "blue" as const,
  },
] as const;

export const latestAdminNotices = notices.slice(0, 4).map((notice, index) => ({
  ...notice,
  status: index === 0 ? "상단 고정" : "게시중",
  statusTone: index === 0 ? ("blue" as const) : ("green" as const),
  previewHref: `/notice/${notice.slug}`,
}));

export const productMetrics: AdminMetric[] = [
  {
    label: "등록 상품",
    value: `${products.length}개`,
    hint: "현재 노출중인 대표 카탈로그 기준",
    tone: "blue",
  },
  { label: "베스트 노출", value: "4개", hint: "메인 베스트 영역과 연결", tone: "cyan" },
  { label: "추천 세트", value: "3개", hint: "메인 추천/기획전 묶음 운영", tone: "green" },
  { label: "상세 점검 필요", value: "2건", hint: "상세 이미지/재고 메모 확인", tone: "gold" },
];

export const managedProducts = products.map((product, index) => ({
  id: `PRD-00${index + 1}`,
  ...product,
  adminHref: `/admin/products/${product.slug}`,
  displayStatus:
    index === 0
      ? "대표 상품"
      : index === 1
        ? "재구매 관리"
        : index === 2
          ? "묶음 구성"
          : "추천 세트",
  stockNote:
    index === 0
      ? "메인 히어로 노출"
      : index === 1
        ? "재고 확인 필요"
        : index === 2
        ? "대용량 잔여 14개"
          : "프로모션 연동중",
  publishStatus:
    index === 0 ? "메인 노출중" : index === 1 ? "정상 판매" : index === 2 ? "재고 주의" : "추천 운영",
  publishTone:
    index === 0
      ? ("blue" as const)
      : index === 1
        ? ("green" as const)
        : index === 2
          ? ("gold" as const)
          : ("cyan" as const),
  inventoryCount: index === 0 ? "84개" : index === 1 ? "36개" : index === 2 ? "14개" : "52개",
  monthlySales:
    index === 0
      ? formatWon(8400000)
      : index === 1
        ? formatWon(5100000)
        : index === 2
          ? formatWon(6300000)
          : formatWon(4700000),
  detailImageCount: product.detailSections.length,
  updatedAt:
    index === 0
      ? "2026.04.22 09:40"
      : index === 1
        ? "2026.04.22 08:10"
        : index === 2
          ? "2026.04.21 17:20"
          : "2026.04.21 14:35",
  exposureZones:
    index === 0
      ? ["메인 비주얼", "베스트상품"]
      : index === 1
        ? ["베스트상품", "운영 관리"]
        : index === 2
          ? ["추천상품", "묶음 제안"]
          : ["추천상품", "기획전"],
  editorNote:
    index === 0
      ? "메인 히어로 카피와 함께 유지"
      : index === 1
        ? "재구매 안내 문구와 재고 메모 우선 점검"
        : index === 2
          ? "대용량/묶음 구성 강조 필요"
          : "추천 세트 배너와 연결중",
  statusTone:
    index === 0
      ? ("blue" as const)
      : index === 1
        ? ("gold" as const)
        : index === 2
          ? ("cyan" as const)
          : ("green" as const),
  previewHref: `/product/${product.slug}`,
}));

export function getManagedProductBySlug(slug: string) {
  return managedProducts.find((product) => product.slug === slug);
}

export const productCategoryFilters = [
  { label: "전체 상품", count: `${managedProducts.length}` },
  { label: "메인 노출", count: "4" },
  { label: "재구매 관리", count: "1" },
  { label: "추천 세트", count: "2" },
  { label: "상세 점검", count: "2" },
] as const;

export const productOperatorNotes = [
  "대표 상품은 메인 비주얼 카피와 썸네일 톤을 함께 관리합니다.",
  "재구매 비중이 높은 상품은 안내 문구와 재고 메모를 우선 확인합니다.",
  "묶음 구성 상품은 재고 수량과 세트 노출 위치를 함께 점검합니다.",
  "추천 세트 상품은 기획전 배너와 동일한 혜택 문구를 유지합니다.",
] as const;

export const productChecklist = [
  {
    title: "썸네일/상세 이미지",
    detail: "썸네일 비율, 상세 이미지 순서, 팝업 확대용 대표컷 확인",
    tone: "cyan" as const,
    label: "주간 점검",
  },
  {
    title: "회원가 노출 문구",
    detail: "비회원 가격 비노출 정책과 동일한 문구 유지",
    tone: "blue" as const,
    label: "상시 관리",
  },
  {
    title: "기획전 및 추천 연동",
    detail: "메인/기획전/추천상품 연결 상태와 노출 위치 검수",
    tone: "green" as const,
    label: "운영중",
  },
] as const;

export const productUploadFlow = [
  {
    title: "기본 정보 입력",
    description: "브랜드, 상품명, 카테고리, 짧은 소개 문구를 먼저 정리합니다.",
  },
  {
    title: "썸네일 / 상세 이미지 등록",
    description: "목록용 썸네일과 상세 본문 이미지를 구분해서 등록합니다.",
  },
  {
    title: "회원가 / 노출 설정",
    description: "회원 전용가 문구와 메인/추천/기획전 노출 위치를 지정합니다.",
  },
  {
    title: "재고 / 배송 정책 검수",
    description: "출고 가능 여부와 묶음 구성, 배송 문구를 점검합니다.",
  },
] as const;

export const uploadMediaGuide = [
  "목록 썸네일: 1:1 비율 권장, 밝은 배경 기준",
  "메인 썸네일: 1600px 이상, 제품 실루엣이 또렷한 이미지",
  "상세 본문 이미지: 1200px 이상, 세로형 상세 구성 권장",
  "상품 확대 팝업용: 썸네일과 다른 각도의 클로즈업 이미지 권장",
] as const;

export const productExposureSlots = [
  { title: "메인 비주얼", value: "1개 운영중", tone: "blue" as const },
  { title: "베스트상품", value: "4개 운영중", tone: "cyan" as const },
  { title: "추천상품", value: "4개 운영중", tone: "green" as const },
  { title: "기획전 배너", value: "2개 연결중", tone: "gold" as const },
] as const;

export const orderMetrics: AdminMetric[] = [
  { label: "결제 완료", value: "32건", hint: "오늘 00:00 기준 신규 주문", tone: "blue" },
  { label: "배송 준비", value: "16건", hint: "포장 및 송장 입력 대기", tone: "cyan" },
  { label: "주문 회원사", value: "6곳", hint: "직영 · 딜러 · 제휴 회원사 포함", tone: "green" },
  { label: "취소/반품", value: "4건", hint: "회원사 정산 차감 반영 필요", tone: "rose" },
];

export const orderRows = [
  {
    number: "HB260422-1024",
    company: "웰니스강남",
    companyType: "딜러 회원사",
    buyer: "김현우",
    buyerType: "회원사 관리자",
    items: "데일리 멀티비타민 코어 외 2건",
    amount: formatWon(438000),
    status: "배송 준비",
    tone: "blue" as const,
    placedAt: "2026.04.22 10:42",
  },
  {
    number: "HB260422-1018",
    company: "건강창고 직영 회원",
    companyType: "직영 회원사",
    buyer: "이서현",
    buyerType: "일반 회원",
    items: "유산균 밸런스 박스",
    amount: formatWon(189000),
    status: "결제 완료",
    tone: "cyan" as const,
    placedAt: "2026.04.22 09:55",
  },
  {
    number: "HB260422-1009",
    company: "라이프케어몰",
    companyType: "제휴 회원사",
    buyer: "최수민",
    buyerType: "회원사 구매담당",
    items: "오메가 · 루테인 더블 케어",
    amount: formatWon(124000),
    status: "출고 완료",
    tone: "green" as const,
    placedAt: "2026.04.22 08:31",
  },
  {
    number: "HB260421-0988",
    company: "건강창고 직영 회원",
    companyType: "직영 회원사",
    buyer: "김지현",
    buyerType: "일반 회원",
    items: "프로틴 벌크 뉴트리션 외 1건",
    amount: formatWon(312000),
    status: "반품 요청",
    tone: "rose" as const,
    placedAt: "2026.04.21 17:12",
  },
  {
    number: "HB260421-0979",
    company: "바이오파트너",
    companyType: "딜러 회원사",
    buyer: "정민수",
    buyerType: "회원사 구매담당",
    items: "데일리 멀티비타민 코어",
    amount: formatWon(96000),
    status: "송장 입력 대기",
    tone: "gold" as const,
    placedAt: "2026.04.21 15:24",
  },
] as const;

export const orderCompanySummary = [
  {
    company: "웰니스강남",
    type: "딜러 회원사",
    orders: "12건",
    amount: formatWon(4380000),
    note: "배송 준비 4건 · 당일 출고 우선",
    tone: "blue" as const,
  },
  {
    company: "건강창고 직영 회원",
    type: "직영 회원사",
    orders: "18건",
    amount: formatWon(5280000),
    note: "일반 회원 주문 중심 · 반품 2건",
    tone: "cyan" as const,
  },
  {
    company: "라이프케어몰",
    type: "제휴 회원사",
    orders: "7건",
    amount: formatWon(2140000),
    note: "반복 구매 상품 비중 높음",
    tone: "green" as const,
  },
  {
    company: "바이오파트너",
    type: "딜러 회원사",
    orders: "5건",
    amount: formatWon(960000),
    note: "송장 입력 대기 1건",
    tone: "gold" as const,
  },
] as const;

export const memberMetrics: AdminMetric[] = [
  { label: "전체 회원", value: "1,277명", hint: "활성 회원 기준", tone: "blue" },
  { label: "활성 딜러몰", value: "3개", hint: "운영중 기준", tone: "cyan" },
  { label: "이번 달 주문", value: "1,842건", hint: "회원 주문 합계", tone: "green" },
  { label: "승인 대기", value: "9명", hint: "가입 승인 요청", tone: "gold" },
];

export const memberRows = [
  {
    name: "이서현",
    segment: "일반 회원",
    dealer: "웰니스강남",
    organization: "서울 강남 딜러몰",
    dealerManager: "서울 강남 웰니스몰 운영자",
    joinedAt: "2026.04.19",
    orders: "3건",
    purchases: formatWon(189000),
    status: "활성 회원",
    tone: "green" as const,
  },
  {
    name: "김현우",
    segment: "일반 회원",
    dealer: "웰니스강남",
    organization: "서울 강남 딜러몰",
    dealerManager: "서울 강남 웰니스몰 운영자",
    joinedAt: "2026.04.18",
    orders: "6건",
    purchases: formatWon(438000),
    status: "활성 회원",
    tone: "cyan" as const,
  },
  {
    name: "김지현",
    segment: "일반 회원",
    dealer: "라이프케어 파트너몰",
    organization: "라이프 밸런스 딜러몰",
    dealerManager: "라이프케어몰 운영자",
    joinedAt: "2026.04.13",
    orders: "4건",
    purchases: formatWon(312000),
    status: "활성 회원",
    tone: "cyan" as const,
  },
  {
    name: "최수민",
    segment: "일반 회원",
    dealer: "라이프케어 파트너몰",
    organization: "제휴 딜러몰",
    dealerManager: "라이프케어몰 운영자",
    joinedAt: "2026.04.12",
    orders: "5건",
    purchases: formatWon(124000),
    tone: "blue" as const,
    status: "활성 회원",
  },
  {
    name: "박수진",
    segment: "일반 회원",
    dealer: "바이오파트너",
    organization: "바이오파트너 딜러몰",
    dealerManager: "정민수",
    joinedAt: "2026.04.11",
    orders: "9건",
    purchases: formatWon(960000),
    status: "활성 회원",
    tone: "gold" as const,
  },
] as const;

export const memberAffiliationSummary = [
  {
    label: "웰니스강남 딜러몰",
    count: "438명",
    note: "딜러 관리자 서울 강남 웰니스몰 운영자",
    tone: "blue" as const,
  },
  {
    label: "라이프케어 파트너몰",
    count: "421명",
    note: "딜러 관리자 라이프케어몰 운영자",
    tone: "cyan" as const,
  },
  {
    label: "바이오파트너 딜러몰",
    count: "418명",
    note: "딜러 관리자 정민수",
    tone: "gold" as const,
  },
] as const;

export const noticeMetrics: AdminMetric[] = [
  { label: "게시중 공지", value: `${notices.length}건`, hint: "현재 공개 상태 기준", tone: "blue" },
  { label: "상단 고정", value: "1건", hint: "운영 정책 공지 유지", tone: "cyan" },
  { label: "이번 달 등록", value: "4건", hint: "테스트 운영 포함", tone: "green" },
  { label: "임시 저장", value: "2건", hint: "후속 확장 관련 메모", tone: "gold" },
];

export const managedNotices = notices.map((notice, index) => ({
  ...notice,
  status: index === 0 ? "상단 고정" : "게시중",
  tone: index === 0 ? ("blue" as const) : ("green" as const),
  updatedAt: index === 0 ? "2026.04.22 09:10" : "2026.04.22 08:40",
  editor: index === 0 ? "운영팀" : index === 1 ? "콘텐츠팀" : index === 2 ? "상품팀" : "전략팀",
  visibility: index === 0 ? "전체 공개" : "회원 공개",
  adminHref: `/admin/notices/${notice.slug}`,
  previewHref: `/notice/${notice.slug}`,
}));

export function getManagedNoticeBySlug(slug: string) {
  return managedNotices.find((notice) => notice.slug === slug);
}

export const dealerMetrics: AdminMetric[] = [
  { label: "전체 딜러몰", value: "3개", hint: "활성 기준", tone: "blue" },
  { label: "전체 회원", value: "1,277명", hint: "딜러몰 소속 회원", tone: "cyan" },
  { label: "누적 주문", value: "4,381건", hint: "딜러몰 합산", tone: "green" },
  { label: "승인 대기", value: "3건", hint: "신규 딜러 신청", tone: "gold" },
];

export const dealerRows = [
  {
    name: "웰니스강남",
    type: "딜러몰",
    joinedAt: "2026.03.02",
    orderCount: "1,582건",
    totalSales: formatWon(18420000),
    status: "검수중",
    tone: "blue" as const,
  },
  {
    name: "라이프케어 파트너몰",
    type: "딜러몰",
    joinedAt: "2026.03.08",
    orderCount: "1,447건",
    totalSales: formatWon(16280000),
    status: "운영중",
    tone: "cyan" as const,
  },
  {
    name: "바이오파트너",
    type: "딜러몰",
    joinedAt: "2026.03.14",
    orderCount: "1,352건",
    totalSales: formatWon(14970000),
    status: "차감 반영",
    tone: "gold" as const,
  },
] as const;

export const organizationRows = [
  {
    name: "노타이틀 본사",
    type: "본사",
    manager: "본사 운영팀 3명",
    scope: "딜러몰 3개 · 전체 회원 1,277명 총괄",
    tone: "blue" as const,
  },
  {
    name: "건강창고 운영본부",
    type: "브랜드 운영",
    manager: "건강창고 관리자 2명",
    scope: "상품 · 공지 · 회원 운영 정책 관리",
    tone: "green" as const,
  },
] as const;

export const dealerAdminRows = [
  {
    name: "서울 강남 웰니스몰 운영자",
    dealer: "웰니스강남",
    role: "딜러 관리자",
    members: "438명",
    orders: "74건",
    status: "승인 대기",
    tone: "gold" as const,
  },
  {
    name: "라이프케어몰 운영자",
    dealer: "라이프케어 파트너몰",
    role: "딜러 관리자",
    members: "421명",
    orders: "51건",
    status: "운영중",
    tone: "cyan" as const,
  },
  {
    name: "정민수",
    dealer: "바이오파트너",
    role: "딜러 관리자",
    members: "418명",
    orders: "33건",
    status: "운영중",
    tone: "blue" as const,
  },
] as const;

export const dealerMemberSummary = [
  {
    dealer: "웰니스강남",
    parent: "노타이틀 본사",
    members: "이서현, 김현우 외 436명",
    tone: "blue" as const,
  },
  {
    dealer: "라이프케어 파트너몰",
    parent: "노타이틀 본사",
    members: "김지현, 최수민 외 419명",
    tone: "cyan" as const,
  },
  {
    dealer: "바이오파트너",
    parent: "노타이틀 본사",
    members: "박수진 외 417명",
    tone: "gold" as const,
  },
] as const;

export const settlementMetrics: AdminMetric[] = [
  { label: "이번 달 정산 대상", value: formatWon(42800000), hint: "총 매출 기준", tone: "blue" },
  { label: "정산 회원사", value: "4곳", hint: "직영 포함 회원사 단위 집계", tone: "cyan" },
  { label: "검수중 차감", value: formatWon(1200000), hint: "반품/취소 예상분", tone: "rose" },
  { label: "정산 예정일", value: "매월 5일", hint: "검수 완료 후 확정", tone: "green" },
];

export const settlementRows = [
  {
    month: "2026년 4월",
    company: "웰니스강남",
    companyType: "딜러 회원사",
    gross: formatWon(12800000),
    deduction: formatWon(320000),
    estimated: formatWon(3120000),
    policy: "고정비율 25%",
    status: "검수중",
    tone: "gold" as const,
  },
  {
    month: "2026년 4월",
    company: "건강창고 직영 회원",
    companyType: "직영 회원사",
    gross: formatWon(15400000),
    deduction: formatWon(410000),
    estimated: formatWon(3747500),
    policy: "고정비율 25%",
    status: "확정",
    tone: "green" as const,
  },
  {
    month: "2026년 4월",
    company: "라이프케어몰",
    companyType: "제휴 회원사",
    gross: formatWon(9200000),
    deduction: formatWon(210000),
    estimated: formatWon(2247500),
    policy: "고정비율 25%",
    status: "검수중",
    tone: "cyan" as const,
  },
  {
    month: "2026년 4월",
    company: "바이오파트너",
    companyType: "딜러 회원사",
    gross: formatWon(5400000),
    deduction: formatWon(260000),
    estimated: formatWon(1285000),
    policy: "고정비율 25%",
    status: "차감 반영",
    tone: "rose" as const,
  },
] as const;

export const settlementCompanySummary = [
  {
    company: "웰니스강남",
    type: "딜러 회원사",
    amount: formatWon(3120000),
    note: "반품 1건 차감 반영 예정",
    tone: "gold" as const,
  },
  {
    company: "건강창고 직영 회원",
    type: "직영 회원사",
    amount: formatWon(3747500),
    note: "직영 회원 주문 기준 확정 완료",
    tone: "green" as const,
  },
  {
    company: "라이프케어몰",
    type: "제휴 회원사",
    amount: formatWon(2247500),
    note: "반복 구매 상품 비중 높아 재검토 중",
    tone: "cyan" as const,
  },
  {
    company: "바이오파트너",
    type: "딜러 회원사",
    amount: formatWon(1285000),
    note: "송장 지연/반품 건 차감 반영",
    tone: "rose" as const,
  },
] as const;

export const salesMetrics: AdminMetric[] = [
  { label: "이번 달 매출", value: formatWon(42800000), hint: "회원사 전체 주문 기준", tone: "blue" },
  { label: "예상 정산액", value: formatWon(10400000), hint: "고정비율 25% 기준", tone: "cyan" },
  { label: "차감 검수", value: formatWon(1200000), hint: "반품 · 취소 예상분", tone: "rose" },
  { label: "활성 회원사", value: "4곳", hint: "매출 발생 회원사", tone: "green" },
];

export const salesCompanyRows = [
  {
    company: "웰니스강남",
    type: "딜러 회원사",
    parent: "건강창고 본몰",
    sales: formatWon(12800000),
    orders: "74건",
    deduction: formatWon(320000),
    estimated: formatWon(3120000),
    trend: "검수중",
    tone: "blue" as const,
  },
  {
    company: "건강창고 직영 회원",
    type: "직영 회원사",
    parent: "건강창고 본몰",
    sales: formatWon(15400000),
    orders: "96건",
    deduction: formatWon(410000),
    estimated: formatWon(3747500),
    trend: "확정",
    tone: "green" as const,
  },
  {
    company: "라이프케어 파트너몰",
    type: "제휴 회원사",
    parent: "건강창고 본몰",
    sales: formatWon(9200000),
    orders: "51건",
    deduction: formatWon(210000),
    estimated: formatWon(2247500),
    trend: "검수중",
    tone: "cyan" as const,
  },
  {
    company: "바이오파트너",
    type: "딜러 회원사",
    parent: "건강창고 본몰",
    sales: formatWon(5400000),
    orders: "33건",
    deduction: formatWon(260000),
    estimated: formatWon(1285000),
    trend: "차감 반영",
    tone: "gold" as const,
  },
] as const;

export const salesChannelRows = [
  {
    label: "직영 회원사",
    sales: formatWon(15400000),
    ratio: formatWon(3747500),
    note: "건강창고 본몰 직영 회원 기준",
    tone: "green" as const,
  },
  {
    label: "딜러 회원사 주문",
    sales: formatWon(18200000),
    ratio: formatWon(4405000),
    note: "웰니스강남, 바이오파트너 등",
    tone: "blue" as const,
  },
  {
    label: "제휴 회원사 주문",
    sales: formatWon(9200000),
    ratio: formatWon(2247500),
    note: "라이프케어 파트너몰 기준",
    tone: "cyan" as const,
  },
] as const;

export const salesMonthlyTrend = [
  { month: "1월", sales: formatWon(29600000), width: 58 },
  { month: "2월", sales: formatWon(34600000), width: 68 },
  { month: "3월", sales: formatWon(38200000), width: 76 },
  { month: "4월", sales: formatWon(42800000), width: 88 },
] as const;

export const settingsSections = [
  {
    title: "회원 승인 정책",
    description: "비회원 가격 비노출과 승인 후 구매 가능 구조를 유지합니다.",
    items: [
      "비회원에게는 가격과 장바구니 기능을 노출하지 않습니다.",
      "회원 승인 완료 후에만 상세 가격과 주문 기능을 활성화합니다.",
      "딜러몰 확장 시에도 동일한 승인 정책을 공통 적용합니다.",
    ],
  },
  {
    title: "상품 노출 정책",
    description: "메인 베스트, 추천상품, 기획전 노출 영역을 운영팀이 직접 관리합니다.",
    items: [
      "대표 상품은 베스트 영역과 상세 썸네일을 함께 관리합니다.",
      "추천상품은 루틴별 묶음 제안 기준으로 편성합니다.",
      "기획전 배너는 시즌/재고 상황에 따라 별도 운영합니다.",
    ],
  },
  {
    title: "조직 확장 정책",
    description: "본사-건강창고-딜러몰 구조로 단계적 확장을 전제로 구성합니다.",
    items: [
      "상위 조직이 하위 몰을 관리하는 중앙 통제 구조를 유지합니다.",
      "딜러 관리자 권한은 회원/주문 조회 범위로 우선 제한합니다.",
      "세분 권한은 추후 필요 시 DB 구조 기반으로 확장합니다.",
    ],
  },
  {
    title: "정산 운영 정책",
    description: "초기에는 일괄 고정비율, 이후 상품별 수익률 세분화를 목표로 합니다.",
    items: [
      "MVP 단계에서는 확인 중심의 정산 보드부터 운영합니다.",
      "반품/취소는 차감 항목으로 별도 표기합니다.",
      "후속 단계에서 딜러별/상품별 정산 알고리즘을 확장합니다.",
    ],
  },
] as const;
