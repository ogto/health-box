import { headers } from "next/headers";
import { cache } from "react";

import {
  fetchDealerPublicConfig,
  fetchDealerPublicBySlug,
  fetchDealerContext,
  fetchPublicSiteConfig,
  hasHealthBoxApi,
} from "./health-box-api";
import {
  resolveStorefrontNavigationItems,
  storefrontConfig,
  type StorefrontNavigationItem,
} from "./storefront-config";
import {
  parseStorefrontPolicyBundle,
  type StorefrontCommercePolicy,
  type StorefrontSellerInfo,
} from "./storefront-policy";

type DealerPreset = {
  displayName: string;
  supportEmail?: string;
  supportPhone?: string;
};

type StorefrontConfigShape = {
  commerce: StorefrontCommercePolicy;
  metadata: {
    title: string;
    description: string;
  };
  brand: {
    name: string;
    kicker: string;
    searchScopeLabel: string;
    searchPlaceholder: string;
    policyMessage: string;
    memberLabel: string;
  };
  assets: {
    logoUrl?: string;
    heroImage: string;
    heroAlt: string;
    heroHref?: string;
    bannerImage: string;
    bannerAlt: string;
    bannerHref?: string;
    shareImage: string;
    faviconPath: string;
    logoType: string;
  };
  navigation: ReadonlyArray<StorefrontNavigationItem>;
  seller: StorefrontSellerInfo;
  home: {
    hero: {
      kicker: string;
      titleLines: readonly string[];
      description: string;
      primaryLabel: string;
      primaryHref: string;
      secondaryLabel: string;
      secondaryHref: string;
      tags: readonly string[];
    };
    banner: {
      kicker: string;
      title: string;
      description: string;
      ctaLabel: string;
      ctaHref: string;
    };
    supportItems: ReadonlyArray<{
      title: string;
      value: string;
    }>;
  };
};

type DealerRuntime = {
  dealerMallId?: number;
  slug: string;
  displayName: string;
  mallName: string;
  domain: string;
  supportEmail: string;
  supportPhone: string;
};

export type StorefrontRuntime = StorefrontConfigShape & {
  configuredMainVisualUrl?: string;
  dealer: DealerRuntime | null;
  host: {
    hostname: string;
    rootDomain: string;
    requestedDealerSlug?: string;
  };
};

const DEFAULT_ROOT_DOMAIN = "everybuy.co.kr";
const DEFAULT_SUPPORT_PHONE = "010-3796-3719";
const RESERVED_SUBDOMAINS = new Set(["admin", "www"]);
const STOREFRONT_IMAGE_HOSTS = new Set([
  "api.everybuy.co.kr",
  "cdn.1472.ai",
  "cloud.1472.ai",
  "ecimg.cafe24img.com",
  "images.pexels.com",
]);

const dealerPresets: Record<string, DealerPreset> = {
  dealer: {
    displayName: "DEALER",
    supportEmail: "dealer@everybuy.co.kr",
  },
  ogto: {
    displayName: "OGTO",
    supportEmail: "ogto@everybuy.co.kr",
  },
};

function getRootDomain() {
  return process.env.STORE_ROOT_DOMAIN?.trim() || DEFAULT_ROOT_DOMAIN;
}

function normalizeHostname(rawHost: string) {
  return rawHost.split(",")[0]?.trim().replace(/:\d+$/, "").toLowerCase() || "";
}

function resolveStorefrontImageUrl(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("/") && !normalized.startsWith("//")) {
    return normalized;
  }

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();
    const allowedProtocol = url.protocol === "https:" ||
      (url.protocol === "http:" && hostname === "cloud.1472.ai");
    return allowedProtocol && STOREFRONT_IMAGE_HOSTS.has(hostname) ? normalized : undefined;
  } catch {
    return undefined;
  }
}

function prettifySlug(slug: string) {
  return slug
    .split(".")
    .flatMap((part) => part.split("-"))
    .filter(Boolean)
    .map((part) => (/^[a-z0-9]+$/i.test(part) ? part.toUpperCase() : part))
    .join(" ");
}

function resolveDealerSlug(hostname: string, rootDomain: string) {
  if (!hostname) {
    return null;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    const slug = hostname.replace(/\.localhost$/, "");
    return RESERVED_SUBDOMAINS.has(slug) ? null : slug;
  }

  if (hostname === rootDomain || hostname === `www.${rootDomain}` || hostname === `admin.${rootDomain}`) {
    return null;
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    const slug = hostname.slice(0, -1 * (`.${rootDomain}`.length));
    return RESERVED_SUBDOMAINS.has(slug) ? null : slug;
  }

  return null;
}

