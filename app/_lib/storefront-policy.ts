const STOREFRONT_POLICY_SCHEMA = "health-box-storefront-policy";
const STOREFRONT_POLICY_VERSION = 1;

export const DEFAULT_BASE_SHIPPING_FEE = 3_000;
export const DEFAULT_FREE_SHIPPING_THRESHOLD = 50_000;
export const DEFAULT_REMOTE_AREA_ZIP_RANGES = ["63000-63644", "40200-40240"];

export type StorefrontSellerInfo = {
  businessAddress: string;
  businessRegistrationNumber: string;
  companyName: string;
  mailOrderRegistrationNumber: string;
  representativeName: string;
  shopName: string;
  supportEmail: string;
  supportPhone: string;
};

export type StorefrontCommercePolicy = {
  baseShippingFee: number;
  deliveryGuide: string;
  exchangeReturnGuide: string;
  freeShippingThreshold: number;
  remoteAreaFee: number;
  remoteAreaZipRanges: string[];
  safetyTip: string;
};

export type ShippingFeeBreakdown = {
  baseShippingFee: number;
  isRemoteArea: boolean;
  remoteAreaFee: number;
  shippingFee: number;
};

export type StorefrontPolicyBundle = {
  commerce: StorefrontCommercePolicy;
  message: string;
  schema: typeof STOREFRONT_POLICY_SCHEMA;
  seller: StorefrontSellerInfo;
  version: typeof STOREFRONT_POLICY_VERSION;
};

const defaultExchangeReturnGuide = [
  "교환·반품은 상품 수령 후 7일 이내 고객센터로 접수해주세요.",
  "표시·광고 또는 계약 내용과 다른 상품은 관련 법령이 정한 기간과 절차에 따라 처리합니다.",
  "상품을 개봉하거나 사용하여 가치가 훼손된 경우에는 교환·반품이 제한될 수 있습니다.",
].join("\n");

const defaultSafetyTip =
  "결제 전 판매자정보, 상품정보, 배송·교환·반품 조건을 확인하고 주문 내역과 결제 영수증을 보관해주세요.";

export const defaultStorefrontPolicyBundle: StorefrontPolicyBundle = {
  schema: STOREFRONT_POLICY_SCHEMA,
  version: STOREFRONT_POLICY_VERSION,
  message: "",
  commerce: {
    baseShippingFee: DEFAULT_BASE_SHIPPING_FEE,
    freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    remoteAreaFee: 0,
    remoteAreaZipRanges: [...DEFAULT_REMOTE_AREA_ZIP_RANGES],
    deliveryGuide: "기본 배송비는 3,000원이며 50,000원 이상 구매 시 무료배송됩니다.",
    exchangeReturnGuide: defaultExchangeReturnGuide,
    safetyTip: defaultSafetyTip,
  },
  seller: {
    shopName: "건강창고몰",
    companyName: "(주)에브리바이",
    representativeName: "장유미",
    businessRegistrationNumber: "309-88-00322",
    mailOrderRegistrationNumber: "",
    businessAddress: "서울특별시 종로구 종로 195-1, 1층(종로4가)",
    supportPhone: "",
    supportEmail: "",
  },
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nonNegativeInteger(value: unknown, fallback: number) {
  const numericValue = Number(value);
  return Number.isSafeInteger(numericValue) && numericValue >= 0 ? numericValue : fallback;
}

export function normalizeZipCode(value: unknown) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits.length === 5 ? digits : "";
}

function normalizeZipRange(value: unknown) {
  const [rawStart, rawEnd] = String(value ?? "")
    .split(/[-~]/)
    .map((part) => part.replace(/[^0-9]/g, ""));
  const start = normalizeZipCode(rawStart);
  if (!start) {
    return "";
  }

  const end = normalizeZipCode(rawEnd) || start;
  return start <= end ? `${start}-${end}` : `${end}-${start}`;
}

export function normalizeZipRanges(value: unknown): string[] {
  const rawRanges = Array.isArray(value)
    ? value
    : String(value ?? "").split(/[\r\n,]/);

  return Array.from(new Set(rawRanges.map(normalizeZipRange).filter(Boolean))).sort();
}

export function formatZipRangeLines(ranges: string[]) {
  return normalizeZipRanges(ranges).join("\n");
}

export function isRemoteAreaZipCode(zipCode: unknown, ranges: string[]) {
  const normalizedZipCode = normalizeZipCode(zipCode);
  if (!normalizedZipCode) {
    return false;
  }

  return normalizeZipRanges(ranges).some((range) => {
    const [start, end] = range.split("-");
    return normalizedZipCode >= start && normalizedZipCode <= end;
  });
}

