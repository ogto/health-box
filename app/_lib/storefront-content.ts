import { cache } from "react";

import {
  fetchDealerMallProduct,
  fetchDealerMallProductPage,
  fetchAdminCategories,
  fetchStorefrontNotice,
  fetchStorefrontNotices,
  fetchStorefrontProduct,
  fetchStorefrontProductPage,
  hasHealthBoxApi,
  type HealthBoxPageResponse,
  type HealthBoxRecord,
} from "./health-box-api";
import {
  findNoticeBySlug,
  findProductBySlug,
  mapNoticeRows,
  mapProductRows,
} from "./health-box-presenters";
import {
  notices as fallbackNotices,
  products as fallbackProducts,
  type Notice,
  type Product,
} from "./store-data";
import { getStorefrontRuntime } from "./storefront-runtime";

type StoreProductRow = ReturnType<typeof mapProductRows>["items"][number];
type StoreNoticeRow = ReturnType<typeof mapNoticeRows>[number];
type PublicStoreProductRow = StoreProductRow & {
  routeSlug?: string;
};

const fallbackImage = fallbackProducts[0]?.image || "";

function toProductPage(record: HealthBoxRecord | null) {
  if (!record) {
    return null;
  }

  const pageLike: HealthBoxPageResponse<HealthBoxRecord> = {
    content: [record],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 1,
  };

  return mapProductRows(pageLike).items[0] ?? null;
}

function toNoticeRow(record: HealthBoxRecord | null) {
  if (!record) {
    return null;
  }

  return mapNoticeRows([record])[0] ?? null;
}

function extractFallbackRecordId(slug: string, prefix: "product" | "notice") {
  const match = new RegExp(`^${prefix}-(\\d+)$`, "i").exec(slug);
  return match ? Number(match[1]) : null;
}

function decodeRouteSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function toStoreProduct(row: PublicStoreProductRow): Product {
  const image = row.image || row.gallery[0] || fallbackImage;
  const gallery = Array.from(new Set([image, ...row.gallery].filter(Boolean)));
  const summary = row.summary || row.subtitle || "";
  const description = row.description.length ? row.description : summary ? [summary] : [];
  const highlights = row.highlights.length
    ? row.highlights
    : [row.badge, row.category].filter(Boolean);
  const detailSections = row.detailSections.length
    ? row.detailSections
    : description.length
      ? [
          {
            title: row.title,
            body: description[0],
            image,
            imageAlt: row.title,
            caption: row.category || row.badge || "상품 정보",
          },
        ]
      : [];

  return {
    slug: row.slug,
    sourceSlug: row.routeSlug || row.sourceSlug,
    badge: row.badge || row.publishStatus || row.category || "상품",
    brand: row.brand || "건강창고",
    title: row.title,
    subtitle: row.subtitle || summary,
    category: row.category || "상품",
    deliveryPolicyText: row.deliveryPolicyText,
    review: row.review || "후기 정보 준비중",
    salesPolicyText: row.salesPolicyText,
    shipping: row.shipping || "배송 정보 준비중",
    price: row.price || "회원가 로그인 후 확인",
    image,
    gallery,
    summary,
    detailHtml: row.detailHtml,
    highlights,
    description,
    detailSections,
    specs: row.specs.length
      ? row.specs
      : [{ label: "배송 안내", value: row.shipping || "배송 정보 준비중" }],
    optionGroups: row.optionGroups,
    optionUseYn: row.optionUseYn,
    skus: row.skus,
  };
}

function mapStorefrontProductRows(page: HealthBoxPageResponse<HealthBoxRecord> | null) {
  return mapProductRows(page).items.map((row) => ({
    ...row,
    routeSlug: row.slug,
    slug: row.sourceSlug || row.slug,
  }));
}

function toStoreNotice(row: StoreNoticeRow): Notice {
  return {
    slug: row.slug,
    category: row.category || "공지",
    title: row.title,
    date: row.date || row.updatedAt,
    summary: row.summary,
    paragraphs: row.paragraphs.length ? row.paragraphs : row.summary ? [row.summary] : [],
    checklist: row.checklist,
  };
}

