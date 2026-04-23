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
  heroPrimary:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/6dea5f1a6c55e1b8a6845eb0fafb8b38.jpg",
  heroSecondary:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/0ce9d3a711c79687b1441bbde01a58af.jpg",
  heroTertiary:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/4e7afb376812f13557c351beb5138c99.jpg",
  galleryOne:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/1d058956a0aad672acd1abca560bf0e6.jpg",
  galleryTwo:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/65222a7eab558a72c49bf5c22682ac2a.jpg",
  galleryThree:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/6afcae36827e2392ee630275883394ef.jpg",
  promoBanner:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/231ac7c6d80e659932cc96d529937e76.jpg",
  productOne:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/product/medium/20250925/9e4962fd824ba0443fb2ab44c0a963e1.jpg",
  productTwo:
    "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/product/medium/20250925/2f623e46c55d8476b248ff70d31fef6f.jpg",
} as const;

export const products: Product[] = [
  {
    slug: "daily-multivitamin-core",
    badge: "베스트",
    brand: "건강창고 셀렉트",
    title: "양태반 세럼",
    subtitle: "메인 추천 영역에 배치되는 대표 셀렉션",
    category: "건강 뷰티",
    review: "후기 1,284",
    shipping: "오늘 출고 가능",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.productOne,
    gallery: [detailImagePool.productOne, detailImagePool.heroPrimary, detailImagePool.galleryOne],
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
        image: detailImagePool.heroPrimary,
        imageAlt: "화이트 배경 위 멀티비타민 제품 이미지",
        caption: "기본 영양 루틴용 대표 상품 이미지",
      },
      {
        title: "회원형 쇼핑몰에 맞춘 심플한 루틴 제안",
        body:
          "상품상세에서는 회원 전용가 운영 정책과 함께, 어떤 회원이 가장 많이 선택하는지 한눈에 읽히도록 정보 구조를 단순하게 정리했습니다. 단품 구매뿐 아니라 장 건강, 눈 건강 상품과 함께 묶어 보는 수요도 높습니다.",
        image: detailImagePool.galleryOne,
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
    brand: "건강창고 셀렉트",
    title: "마누카 프로폴리스",
    subtitle: "베스트 탭에 배치되는 스테디셀러 상품",
    category: "면역 케어",
    review: "후기 932",
    shipping: "오늘 출고 가능",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.productTwo,
    gallery: [detailImagePool.productTwo, detailImagePool.heroSecondary, detailImagePool.galleryTwo],
    summary:
      "꾸준히 찾는 기본 면역 케어 상품군으로, 첫 구매와 재구매 비중이 모두 높은 대표 셀렉션입니다.",
    highlights: ["프로바이오틱스", "스틱 개별포장", "기본 케어 상품"],
    description: [
      "유산균 밸런스 박스는 매일 꾸준히 섭취할 수 있도록 개별 포장 중심으로 구성한 상품입니다. 장 건강 카테고리에서 안정적으로 판매되는 스테디셀러입니다.",
      "상세 페이지에서는 핵심 루틴 정보와 배송 정책을 먼저 보여주고, 회원 전용 가격 정책은 기존 메인과 같은 톤으로 이어지도록 설계했습니다.",
    ],
    detailSections: [
      {
        title: "정기 루틴에 어울리는 장 건강 셀렉션",
        body:
          "유산균 밸런스 박스는 꾸준히 섭취하는 회원 비중이 높은 기본 케어 상품입니다. 상세페이지에서도 반복 구매가 많은 루틴 상품이라는 점이 먼저 보이도록 구성했습니다.",
        image: detailImagePool.heroSecondary,
        imageAlt: "화이트 보틀과 건강 보조제 이미지",
        caption: "장 건강 루틴 중심 상품 이미지",
      },
      {
        title: "개별 포장 중심으로 간편하게",
        body:
          "휴대가 쉬운 개별 포장 형태를 기준으로 상품 이해가 되도록 하고, 장 건강 카테고리에서 함께 구매하는 상품군과도 자연스럽게 연결될 수 있게 상세 영역을 구성했습니다.",
        image: detailImagePool.galleryTwo,
        imageAlt: "영양제와 캡슐이 놓인 플랫레이 이미지",
        caption: "간편 섭취 루틴을 보여주는 상세 이미지",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회, 1포 직접 섭취" },
      { label: "포장 단위", value: "30포 / 1개월분" },
      { label: "보관 방법", value: "고온다습한 곳을 피해 보관" },
      { label: "배송 안내", value: "평일 주문 건 기준 순차 출고" },
    ],
  },
  {
    slug: "protein-bulk-nutrition",
    badge: "추천",
    brand: "건강창고 셀렉트",
    title: "그린픽스 프레시파워 스무디",
    subtitle: "건강 갤러리와 함께 노출되는 대표 스무디 상품",
    category: "식품/간식",
    review: "후기 614",
    shipping: "묶음 구성 가능",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.galleryOne,
    gallery: [detailImagePool.galleryOne, detailImagePool.heroTertiary, detailImagePool.promoBanner],
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
        image: detailImagePool.galleryOne,
        imageAlt: "헬스 보조제 제품 이미지",
        caption: "대용량 루틴 상품을 연상시키는 상세 이미지",
      },
      {
        title: "묶음 구매와 세트 제안에 최적화된 상품 구조",
        body:
          "단백질 카테고리는 다른 루틴형 상품보다 묶음 구성 문의가 많은 편이라, 장바구니와 연결되는 동선도 함께 고려했습니다. 실제 공급몰처럼 정보를 빠르게 확인할 수 있도록 구성했습니다.",
        image: detailImagePool.heroTertiary,
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
    brand: "건강창고 셀렉트",
    title: "액티브핏 그린 헬시 스무디",
    subtitle: "메인 이미지 갤러리와 함께 구성되는 시즌 상품",
    category: "드링크",
    review: "후기 408",
    shipping: "추천 세트 운영",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.galleryThree,
    gallery: [detailImagePool.galleryThree, detailImagePool.promoBanner, detailImagePool.galleryTwo],
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
        image: detailImagePool.galleryThree,
        imageAlt: "오메가 및 루테인 계열 건강식품 이미지",
        caption: "눈 건강 루틴용 상세 이미지",
      },
      {
        title: "추천 세트와 함께 보는 데일리 케어 상품",
        body:
          "단품뿐 아니라 추천 세트와 함께 운영할 수 있도록 상세 구성도 너무 장황하지 않게 정리했습니다. 배송과 교환 정책, 회원 전용가 정책까지 같은 화면 안에서 확인할 수 있습니다.",
        image: detailImagePool.promoBanner,
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
    category: "운영안내",
    title: "[안내] 회원 승인 후 가격 확인 및 주문이 가능합니다.",
    date: "2026.04.22",
    summary:
      "건강창고는 회원 승인 완료 후 가격 확인과 주문이 가능한 회원제 쇼핑몰입니다. 가입 승인 전에는 상품 정보만 확인하실 수 있습니다.",
    paragraphs: [
      "건강창고는 회원 승인 이후 가격 확인과 주문 기능을 제공하는 회원제 운영 방식을 기준으로 합니다. 승인 전에는 상품명, 이미지, 기본 설명만 확인 가능하며 가격 및 결제 기능은 노출되지 않습니다.",
      "회원 승인 여부는 접수 순서에 따라 순차 검토되며, 승인 완료 후 마이페이지와 주문 관련 기능을 함께 이용하실 수 있습니다. 가입 정보 확인이 필요한 경우 개별 연락이 진행될 수 있습니다.",
    ],
    checklist: [
      "승인 전에는 가격 및 주문 기능이 제공되지 않습니다.",
      "회원 승인 완료 후 장바구니와 결제가 가능합니다.",
      "가입 승인 관련 문의는 고객센터 운영시간 내 접수 부탁드립니다.",
    ],
  },
  {
    slug: "shipping-schedule-guide",
    category: "배송안내",
    title: "[배송] 평일 오전 주문 건은 순차 출고됩니다.",
    date: "2026.04.18",
    summary:
      "평일 오전 주문 건은 당일 출고를 원칙으로 하며, 재고 상황 및 택배사 접수 마감 시간에 따라 일부 변동될 수 있습니다.",
    paragraphs: [
      "평일 오전 결제 완료 건은 당일 출고를 기준으로 순차 처리됩니다. 오후 주문 건과 주말·공휴일 주문 건은 다음 영업일 기준으로 준비 및 출고가 진행됩니다.",
      "재고 상황이나 택배사 물량 증가로 인해 일부 상품은 출고 일정이 달라질 수 있으며, 변동 시 공지사항 또는 개별 연락을 통해 안내드립니다.",
    ],
    checklist: [
      "평일 오전 주문 건 우선 출고",
      "주말 및 공휴일 주문은 다음 영업일 처리",
      "재고 및 택배사 상황에 따라 일정 변동 가능",
    ],
  },
  {
    slug: "recommended-set-operation",
    category: "상품안내",
    title: "[상품] 세트 구성 상품은 재고 상황에 따라 변경될 수 있습니다.",
    date: "2026.04.14",
    summary:
      "일부 상품은 단품과 함께 세트 구성으로 노출되며, 구성 품목은 재고 및 운영 일정에 따라 변경될 수 있습니다.",
    paragraphs: [
      "건강식품은 함께 구매하는 조합 수요가 높은 상품군이 많아, 일부 상품은 세트 구성 형태로 함께 제안될 수 있습니다. 단품 판매 여부는 동일하게 유지됩니다.",
      "세트 구성 상품은 재고 상황과 입고 일정에 따라 구성 품목이 바뀔 수 있으며, 화면에 노출되는 정보는 운영 기준에 따라 수시로 조정될 수 있습니다.",
    ],
    checklist: [
      "세트 구성은 운영 기준에 따라 변경될 수 있습니다.",
      "재고 상황에 따라 단품 또는 세트 노출이 조정됩니다.",
      "주문 전 상세 페이지 구성 내용을 확인해 주세요.",
    ],
  },
  {
    slug: "dealer-organization-expansion",
    category: "운영안내",
    title: "[안내] 딜러몰 운영 구조는 순차적으로 확대될 예정입니다.",
    date: "2026.04.10",
    summary:
      "현재는 단일 몰 운영을 기준으로 서비스를 제공하고 있으며, 이후 딜러몰 관리 구조는 단계적으로 확장될 예정입니다.",
    paragraphs: [
      "향후 운영 단계에서는 본사와 딜러몰 간 관리 구조가 추가될 수 있습니다. 이를 고려해 회원, 주문, 공지 흐름은 확장 가능한 구조를 기준으로 순차 반영하고 있습니다.",
      "딜러몰 운영 기능은 단계적으로 적용되며, 회원 관리와 주문 조회 등 세부 기능은 별도 일정에 맞춰 안내드릴 예정입니다.",
    ],
    checklist: [
      "딜러몰 구조는 후속 일정에 맞춰 순차 적용",
      "회원 및 주문 관리 기능은 별도 안내 예정",
      "주요 운영 변경 사항은 공지사항을 통해 안내",
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getNoticeBySlug(slug: string) {
  return notices.find((notice) => notice.slug === slug);
}