export function parseStorefrontPolicyBundle(value: string | null | undefined): StorefrontPolicyBundle {
  const rawValue = textValue(value);
  if (!rawValue) {
    return structuredClone(defaultStorefrontPolicyBundle);
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StorefrontPolicyBundle>;
    if (parsed.schema !== STOREFRONT_POLICY_SCHEMA || parsed.version !== STOREFRONT_POLICY_VERSION) {
      throw new Error("Legacy storefront policy");
    }

    return {
      schema: STOREFRONT_POLICY_SCHEMA,
      version: STOREFRONT_POLICY_VERSION,
      message: textValue(parsed.message),
      commerce: {
        baseShippingFee: nonNegativeInteger(
          parsed.commerce?.baseShippingFee,
          defaultStorefrontPolicyBundle.commerce.baseShippingFee,
        ),
        freeShippingThreshold: nonNegativeInteger(
          parsed.commerce?.freeShippingThreshold,
          defaultStorefrontPolicyBundle.commerce.freeShippingThreshold,
        ),
        remoteAreaFee: nonNegativeInteger(
          parsed.commerce?.remoteAreaFee,
          defaultStorefrontPolicyBundle.commerce.remoteAreaFee,
        ),
        remoteAreaZipRanges: parsed.commerce?.remoteAreaZipRanges === undefined
          ? [...defaultStorefrontPolicyBundle.commerce.remoteAreaZipRanges]
          : normalizeZipRanges(parsed.commerce.remoteAreaZipRanges),
        deliveryGuide:
          textValue(parsed.commerce?.deliveryGuide) || defaultStorefrontPolicyBundle.commerce.deliveryGuide,
        exchangeReturnGuide:
          textValue(parsed.commerce?.exchangeReturnGuide) ||
          defaultStorefrontPolicyBundle.commerce.exchangeReturnGuide,
        safetyTip: textValue(parsed.commerce?.safetyTip) || defaultStorefrontPolicyBundle.commerce.safetyTip,
      },
      seller: {
        shopName: textValue(parsed.seller?.shopName) || defaultStorefrontPolicyBundle.seller.shopName,
        companyName:
          textValue(parsed.seller?.companyName) || defaultStorefrontPolicyBundle.seller.companyName,
        representativeName:
          textValue(parsed.seller?.representativeName) || defaultStorefrontPolicyBundle.seller.representativeName,
        businessRegistrationNumber:
          textValue(parsed.seller?.businessRegistrationNumber) ||
          defaultStorefrontPolicyBundle.seller.businessRegistrationNumber,
        mailOrderRegistrationNumber: textValue(parsed.seller?.mailOrderRegistrationNumber),
        businessAddress:
          textValue(parsed.seller?.businessAddress) || defaultStorefrontPolicyBundle.seller.businessAddress,
        supportPhone: textValue(parsed.seller?.supportPhone),
        supportEmail: textValue(parsed.seller?.supportEmail),
      },
    };
  } catch {
    return {
      ...structuredClone(defaultStorefrontPolicyBundle),
      message: rawValue,
    };
  }
}

export function serializeStorefrontPolicyBundle(
  value: Omit<StorefrontPolicyBundle, "schema" | "version">,
) {
  return JSON.stringify({
    schema: STOREFRONT_POLICY_SCHEMA,
    version: STOREFRONT_POLICY_VERSION,
    message: textValue(value.message),
    commerce: {
      baseShippingFee: nonNegativeInteger(
        value.commerce.baseShippingFee,
        defaultStorefrontPolicyBundle.commerce.baseShippingFee,
      ),
      freeShippingThreshold: nonNegativeInteger(
        value.commerce.freeShippingThreshold,
        defaultStorefrontPolicyBundle.commerce.freeShippingThreshold,
      ),
      remoteAreaFee: nonNegativeInteger(
        value.commerce.remoteAreaFee,
        defaultStorefrontPolicyBundle.commerce.remoteAreaFee,
      ),
      remoteAreaZipRanges: normalizeZipRanges(value.commerce.remoteAreaZipRanges),
      deliveryGuide: textValue(value.commerce.deliveryGuide),
      exchangeReturnGuide: textValue(value.commerce.exchangeReturnGuide),
      safetyTip: textValue(value.commerce.safetyTip),
    },
    seller: {
      shopName: textValue(value.seller.shopName),
      companyName: textValue(value.seller.companyName),
      representativeName: textValue(value.seller.representativeName),
      businessRegistrationNumber: textValue(value.seller.businessRegistrationNumber),
      mailOrderRegistrationNumber: textValue(value.seller.mailOrderRegistrationNumber),
      businessAddress: textValue(value.seller.businessAddress),
      supportPhone: textValue(value.seller.supportPhone),
      supportEmail: textValue(value.seller.supportEmail),
    },
  } satisfies StorefrontPolicyBundle);
}

export function calculateShippingBreakdown(
  productAmount: number,
  policy: StorefrontCommercePolicy,
  zipCode?: string | null,
): ShippingFeeBreakdown {
  const safeProductAmount = Math.max(0, Math.trunc(productAmount));
  const baseShippingFee =
    policy.baseShippingFee <= 0 ||
    (policy.freeShippingThreshold > 0 && safeProductAmount >= policy.freeShippingThreshold)
      ? 0
      : policy.baseShippingFee;
  const isRemoteArea = isRemoteAreaZipCode(zipCode, policy.remoteAreaZipRanges);
  const remoteAreaFee = isRemoteArea ? Math.max(0, Math.trunc(policy.remoteAreaFee)) : 0;

  return {
    baseShippingFee,
    isRemoteArea,
    remoteAreaFee,
    shippingFee: baseShippingFee + remoteAreaFee,
  };
}

export function calculateShippingFee(
  productAmount: number,
  policy: StorefrontCommercePolicy,
  zipCode?: string | null,
) {
  return calculateShippingBreakdown(productAmount, policy, zipCode).shippingFee;
}

export function remainingForFreeShipping(productAmount: number, policy: StorefrontCommercePolicy) {
  if (policy.freeShippingThreshold <= 0) {
    return 0;
  }

  return Math.max(0, policy.freeShippingThreshold - Math.max(0, Math.trunc(productAmount)));
}
