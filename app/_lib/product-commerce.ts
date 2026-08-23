const PRODUCT_POLICY_SCHEMA = "health-box-product-policy";
const PRODUCT_POLICY_VERSION = 1;

export type ProductInformationItem = {
  label: string;
  value: string;
};

export type ProductDisclosureType = "GENERAL" | "HEALTH_FUNCTIONAL_FOOD" | "PROCESSED_FOOD";

export type ProductCommercePolicy = {
  bundleProductSlugs: string[];
  categoryIds: number[];
  cautions: string;
  disclosureItems: ProductInformationItem[];
  disclosureSource: "DETAIL_HTML" | "STRUCTURED";
  disclosureType: ProductDisclosureType;
  exchangeReturnGuide: string;
  purchaseInformation: ProductInformationItem[];
  safetyTip: string;
  salesPolicyText: string;
};

type SerializedProductPolicy = ProductCommercePolicy & {
  schema: typeof PRODUCT_POLICY_SCHEMA;
  version: typeof PRODUCT_POLICY_VERSION;
};

export const defaultProductCommercePolicy: ProductCommercePolicy = {
  salesPolicyText: "",
  exchangeReturnGuide: "",
  cautions: "",
  safetyTip: "",
  disclosureSource: "STRUCTURED",
  disclosureType: "HEALTH_FUNCTIONAL_FOOD",
  disclosureItems: [],
  purchaseInformation: [],
  categoryIds: [],
  bundleProductSlugs: [],
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniquePositiveIntegers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map(Number)
        .filter((item) => Number.isSafeInteger(item) && item > 0),
    ),
  );
}

function uniqueStrings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map(textValue).filter(Boolean)));
}

function informationItems(value: unknown): ProductInformationItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return { label: textValue(record.label), value: textValue(record.value) };
    })
    .filter((item) => item.label && item.value);
}

export function parseInformationLines(value: string | null | undefined): ProductInformationItem[] {
  return textValue(value)
    .split(/\r?\n/)
    .map((line) => {
      const separatorIndex = line.search(/[:：|]/);
      if (separatorIndex < 1) {
        return null;
      }

      const label = line.slice(0, separatorIndex).trim();
      const itemValue = line.slice(separatorIndex + 1).trim();
      return label && itemValue ? { label, value: itemValue } : null;
    })
    .filter((item): item is ProductInformationItem => Boolean(item));
}

export function formatInformationLines(items: ProductInformationItem[]) {
  return items.map((item) => `${item.label}: ${item.value}`).join("\n");
}

export function parseProductCommercePolicy(value: string | null | undefined): ProductCommercePolicy {
  const rawValue = textValue(value);
  if (!rawValue) {
    return { ...defaultProductCommercePolicy };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SerializedProductPolicy>;
    if (parsed.schema !== PRODUCT_POLICY_SCHEMA || parsed.version !== PRODUCT_POLICY_VERSION) {
      throw new Error("Legacy product policy");
    }

    const disclosureType: ProductDisclosureType =
      parsed.disclosureType === "GENERAL" ||
      parsed.disclosureType === "PROCESSED_FOOD" ||
      parsed.disclosureType === "HEALTH_FUNCTIONAL_FOOD"
        ? parsed.disclosureType
        : defaultProductCommercePolicy.disclosureType;

    return {
      salesPolicyText: textValue(parsed.salesPolicyText),
      exchangeReturnGuide: textValue(parsed.exchangeReturnGuide),
      cautions: textValue(parsed.cautions),
      safetyTip: textValue(parsed.safetyTip),
      disclosureSource: parsed.disclosureSource === "DETAIL_HTML" ? "DETAIL_HTML" : "STRUCTURED",
      disclosureType,
      disclosureItems: informationItems(parsed.disclosureItems),
      purchaseInformation: informationItems(parsed.purchaseInformation),
      categoryIds: uniquePositiveIntegers(parsed.categoryIds),
      bundleProductSlugs: uniqueStrings(parsed.bundleProductSlugs),
    };
  } catch {
    return {
      ...defaultProductCommercePolicy,
      salesPolicyText: rawValue,
    };
  }
}

export function serializeProductCommercePolicy(value: ProductCommercePolicy) {
  return JSON.stringify({
    schema: PRODUCT_POLICY_SCHEMA,
    version: PRODUCT_POLICY_VERSION,
    salesPolicyText: textValue(value.salesPolicyText),
    exchangeReturnGuide: textValue(value.exchangeReturnGuide),
    cautions: textValue(value.cautions),
    safetyTip: textValue(value.safetyTip),
    disclosureSource: value.disclosureSource === "DETAIL_HTML" ? "DETAIL_HTML" : "STRUCTURED",
    disclosureType: value.disclosureType,
    disclosureItems: informationItems(value.disclosureItems),
    purchaseInformation: informationItems(value.purchaseInformation),
    categoryIds: uniquePositiveIntegers(value.categoryIds),
    bundleProductSlugs: uniqueStrings(value.bundleProductSlugs),
  } satisfies SerializedProductPolicy);
}