export const fetchStoreProducts = cache(async (query?: { q?: string; size?: number }) => {
  if (!hasHealthBoxApi()) {
    const keyword = query?.q?.trim().toLowerCase();
    if (!keyword) {
      return fallbackProducts;
    }

    return fallbackProducts.filter((product) =>
      [
        product.title,
        product.subtitle,
        product.summary,
        product.brand,
        product.category,
        product.badge,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }

  const keyword = query?.q?.trim();
  const runtime = await getStorefrontRuntime();
  const size = query?.size || 40;
  const page = runtime.dealer
    ? await fetchDealerMallProductPage(runtime.dealer.slug, { q: keyword, page: 1, size })
    : await fetchStorefrontProductPage({ q: keyword, page: 1, size });

  return mapStorefrontProductRows(page).map(toStoreProduct);
});

export const fetchStoreCategories = cache(async () => {
  if (!hasHealthBoxApi()) {
    return Array.from(new Set(fallbackProducts.map((product) => product.category).filter(Boolean)))
      .map((name, index) => ({
        href: `/products/best?menu=category&category=${encodeURIComponent(name)}`,
        key: `fallback-${index + 1}`,
        label: name,
      }));
  }

  const categories = await fetchAdminCategories({ revalidate: 60 });
  return (categories || [])
    .filter((category) => category.status !== "INACTIVE")
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((category, index) => {
      const label = category.name || category.categoryCode || `카테고리 ${index + 1}`;
      return {
        href: `/products/best?menu=category&category=${encodeURIComponent(label)}`,
        key: String(category.id || category.slug || category.categoryCode || index),
        label,
      };
    });
});

export const fetchStoreProductBySlug = cache(async (slug: string) => {
  const decodedSlug = decodeRouteSlug(slug);

  if (!hasHealthBoxApi()) {
    return fallbackProducts.find((product) => product.slug === decodedSlug) || null;
  }

  const runtime = await getStorefrontRuntime();
  const fallbackProductId = extractFallbackRecordId(decodedSlug, "product");
  const page = runtime.dealer
    ? await fetchDealerMallProductPage(runtime.dealer.slug, { q: decodedSlug, page: 1, size: 20 })
    : await fetchStorefrontProductPage({ q: decodedSlug, page: 1, size: 20 });
  const listedProduct = findProductBySlug(mapStorefrontProductRows(page), decodedSlug);
  const detailedProduct = runtime.dealer
    ? toProductPage(await fetchDealerMallProduct(runtime.dealer.slug, listedProduct?.sourceSlug || decodedSlug))
    : listedProduct?.recordId || fallbackProductId
      ? toProductPage(await fetchStorefrontProduct(listedProduct?.recordId || fallbackProductId || 0))
      : null;
  const mergedProduct =
    listedProduct && detailedProduct
      ? { ...listedProduct, ...detailedProduct }
      : detailedProduct || listedProduct;

  return mergedProduct ? toStoreProduct(mergedProduct) : null;
});

export const fetchStoreNotices = cache(async () => {
  if (!hasHealthBoxApi()) {
    return fallbackNotices;
  }

  const notices = await fetchStorefrontNotices();
  return mapNoticeRows(notices).map(toStoreNotice);
});

export const fetchStoreNoticeBySlug = cache(async (slug: string) => {
  if (!hasHealthBoxApi()) {
    return fallbackNotices.find((notice) => notice.slug === slug) || null;
  }

  const fallbackNoticeId = extractFallbackRecordId(slug, "notice");
  const notices = await fetchStorefrontNotices();
  const listedNotice = findNoticeBySlug(mapNoticeRows(notices), slug);
  const detailedNotice =
    listedNotice?.recordId || fallbackNoticeId
      ? toNoticeRow(await fetchStorefrontNotice(listedNotice?.recordId || fallbackNoticeId || 0))
      : null;
  const mergedNotice =
    listedNotice && detailedNotice
      ? { ...listedNotice, ...detailedNotice }
      : detailedNotice || listedNotice;

  return mergedNotice ? toStoreNotice(mergedNotice) : null;
});
