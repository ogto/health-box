export type Product = {
  slug: string;
  badge: string;
  brand: string;
  title: string;
  subtitle: string;
  category: string;
  deliveryPolicyText?: string;
  review: string;
  salesPolicyText?: string;
  shipping: string;
  price: string;
  image: string;
  gallery: string[];
  summary: string;
  detailHtml: string;
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
  optionGroups?: Array<{
    groupName?: string;
    id?: number;
    requiredYn?: string;
    sortOrder?: number;
    values?: Array<{
      id?: number;
      sortOrder?: number;
      status?: string;
      valueCode?: string;
      valueName?: string;
    }>;
  }>;
  optionUseYn?: string;
  skus?: Array<{
    consumerPrice?: number;
    id?: number;
    memberPrice?: number;
    optionValueCodes?: string[];
    safetyStock?: number;
    settlementBasePrice?: number;
    skuCode?: string;
    skuName?: string;
    soldOutYn?: string;
    status?: string;
    stockQuantity?: number;
    supplyPrice?: number;
  }>;
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
    badge: "BEST",
    brand: "헬스박스 셀렉트",
    title: "데일리 멀티비타민 코어",
    subtitle: "매일 챙기기 쉬운 기본 영양 루틴",
    category: "건강기능식품",
    review: "후기 1,284",
    shipping: "오늘 출고 가능",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.productOne,
    gallery: [detailImagePool.productOne, detailImagePool.heroPrimary, detailImagePool.galleryOne],
    summary:
      "처음 건강 루틴을 시작하는 회원에게 추천하기 좋은 기본 영양 상품입니다. 상품 이미지와 핵심 정보를 빠르게 확인할 수 있게 구성했습니다.",
    detailHtml:
      '<p>데일리 멀티비타민 코어는 기본 영양 균형을 고려해 구성한 종합 영양 제품입니다.</p><p>회원 전용 가격 정책에 맞춰 가격은 로그인 후 확인하도록 안내합니다.</p>',
    highlights: ["비타민 13종", "미네랄 10종", "하루 1정 루틴"],
    description: [
      "데일리 멀티비타민 코어는 기본 영양 균형을 고려해 구성한 종합 영양 제품입니다. 과한 설명보다 실제 구매 판단에 필요한 이미지, 배송, 섭취 정보를 앞쪽에 배치했습니다.",
      "회원 전용 가격 정책에 맞춰 가격은 로그인 후 확인하도록 안내하고, 상품 상세에서는 주요 성분과 섭취 루틴을 한눈에 읽을 수 있도록 정리했습니다.",
    ],
    detailSections: [
      {
        title: "하루 루틴에 자연스럽게 들어가는 기본 영양 설계",
        body:
          "바쁜 일상에서도 부담 없이 챙길 수 있도록 기본 영양 조합을 중심으로 구성했습니다. 첫 구매 상품으로도 이해하기 쉬운 정보 구조입니다.",
        image: detailImagePool.heroPrimary,
        imageAlt: "멀티비타민 상세 이미지",
        caption: "기본 영양 루틴",
      },
      {
        title: "상품 이미지를 중심으로 빠르게 비교",
        body:
          "메인 상품 이미지와 상세 이미지를 함께 보여줘 운영 중인 쇼핑몰처럼 탐색과 구매 판단이 자연스럽게 이어집니다.",
        image: detailImagePool.galleryOne,
        imageAlt: "영양 제품 상세 이미지",
        caption: "상품 상세 구성",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회, 1정 섭취" },
      { label: "포장 단위", value: "30정 / 1개월분" },
      { label: "보관 방법", value: "직사광선을 피해 서늘한 곳에 보관" },
      { label: "배송 안내", value: "평일 오전 주문 건 우선 출고" },
    ],
  },
  {
    slug: "gut-balance-box",
    badge: "인기",
    brand: "헬스박스 셀렉트",
    title: "장 밸런스 프로바이오틱스",
    subtitle: "속 편한 일상을 위한 장 건강 루틴",
    category: "장 건강",
    review: "후기 932",
    shipping: "오늘 출고 가능",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.productTwo,
    gallery: [detailImagePool.productTwo, detailImagePool.heroSecondary, detailImagePool.galleryTwo],
    summary:
      "장 건강 카테고리에서 꾸준히 찾는 기본 제품군입니다. 개별 포장과 간편한 섭취 루틴을 강조했습니다.",
    detailHtml:
      '<p>장 밸런스 프로바이오틱스는 매일 꾸준히 섭취하기 쉬운 스틱형 상품입니다.</p><p>반복 구매가 많은 카테고리 특성에 맞춰 배송과 섭취 안내를 명확히 보여줍니다.</p>',
    highlights: ["프로바이오틱스", "스틱 개별 포장", "데일리 케어"],
    description: [
      "장 밸런스 프로바이오틱스는 매일 꾸준히 섭취하기 쉬운 스틱형 상품입니다. 반복 구매가 많은 카테고리 특성에 맞춰 배송과 섭취 안내를 명확히 보여줍니다.",
      "상품 상세 페이지에서는 상세 이미지, 추천 포인트, 배송 안내를 같은 흐름으로 읽을 수 있도록 구성했습니다.",
    ],
    detailSections: [
      {
        title: "정기 루틴에 어울리는 장 건강 셀렉션",
        body:
          "개별 포장으로 보관과 휴대가 편해 꾸준한 섭취 루틴에 잘 맞는 제품입니다.",
        image: detailImagePool.heroSecondary,
        imageAlt: "프로바이오틱스 상세 이미지",
        caption: "장 건강 루틴",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1포 섭취" },
      { label: "포장 단위", value: "30포 / 1개월분" },
      { label: "보관 방법", value: "고온다습한 곳을 피해 보관" },
      { label: "배송 안내", value: "평일 주문 건 순차 출고" },
    ],
  },
  {
    slug: "protein-bulk-nutrition",
    badge: "추천",
    brand: "헬스박스 셀렉트",
    title: "그린헬스 프로틴 파우더",
    subtitle: "운동 루틴과 함께 제안하기 좋은 대용량 단백질",
    category: "단백질",
    review: "후기 614",
    shipping: "묶음 구성 가능",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.galleryOne,
    gallery: [detailImagePool.galleryOne, detailImagePool.heroTertiary, detailImagePool.promoBanner],
    summary:
      "운동 루틴을 가진 회원에게 추천하기 좋은 단백질 상품입니다. 대용량과 묶음 구성을 한눈에 확인할 수 있게 정리했습니다.",
    detailHtml:
      '<p>단백질 상품은 용량, 섭취 방식, 배송 정보가 구매 판단에 중요합니다.</p><p>추천 상품과 함께 이어지는 탐색 흐름도 자연스럽게 연결되도록 구성했습니다.</p>',
    highlights: ["대용량 포장", "운동 루틴 추천", "묶음 구성 가능"],
    description: [
      "단백질 상품은 용량, 섭취 방식, 배송 정보가 구매 판단에 중요합니다. 상세 화면에서 이 정보를 카드 형태로 정리했습니다.",
      "추천 상품과 함께 이어지는 탐색 흐름도 자연스럽게 연결되도록 구성했습니다.",
    ],
    detailSections: [
      {
        title: "운동 루틴에 맞춘 단백질 보충",
        body:
          "운동 전후로 챙기기 쉬운 상품 구조와 대용량 구성 정보를 명확히 보여줍니다.",
        image: detailImagePool.galleryOne,
        imageAlt: "프로틴 상세 이미지",
        caption: "운동 루틴 추천",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회, 물 또는 우유에 혼합" },
      { label: "포장 단위", value: "2kg / 대용량" },
      { label: "보관 방법", value: "개봉 후 밀봉 보관" },
      { label: "배송 안내", value: "묶음 구성 주문 가능" },
    ],
  },
  {
    slug: "omega-lutein-double-care",
    badge: "신상품",
    brand: "헬스박스 셀렉트",
    title: "오메가 루테인 더블케어",
    subtitle: "눈 건강과 일상 케어를 함께 고려한 조합",
    category: "눈 건강",
    review: "후기 408",
    shipping: "추천 세트 운영",
    price: "회원가 로그인 후 확인",
    image: detailImagePool.galleryThree,
    gallery: [detailImagePool.galleryThree, detailImagePool.promoBanner, detailImagePool.galleryTwo],
    summary:
      "중장년 고객군에게 추천하기 좋은 오메가와 루테인 조합 상품입니다. 상세 이미지와 추천 포인트를 중심으로 보여줍니다.",
    detailHtml:
      '<p>오메가 루테인 더블케어는 눈 건강 카테고리에서 이해하기 쉬운 조합 상품입니다.</p><p>상품 상세에서는 핵심 포인트와 배송 안내를 연결해 구매 흐름을 만들었습니다.</p>',
    highlights: ["오메가 복합", "루테인 조합", "세트 추천"],
    description: [
      "오메가 루테인 더블케어는 눈 건강 카테고리에서 이해하기 쉬운 조합 상품입니다.",
      "상품 상세에서는 핵심 포인트, 배송 안내, 추천 상품을 연결해 쇼핑몰다운 구매 흐름을 만들었습니다.",
    ],
    detailSections: [
      {
        title: "중장년 고객군 선호도가 높은 조합",
        body:
          "오메가와 루테인의 조합을 간결하게 설명하고, 실제 상품 이미지를 중심으로 신뢰감을 줍니다.",
        image: detailImagePool.galleryThree,
        imageAlt: "오메가 루테인 상세 이미지",
        caption: "눈 건강 케어",
      },
    ],
    specs: [
      { label: "섭취 방법", value: "1일 1회 섭취" },
      { label: "포장 단위", value: "60캡슐" },
      { label: "보관 방법", value: "서늘한 곳에 보관" },
      { label: "배송 안내", value: "세트 구성 가능" },
    ],
  },
];

export const recommendedProducts: RecommendedProduct[] = [
  { slug: "daily-multivitamin-core", tag: "첫 구매 추천" },
  { slug: "gut-balance-box", tag: "꾸준한 인기" },
  { slug: "protein-bulk-nutrition", tag: "운동 루틴" },
];

export const notices: Notice[] = [
  {
    slug: "membership-price-policy",
    category: "운영안내",
    title: "[안내] 회원 전용 가격은 로그인 후 확인할 수 있습니다.",
    date: "2026.04.22",
    summary:
      "헬스박스는 회원 인증 후 가격 확인과 주문이 가능한 회원 전용 몰입니다.",
    paragraphs: [
      "회원 인증 전에는 상품명, 이미지, 기본 설명을 먼저 확인할 수 있습니다.",
      "가격과 주문 기능은 회원 인증 후 노출되며, 운영 정책에 따라 일부 상품은 별도 안내될 수 있습니다.",
    ],
    checklist: [
      "회원 인증 전에는 가격이 노출되지 않습니다.",
      "인증 완료 후 장바구니와 주문 기능을 사용할 수 있습니다.",
      "궁금한 사항은 고객센터 운영 시간에 문의해 주세요.",
    ],
  },
  {
    slug: "shipping-schedule-guide",
    category: "배송안내",
    title: "[배송] 평일 오전 주문 건은 우선 출고됩니다.",
    date: "2026.04.18",
    summary:
      "재고와 택배 접수 상황에 따라 출고 일정은 변경될 수 있습니다.",
    paragraphs: [
      "평일 오전 결제 완료 건은 당일 출고를 우선으로 처리합니다.",
      "주말과 공휴일 주문은 다음 영업일 기준으로 준비 및 출고됩니다.",
    ],
    checklist: [
      "평일 오전 주문 건 우선 출고",
      "주말 및 공휴일 주문은 다음 영업일 처리",
      "재고 상황에 따라 일정 변경 가능",
    ],
  },
  {
    slug: "recommended-set-operation",
    category: "상품안내",
    title: "[상품] 세트 구성은 재고 상황에 따라 변경될 수 있습니다.",
    date: "2026.04.14",
    summary:
      "일부 상품은 단품과 세트 구성으로 함께 운영되며, 구성 품목은 운영 상황에 따라 달라질 수 있습니다.",
    paragraphs: [
      "건강 상품은 함께 구매하는 조합 수요가 있어 일부 상품은 세트 형태로도 제안됩니다.",
      "세트 구성과 노출 정보는 재고 및 입고 일정에 따라 수시로 조정될 수 있습니다.",
    ],
    checklist: [
      "세트 구성은 운영 기준에 따라 변경 가능",
      "재고 상황에 따라 노출 조정",
      "주문 전 상세 정보를 확인해 주세요.",
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getNoticeBySlug(slug: string) {
  return notices.find((notice) => notice.slug === slug);
}
