export type Product = {
  slug: string;
  badge: string;
  brand: string;
  title: string;
  subtitle: string;
  category: string;
  review: string;
  shipping: string;
  price: string;
  image: string;
  gallery: string[];
  summary: string;
  highlights: string[];
  description: string[];
  detailSections: Array<{
    title: string;
    body: string;
    image: string;
    imageAlt: string;
    caption: string;
  }>;
  specs: Array<{ label: string; value: string }>;
};

export type RecommendedProduct = {
  slug: string;
  tag: string;
};

export type Notice = {
  slug: string;
  category: string;
  title: string;
  date: string;
  summary: string;
  paragraphs: string[];
  checklist: string[];
};

const detailImagePool = {
  bottleFlatLay:
    "https://images.pexels.com/photos/7615561/pexels-photo-7615561.jpeg?auto=compress&cs=tinysrgb&w=1600",
  bottleLifestyle:
    "https://images.pexels.com/photos/7615573/pexels-photo-7615573.jpeg?auto=compress&cs=tinysrgb&w=1600",
  supplementBottle:
    "https://images.pexels.com/photos/14744699/pexels-photo-14744699.jpeg?auto=compress&cs=tinysrgb&w=1600",
} as const;

export const products: Product[] = [
  {
    slug: "daily-multivitamin-core",
    badge: "베스트",
    brand: "웰니스 셀렉트",
    title: "데일리 멀티비타민 코어",
    subtitle: "기본 영양 루틴을 위한 대표 상품",
    category: "종합비타민",
    review: "후기 1,284",
    shipping: "오늘 출고 가능",
    price: "회원가 로그인 후 확인",
    image: "/demo/product-vitamin.png",
    gallery: [
      "/demo/product-vitamin.png",
      "/demo/product-box.png",
      "/demo/product-stick.png",
    ],
    summary:
      "하루 한 번 챙기기 쉬운 멀티비타민 포뮬러로, 기본 영양 루틴을 시작하려는 회원에게 가장 많이 추천되는 대표 상품입니다.",
    highlights: ["비타민 13종", "미네랄 10종", "하루 1정 루틴"],
    description: [
      "데일리 멀티비타민 코어는 기본 영양 균형을 고려해 구성한 종합 영양 포뮬러입니다. 건강창고 메인 화면에서 가장 먼저 보여주는 대표 상품으로, 첫 구매와 재구매 비중이 모두 높은 편입니다.",
      "과하게 기능을 강조하기보다 매일 부담 없이 챙기기 쉬운 루틴형 상품으로 설계했고, 회원 승인 이후 가격과 구매 기능이 노출되는 운영 정책에 맞춰 상세 페이지 역시 정보 중심으로 정리했습니다.",
    ],
    detailSections: [
      {
        title: "하루 루틴에 자연스럽게 들어가는 기본 영양 설계",
        body:
          "데일리 멀티비타민 코어는 매일 부담 없이 챙기기 쉬운 종합 영양 루틴 상품입니다. 기본 비타민과 미네랄 조합을 중심으로 구성해 첫 구매 상품으로 많이 선택됩니다.",
        image: detailImagePool.bottleFlatLay,
        imageAlt: "화이트 배경 위 멀티비타민 제품 이미지",
        caption: "기본 영양 루틴용 대표 상품 이미지",
      },
      {
        title: "회원형 쇼핑몰에 맞춘 심플한 루틴 제안",
        body:
          "상품상세에서는 회원 전용가 운영 정책과 함께, 어떤 회원이 가장 많이 선택하는지 한눈에 읽히도록 정보 구조를 단순하게 정리했습니다. 단품 구매뿐 아니라 장 건강, 눈 건강 상품과 함께 묶어 보는 수요도 높습니다.",
        image: detailImagePool.bottleLifestyle,
        imageAlt: "비타민 보틀과 건강 루틴 소품 이미지",
        caption: "기본 루틴과 함께 제안되는 상세 이미지",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회, 1정 식후 섭취" },
      { label: "포장 단위", value: "30정 / 1개월분" },
      { label: "보관 방법", value: "직사광선을 피해 실온 보관" },
      { label: "배송 안내", value: "평일 오전 주문 건 기준 당일 출고" },
    ],
  },
  {
    slug: "gut-balance-box",
    badge: "인기",
    brand: "바이오 밸런스",
    title: "유산균 밸런스 박스",
    subtitle: "재구매율 높은 장 건강 베스트",
    category: "장 건강",
    review: "후기 932",
    shipping: "정기배송 가능",
    price: "회원가 로그인 후 확인",
    image: "/demo/product-box.png",
    gallery: [
      "/demo/product-box.png",
      "/demo/product-stick.png",
      "/demo/product-vitamin.png",
    ],
    summary:
      "장 건강 루틴 입문용으로 가장 많이 찾는 상품군이며, 정기배송 전환율이 높은 대표 유산균 셀렉션입니다.",
    highlights: ["프로바이오틱스", "스틱 개별포장", "정기배송 가능"],
    description: [
      "유산균 밸런스 박스는 매일 꾸준히 섭취할 수 있도록 개별 포장 중심으로 구성한 상품입니다. 장 건강 카테고리에서 안정적으로 판매되는 스테디셀러입니다.",
      "상세 페이지에서는 핵심 루틴 정보와 배송 정책을 먼저 보여주고, 회원 전용 가격 정책은 기존 메인과 같은 톤으로 이어지도록 설계했습니다.",
    ],
    detailSections: [
      {
        title: "정기 루틴에 어울리는 장 건강 셀렉션",
        body:
          "유산균 밸런스 박스는 꾸준한 섭취가 중요한 카테고리 특성상 정기배송과 함께 많이 제안되는 상품입니다. 상세페이지에서도 재구매 중심 루틴 상품이라는 점이 먼저 보이도록 구성했습니다.",
        image: detailImagePool.supplementBottle,
        imageAlt: "화이트 보틀과 건강 보조제 이미지",
        caption: "장 건강 루틴 중심 상품 이미지",
      },
      {
        title: "개별 포장 중심으로 간편하게",
        body:
          "휴대가 쉬운 개별 포장 형태를 기준으로 상품 이해가 되도록 하고, 장 건강 카테고리에서 함께 구매하는 상품군과도 자연스럽게 연결될 수 있게 상세 영역을 구성했습니다.",
        image: detailImagePool.bottleFlatLay,
        imageAlt: "영양제와 캡슐이 놓인 플랫레이 이미지",
        caption: "간편 섭취 루틴을 보여주는 상세 이미지",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회, 1포 직접 섭취" },
      { label: "포장 단위", value: "30포 / 1개월분" },
      { label: "보관 방법", value: "고온다습한 곳을 피해 보관" },
      { label: "배송 안내", value: "정기배송 설정 가능" },
    ],
  },
  {
    slug: "protein-bulk-nutrition",
    badge: "추천",
    brand: "프로틴 랩",
    title: "프로틴 벌크 뉴트리션",
    subtitle: "운동 루틴용 대용량 셀렉션",
    category: "단백질",
    review: "후기 614",
    shipping: "묶음 구성 가능",
    price: "회원가 로그인 후 확인",
    image: "/demo/product-tub.png",
    gallery: [
      "/demo/product-tub.png",
      "/demo/product-vitamin.png",
      "/demo/product-box.png",
    ],
    summary:
      "운동 루틴과 함께 찾는 대용량 단백질 상품으로, 묶음 구성이 많은 회원형 공급몰 구조에 잘 맞는 상품입니다.",
    highlights: ["대용량 포장", "운동 루틴 추천", "묶음 구성 가능"],
    description: [
      "프로틴 벌크 뉴트리션은 대용량 단백질 라인으로, 회원 구매에서 세트 구성 요청이 많은 상품입니다. 메인에서 보였던 묶음 구성 흐름을 상세에서도 그대로 이어갑니다.",
      "카테고리 특성상 운동 루틴과 함께 보는 비중이 높아, 제품 소개 아래에 섭취 가이드와 배송 안내를 함께 노출하는 구성으로 정리했습니다.",
    ],
    detailSections: [
      {
        title: "운동 루틴 중심의 대용량 단백질 라인",
        body:
          "프로틴 벌크 뉴트리션은 운동 루틴과 함께 꾸준히 구매하는 회원 비중이 높아, 상품상세에서도 섭취 빈도와 묶음 구매 흐름을 자연스럽게 읽을 수 있도록 구성했습니다.",
        image: detailImagePool.supplementBottle,
        imageAlt: "헬스 보조제 제품 이미지",
        caption: "대용량 루틴 상품을 연상시키는 상세 이미지",
      },
      {
        title: "묶음 구매와 세트 제안에 최적화된 상품 구조",
        body:
          "단백질 카테고리는 다른 루틴형 상품보다 묶음 구성 문의가 많은 편이라, 장바구니와 연결되는 동선도 함께 고려했습니다. 실제 공급몰처럼 정보를 빠르게 확인할 수 있도록 구성했습니다.",
        image: detailImagePool.bottleLifestyle,
        imageAlt: "보틀 제품과 라이프스타일 연출 이미지",
        caption: "운동 루틴과 함께 보는 연출 이미지",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1회 1스쿱, 물 또는 우유에 혼합" },
      { label: "포장 단위", value: "2kg / 대용량" },
      { label: "보관 방법", value: "개봉 후 밀봉 보관" },
      { label: "배송 안내", value: "묶음 구성 주문 가능" },
    ],
  },
  {
    slug: "omega-lutein-double-care",
    badge: "신상품",
    brand: "비전 케어",
    title: "오메가 · 루테인 더블 케어",
    subtitle: "중장년 고객군 선호 루틴",
    category: "눈 건강",
    review: "후기 408",
    shipping: "추천 세트 운영",
    price: "회원가 로그인 후 확인",
    image: "/demo/product-stick.png",
    gallery: [
      "/demo/product-stick.png",
      "/demo/product-box.png",
      "/demo/product-tub.png",
    ],
    summary:
      "중장년 고객군 선호도가 높은 오메가와 루테인 조합 상품으로, 추천 세트와 함께 운영하기 좋은 건강 루틴 상품입니다.",
    highlights: ["오메가 복합", "루테인 조합", "세트 운영 상품"],
    description: [
      "오메가 · 루테인 더블 케어는 눈 건강과 데일리 루틴 수요를 함께 고려한 조합형 상품입니다. 기존 회원 구매 이력에서도 세트 제안과 함께 보는 비중이 높습니다.",
      "상세 화면에서는 제품 핵심 포인트와 함께 배송, 교환, 회원 정책을 한 화면 안에서 쉽게 확인할 수 있도록 정보 구조를 정리했습니다.",
    ],
    detailSections: [
      {
        title: "중장년 고객군 선호도가 높은 조합 상품",
        body:
          "오메가와 루테인 조합은 눈 건강 카테고리에서 가장 이해가 쉬운 루틴 상품군 중 하나입니다. 상세 본문에서는 핵심 포인트를 빠르게 읽고 바로 구매 판단을 할 수 있게 정리했습니다.",
        image: detailImagePool.bottleFlatLay,
        imageAlt: "오메가 및 루테인 계열 건강식품 이미지",
        caption: "눈 건강 루틴용 상세 이미지",
      },
      {
        title: "추천 세트와 함께 보는 데일리 케어 상품",
        body:
          "단품뿐 아니라 추천 세트와 함께 운영할 수 있도록 상세 구성도 너무 장황하지 않게 정리했습니다. 배송과 교환 정책, 회원 전용가 정책까지 같은 화면 안에서 확인할 수 있습니다.",
        image: detailImagePool.supplementBottle,
        imageAlt: "건강 보조제 보틀 클로즈업 이미지",
        caption: "세트 제안과 함께 운영되는 상품 이미지",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회, 2캡슐 섭취" },
      { label: "포장 단위", value: "60캡슐 / 1개월분" },
      { label: "보관 방법", value: "서늘한 곳에 보관" },
      { label: "배송 안내", value: "추천 세트 형태로 운영 가능" },
    ],
  },
];

export const bestProducts = products;

export const recommendedProducts: RecommendedProduct[] = [
  { slug: "daily-multivitamin-core", tag: "여성 케어" },
  { slug: "omega-lutein-double-care", tag: "수면 루틴" },
  { slug: "gut-balance-box", tag: "면역 케어" },
  { slug: "protein-bulk-nutrition", tag: "중장년" },
];

export const notices: Notice[] = [
  {
    slug: "membership-price-policy",
    category: "운영정책",
    title: "회원 승인 후 가격 및 구매 기능이 노출됩니다.",
    date: "2026.04.22",
    summary:
      "건강창고는 폐쇄형 회원제 운영을 기준으로 가격과 구매 기능을 제공합니다. 회원 승인 이후에만 상세 가격과 주문 기능이 노출됩니다.",
    paragraphs: [
      "건강창고는 회원 승인 이후 가격과 구매 기능을 제공하는 폐쇄형 회원제 쇼핑몰 구조를 기준으로 운영됩니다. 비회원 상태에서는 상품 노출과 기본 정보만 확인할 수 있고, 가격 및 장바구니 기능은 숨김 처리됩니다.",
      "회원 승인 프로세스는 운영 정책과 내부 검토 기준에 따라 진행되며, 승인 완료 후 마이페이지와 주문 관련 기능도 함께 사용할 수 있습니다. 이후 추가되는 딜러몰 구조 역시 동일한 회원 승인 정책을 기반으로 확장될 예정입니다.",
    ],
    checklist: [
      "비회원 상태에서는 가격이 노출되지 않습니다.",
      "회원 승인 이후 장바구니 및 주문 기능이 활성화됩니다.",
      "후속 확장 구조에서도 동일한 정책이 유지됩니다.",
    ],
  },
  {
    slug: "subscription-expansion-plan",
    category: "서비스안내",
    title: "정기배송 상품군은 순차적으로 확대될 예정입니다.",
    date: "2026.04.18",
    summary:
      "현재는 일부 상품군에만 정기배송 시범 운영을 적용하고 있으며, 재구매 주기가 안정적인 상품부터 순차적으로 확대할 예정입니다.",
    paragraphs: [
      "정기배송은 재구매 패턴이 명확한 상품군 중심으로 우선 적용하고 있습니다. 장 건강, 종합비타민 등 꾸준한 복용 루틴을 가진 상품을 기준으로 운영 범위를 넓혀갈 계획입니다.",
      "운영 초기에는 정산과 반품 처리 흐름을 먼저 검토하고, 안정화 이후 상품별 정책과 혜택 구성을 세분화할 예정입니다.",
    ],
    checklist: [
      "시범 운영 상품부터 순차 확대",
      "재구매 주기 데이터 기반 적용",
      "정산 구조 안정화 후 혜택 고도화",
    ],
  },
  {
    slug: "recommended-set-operation",
    category: "상품운영",
    title: "일부 상품은 추천 세트 형태로 우선 운영됩니다.",
    date: "2026.04.14",
    summary:
      "카테고리별 단품 운영과 함께, 실제 구매 패턴이 높은 조합 상품은 추천 세트 형태로 먼저 제안합니다.",
    paragraphs: [
      "건강식품은 단품보다 조합 구매 비중이 높은 카테고리가 많아, 메인과 상세 페이지 모두 추천 세트 제안을 함께 노출하는 구성을 사용합니다.",
      "세트 운영 상품은 재고 상황과 공급 조건에 따라 변동될 수 있으며, 이후 딜러/조직 확장 구조에서도 동일한 세트 운영 전략을 적용할 수 있도록 설계하고 있습니다.",
    ],
    checklist: [
      "조합 구매 수요 높은 상품 우선 적용",
      "재고 상황에 따라 세트 구성 변동 가능",
      "후속 딜러 구조 확장 대응",
    ],
  },
  {
    slug: "dealer-organization-expansion",
    category: "구조확장",
    title: "딜러몰 및 하위 운영 구조는 후속 단계에서 확장됩니다.",
    date: "2026.04.10",
    summary:
      "현재는 단일 몰 운영을 기준으로 하지만, 이후 본사-건강창고-딜러몰 구조로 확장 가능한 형태를 고려하고 있습니다.",
    paragraphs: [
      "향후 확장 단계에서는 상위 조직이 하위 몰을 관리할 수 있는 구조가 필요합니다. 이를 위해 현재 화면 구성과 데이터 흐름도 중앙 통제형 운영 구조를 염두에 두고 설계하고 있습니다.",
      "회원 관리, 주문 이력, 매출 조회, 정산 데이터 등은 딜러 전용 페이지로 별도 분리될 수 있도록 화면 구조를 확장 가능한 형태로 유지할 예정입니다.",
    ],
    checklist: [
      "본사-건강창고-딜러몰 구조 확장 고려",
      "하위 몰 관리 화면 분리 가능 구조",
      "정산 및 회원관리 기능 후속 개발 대응",
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getNoticeBySlug(slug: string) {
  return notices.find((notice) => notice.slug === slug);
}
