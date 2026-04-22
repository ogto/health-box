export const storefrontConfig = {
  metadata: {
    title: "건강창고 | 프리미엄 건강식품 쇼핑몰",
    description:
      "회원 전용 가격과 루틴 중심 큐레이션으로 구성된 건강식품 쇼핑몰 레이아웃",
  },
  brand: {
    name: "건강창고",
    kicker: "건강기능식품 셀렉트샵",
    searchScopeLabel: "전체 카테고리",
    searchPlaceholder: "상품명, 브랜드명, 기능성 키워드를 검색하세요",
    policyMessage: "비회원 가격 비노출 · 회원 승인 후 구매 가능",
    memberLabel: "건강창고 회원",
  },
  assets: {
    heroImage: "/demo/hero-main.png",
    heroAlt: "건강식품 메인 비주얼 더미 이미지",
    bannerImage: "/demo/banner-main.png",
    bannerAlt: "건강식품 기획전 더미 이미지",
    shareImage: "/demo/hero-main.png",
    faviconPath: "/favicon.ico",
    logoType: "심볼 마크",
  },
  home: {
    hero: {
      kicker: "건강기능식품 전문몰",
      titleLines: ["건강 루틴에 필요한 상품을", "한 곳에서 쉽게 둘러보세요"],
      description:
        "종합비타민, 장 건강, 단백질, 눈 건강 케어까지 자주 찾는 건강식품을 중심으로 메인 화면을 구성했습니다.",
      primaryLabel: "베스트 상품 보기",
      primaryHref: "/products/best",
      secondaryLabel: "기획전 보기",
      secondaryHref: "/promotion",
      tags: ["회원 전용가", "오늘 출고", "건강 루틴 셀렉션"],
    },
    banner: {
      kicker: "기획전",
      title: "이번 주 추천 건강 루틴 상품",
      description:
        "자주 찾는 데일리 영양제와 시즌 케어 상품을 묶어서 보여주는 메인 배너 영역입니다.",
      ctaLabel: "기획전 자세히 보기",
      ctaHref: "/promotion",
    },
    supportItems: [
      {
        title: "고객센터",
        value: "평일 09:00 - 18:00",
      },
      {
        title: "운영 정책",
        value: "회원 승인 이후 가격 및 구매 기능 노출",
      },
      {
        title: "바로가기",
        value: "장바구니 · 마이페이지",
      },
    ],
  },
  syncTargets: [
    "StoreShell 기반 전체 공개 페이지의 헤더, 검색 문구, 회원 정책 문구",
    "홈 메인 비주얼과 중간 프로모션 배너",
    "기본 메타 타이틀, 설명, 공유용 썸네일",
  ],
} as const;

