export type StorefrontNavigationItem = {
  children?: StorefrontNavigationSubItem[];
  href: string;
  key: string;
  label: string;
  productSlugs?: string[];
  sortOrder?: number;
  style?: "category" | "link";
  visible?: boolean;
};

export type StorefrontNavigationSubItem = {
  href: string;
  key: string;
  label: string;
  sortOrder?: number;
  visible?: boolean;
};

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
    heroImage:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/6dea5f1a6c55e1b8a6845eb0fafb8b38.jpg",
    heroAlt: "건강창고 메인 비주얼",
    bannerImage:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/231ac7c6d80e659932cc96d529937e76.jpg",
    bannerAlt: "건강창고 중간 배너",
    shareImage:
      "https://ecimg.cafe24img.com/pg2194b47504004074/everybuy01/web/upload/NNEditor/20250902/6dea5f1a6c55e1b8a6845eb0fafb8b38.jpg",
    faviconPath: "/favicon.ico",
    logoType: "심볼 마크",
  },
  navigation: [
    { key: "category", label: "카테고리", href: "/products/best?menu=category", style: "category", visible: true },
    { key: "coupon", label: "[에스더데이]10%쿠폰", href: "/promotion?menu=coupon", style: "link", visible: true },
    { key: "national", label: "[8,900원]국민영양", href: "/promotion?menu=national", style: "link", visible: true },
    { key: "best", label: "베스트", href: "/products/best?menu=best", style: "link", visible: true },
    { key: "sale", label: "세일중", href: "/promotion?menu=sale", style: "link", visible: true },
    { key: "event", label: "이벤트", href: "/promotion?menu=event", style: "link", visible: true },
  ] satisfies StorefrontNavigationItem[],
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
        title: "배송 안내",
        value: "평일 주문 건 기준 순차 출고",
      },
    ],
  },
  syncTargets: [
    "StoreShell 기반 전체 공개 페이지의 헤더, 검색 문구, 회원 정책 문구",
    "홈 메인 비주얼과 중간 프로모션 배너",
    "기본 메타 타이틀, 설명, 공유용 썸네일",
  ],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseStorefrontNavigationItems(raw: unknown) {
  const parsed = typeof raw === "string" ? parseNavigationJson(raw) : raw;
  if (!Array.isArray(parsed)) {
    return null;
  }

  const items = parsed
    .map((item, index): StorefrontNavigationItem | null => {
      if (!isRecord(item)) {
        return null;
      }

      const label = typeof item.label === "string" ? item.label.trim() : "";
      const href = typeof item.href === "string" ? item.href.trim() : "";
      if (!label || !href) {
        return null;
      }

      const key =
        typeof item.key === "string" && item.key.trim()
          ? item.key.trim()
          : `custom-${index + 1}`;
      const style = item.style === "category" ? "category" : "link";
      const sortOrder = typeof item.sortOrder === "number" ? item.sortOrder : index + 1;
      const visible = item.visible === false ? false : true;
      const children = parseStorefrontNavigationChildren(item.children);
      const productSlugs = parseStringArray(item.productSlugs);

      return { children, href, key, label, productSlugs, sortOrder, style, visible };
    })
    .filter((item): item is StorefrontNavigationItem => Boolean(item))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return items.length ? items : null;
}

function parseStorefrontNavigationChildren(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item, index): StorefrontNavigationSubItem | null => {
      if (!isRecord(item)) {
        return null;
      }

      const label = typeof item.label === "string" ? item.label.trim() : "";
      const href = typeof item.href === "string" ? item.href.trim() : "";
      if (!label || !href) {
        return null;
      }

      return {
        href,
        key:
          typeof item.key === "string" && item.key.trim()
            ? item.key.trim()
            : `child-${index + 1}`,
        label,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index + 1,
        visible: item.visible === false ? false : true,
      };
    })
    .filter((item): item is StorefrontNavigationSubItem => Boolean(item))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function resolveStorefrontNavigationItems(raw: unknown) {
  const savedItems = parseStorefrontNavigationItems(raw) || [];

  return storefrontConfig.navigation.map((defaultItem, index) => {
    const savedItem =
      savedItems.find((item) => item.key === defaultItem.key) || savedItems[index] || null;

    return {
      ...defaultItem,
      label: savedItem?.label || defaultItem.label,
      href: defaultItem.href,
      productSlugs: savedItem?.productSlugs || [],
      sortOrder: index + 1,
      visible: true,
    };
  });
}

export function resolveNavigationProducts<Product extends { slug: string; sourceSlug?: string }>(
  products: Product[],
  navigationItem?: StorefrontNavigationItem | null,
) {
  const productSlugs = navigationItem?.productSlugs?.filter(Boolean) || [];
  if (!productSlugs.length) {
    return products;
  }

  const productBySlug = new Map<string, Product>();
  products.forEach((product) => {
    productBySlug.set(product.slug, product);
    if (product.sourceSlug) {
      productBySlug.set(product.sourceSlug, product);
    }
  });

  return productSlugs
    .map((slug) => productBySlug.get(slug))
    .filter((product): product is Product => Boolean(product));
}

export function findNavigationItemByKey(
  navigation: ReadonlyArray<StorefrontNavigationItem>,
  key?: string,
) {
  if (!key) {
    return null;
  }

  return navigation.find((item) => item.key === key) || null;
}

export function findFirstNavigationItemByPath(
  navigation: ReadonlyArray<StorefrontNavigationItem>,
  pathname: string,
) {
  return navigation.find((item) => item.href.split("?")[0] === pathname) || null;
}

function parseNavigationJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
}