function resolveDealerContextHost(hostname: string, dealerSlug: string | null, rootDomain: string) {
  if (hostname.endsWith(".localhost") && dealerSlug) {
    return `${dealerSlug}.${rootDomain}`;
  }

  return hostname;
}

function buildDealerRuntime(slug: string, hostname: string): DealerRuntime {
  const preset = dealerPresets[slug];
  const displayName = preset?.displayName || prettifySlug(slug);
  const mallName = `${displayName} 딜러몰`;
  const supportEmail = preset?.supportEmail || `${slug}@${getRootDomain()}`;
  const supportPhone = preset?.supportPhone || DEFAULT_SUPPORT_PHONE;

  return {
    slug,
    displayName,
    mallName,
    domain: hostname,
    supportEmail,
    supportPhone,
  };
}

export const getStorefrontRuntime = cache(async (): Promise<StorefrontRuntime> => {
  const headerStore = await headers();
  const rootDomain = getRootDomain();
  const hostname = normalizeHostname(
    headerStore.get("x-forwarded-host") || headerStore.get("host") || rootDomain,
  );
  const dealerSlug = resolveDealerSlug(hostname, rootDomain);
  const dealerContextHost = resolveDealerContextHost(hostname, dealerSlug, rootDomain);
  const dealer = !hasHealthBoxApi() && dealerSlug ? buildDealerRuntime(dealerSlug, hostname) : null;
  const apiEnabled = hasHealthBoxApi();
  const [publicSiteConfig, dealerContext] = apiEnabled
    ? await Promise.all([
        fetchPublicSiteConfig(),
        dealerContextHost ? fetchDealerContext(dealerContextHost) : Promise.resolve(null),
      ])
    : [null, null];
  const resolvedSlug = dealerContext?.slug || dealerSlug || "";
  const [dealerPublicConfig, dealerPublic] = apiEnabled && resolvedSlug
    ? await Promise.all([
        fetchDealerPublicConfig(resolvedSlug),
        fetchDealerPublicBySlug(resolvedSlug),
      ])
    : [null, null];
  const policyBundle = parseStorefrontPolicyBundle(
    dealerPublicConfig?.policyText || publicSiteConfig?.policyText,
  );
  const configuredMainVisualUrl =
    resolveStorefrontImageUrl(dealerPublicConfig?.mainVisualUrl) ||
    resolveStorefrontImageUrl(publicSiteConfig?.mainVisualUrl);
  const configuredMiddleBannerUrl =
    resolveStorefrontImageUrl(dealerPublicConfig?.middleBannerUrl) ||
    resolveStorefrontImageUrl(publicSiteConfig?.middleBannerUrl);

  const mergedConfig: StorefrontConfigShape = {
    ...storefrontConfig,
    metadata: {
      title: dealerPublicConfig?.metaTitle || publicSiteConfig?.metaTitle || storefrontConfig.metadata.title,
      description:
        dealerPublicConfig?.metaDescription || publicSiteConfig?.metaDescription || storefrontConfig.metadata.description,
    },
    brand: {
      ...storefrontConfig.brand,
      searchPlaceholder:
        dealerPublicConfig?.searchPlaceholder ||
        publicSiteConfig?.searchPlaceholder ||
        storefrontConfig.brand.searchPlaceholder,
      policyMessage: policyBundle.message || storefrontConfig.brand.policyMessage,
    },
    commerce: policyBundle.commerce,
    assets: {
      ...storefrontConfig.assets,
      logoUrl: dealerPublicConfig?.logoUrl || publicSiteConfig?.logoUrl || undefined,
      heroImage: configuredMainVisualUrl || storefrontConfig.assets.heroImage,
      heroHref:
        dealerPublicConfig?.mainVisualLinkUrl?.trim() ||
        publicSiteConfig?.mainVisualLinkUrl?.trim() ||
        undefined,
      bannerImage: configuredMiddleBannerUrl || storefrontConfig.assets.bannerImage,
      bannerHref:
        dealerPublicConfig?.middleBannerLinkUrl?.trim() ||
        publicSiteConfig?.middleBannerLinkUrl?.trim() ||
        undefined,
      shareImage:
        dealerPublicConfig?.shareThumbnailUrl ||
        publicSiteConfig?.shareThumbnailUrl ||
        (!dealerPublicConfig ? configuredMainVisualUrl : undefined) ||
        storefrontConfig.assets.shareImage,
      faviconPath:
        dealerPublicConfig?.faviconUrl || publicSiteConfig?.faviconUrl || storefrontConfig.assets.faviconPath,
    },
    navigation: resolveStorefrontNavigationItems(
      dealerPublicConfig?.mainNavigationJson ||
        publicSiteConfig?.mainNavigationJson ||
        publicSiteConfig?.navigationJson ||
        publicSiteConfig?.menuJson,
    ),
    seller: policyBundle.seller,
    home: {
      ...storefrontConfig.home,
      supportItems: [
        {
          title: "고객센터",
          value:
            dealerPublicConfig?.customerCenterText ||
            publicSiteConfig?.customerCenterText ||
            storefrontConfig.home.supportItems[0]?.value ||
            "",
        },
        storefrontConfig.home.supportItems[1],
        storefrontConfig.home.supportItems[2],
      ],
    },
  };

  const resolvedDealer =
    dealerContext?.valid && dealerContext.appType === "DEALER_PUBLIC"
      ? {
          dealerMallId:
            dealerContext.dealerMallId ||
            dealerPublicConfig?.dealerMallId ||
            dealerPublic?.dealerMallId ||
            dealer?.dealerMallId,
          slug:
            dealerContext.slug ||
            dealerPublicConfig?.slug ||
            dealerPublic?.slug ||
            dealer?.slug ||
            "",
          displayName:
            dealerContext.displayName ||
            dealerPublicConfig?.displayName ||
            dealerPublic?.displayName ||
            dealer?.displayName ||
            "",
          mallName:
            dealerContext.mallName ||
            dealerPublicConfig?.mallName ||
            dealerPublic?.mallName ||
            dealer?.mallName ||
            "",
          domain: hostname,
          supportEmail:
            dealerContext.supportEmail ||
            dealerPublicConfig?.supportEmail ||
            dealerPublic?.supportEmail ||
            dealer?.supportEmail ||
            "",
          supportPhone:
            dealerContext.supportPhone ||
            dealerPublicConfig?.supportPhone ||
            dealerPublic?.supportPhone ||
            dealer?.supportPhone ||
            DEFAULT_SUPPORT_PHONE,
        }
      : dealer;

  if (!resolvedDealer) {
    return {
      ...mergedConfig,
      configuredMainVisualUrl,
      host: {
        hostname: hostname || rootDomain,
        rootDomain,
        requestedDealerSlug: dealerSlug || undefined,
      },
      dealer: null,
    };
  }

  return {
    ...mergedConfig,
    configuredMainVisualUrl,
    metadata: {
      title: `${resolvedDealer.mallName} | 건강창고`,
      description: `${resolvedDealer.displayName} 회원을 위한 건강창고 전용 딜러몰입니다. 회원가입 후 바로 가격 확인 및 주문이 가능합니다.`,
    },
    brand: {
      ...mergedConfig.brand,
      kicker: resolvedDealer.mallName,
      searchPlaceholder: `${resolvedDealer.displayName} 회원 전용 상품을 검색하세요`,
      policyMessage: `${resolvedDealer.displayName} 회원가입 후 가격 확인 및 구매 가능`,
      memberLabel: `${resolvedDealer.displayName} 회원`,
    },
    home: {
      ...mergedConfig.home,
      hero: {
        ...mergedConfig.home.hero,
        kicker: resolvedDealer.mallName,
        titleLines: [`${resolvedDealer.displayName} 회원 전용`, "건강 루틴 셀렉션"],
        description: `${resolvedDealer.mallName}을 통해 가입한 회원을 위한 건강식품 셀렉션입니다. 상품과 배송은 건강창고 본사에서 통합 운영합니다.`,
        tags: [`${resolvedDealer.displayName} 전용`, "회원가입 후 구매", "건강창고 본사 출고"],
      },
      banner: {
        ...mergedConfig.home.banner,
        title: `${resolvedDealer.displayName} 추천 건강 루틴`,
        description: `${resolvedDealer.displayName} 회원이 자주 찾는 기본 영양 루틴과 시즌 케어 상품을 모아 보여주는 기획전 영역입니다.`,
      },
      supportItems: [
        {
          title: "딜러몰",
          value: resolvedDealer.mallName,
        },
        {
          title: "상담 메일",
          value: resolvedDealer.supportEmail,
        },
        {
          title: "배송 안내",
          value: "건강창고 본사에서 순차 출고",
        },
      ],
    },
    host: {
      hostname,
      rootDomain,
      requestedDealerSlug: dealerSlug || undefined,
    },
    dealer: resolvedDealer,
  };
});
