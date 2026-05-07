import type { Product, Notice } from "./store-data";
import {
  dateTimeValue,
  formatWon,
  idValue,
  numberValue,
  stringValue,
  toneFromStatus,
  type HealthBoxPageResponse,
  type HealthBoxRecord,
} from "./health-box-api";

type AdminTone = "blue" | "cyan" | "green" | "gold" | "violet" | "rose";
const CDN_BASE_URL = "https://cdn.1472.ai";

function tone(status: string): AdminTone {
  return toneFromStatus(status);
}

function textOrDash(value: string, fallback = "-") {
  return value || fallback;
}

function normalizeProductImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\/cloud\.1472\.ai\/downloadFile\//i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/cloud\.1472\.ai\/downloadFile\//i, `${CDN_BASE_URL}/`);
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  return new URL(trimmed.replace(/^\/?/, "/"), CDN_BASE_URL).toString();
}

function splitNoticeParagraphs(record: HealthBoxRecord) {
  if (Array.isArray(record.paragraphs)) {
    return (record.paragraphs as string[]).filter(Boolean);
  }

  const source = stringValue(record, "content", "body");
  if (source) {
    return noticeBodyToText(source)
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function noticeBodyHtml(record: HealthBoxRecord) {
  const source = stringValue(record, "content", "body");
  if (!source || !/<\/?[a-z][\s\S]*>/i.test(source)) {
    return "";
  }

  return source;
}

function noticeBodyToText(body: string) {
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function noticeSummaryValue(record: HealthBoxRecord) {
  const summary = stringValue(record, "summary");
  if (summary) {
    return summary;
  }

  const paragraphs = splitNoticeParagraphs(record);
  if (!paragraphs.length) {
    return "";
  }

  const joined = paragraphs.join(" ");
  return joined.length > 120 ? `${joined.slice(0, 117)}...` : joined;
}

function productCategoryLabel(product: HealthBoxRecord) {
  const categoryName = stringValue(product, "categoryName", "category");
  if (categoryName) {
    return categoryName;
  }

  const categoryId = idValue(product, "categoryId");
  return categoryId === null ? "" : `카테고리 ID ${categoryId}`;
}

function productStockQuantity(product: HealthBoxRecord) {
  const totalStockQuantity = numberValue(product, "totalStockQuantity");
  if (totalStockQuantity !== null) {
    return totalStockQuantity;
  }

  if (Array.isArray(product.skus)) {
    return product.skus.reduce((sum, sku) => {
      if (!sku || typeof sku !== "object") {
        return sum;
      }

      return sum + (numberValue(sku as HealthBoxRecord, "stockQuantity") ?? 0);
    }, 0);
  }

  return numberValue(product, "inventoryCount", "stockQuantity") ?? 0;
}

function stringArrayValue(record: HealthBoxRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    }

    if (typeof value === "string" && value.trim()) {
      const trimmed = value.trim();
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
        }
      } catch {
        return trimmed
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
  }

  return [];
}

function productMediaUrls(product: HealthBoxRecord) {
  if (!Array.isArray(product.mediaItems)) {
    return [];
  }

  return product.mediaItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const mediaUrl = (item as HealthBoxRecord).mediaUrl;
      return typeof mediaUrl === "string" ? normalizeProductImageUrl(mediaUrl) : "";
    })
    .filter(Boolean);
}

function dealerStatusLabel(status: string) {
  if (!status) {
    return "-";
  }

  if (/^ACTIVE$/i.test(status)) {
    return "운영중";
  }

  if (/^APPROVED$/i.test(status)) {
    return "승인완료";
  }

  if (/^PENDING$/i.test(status)) {
    return "승인대기";
  }

  if (/^REJECTED$/i.test(status)) {
    return "반려";
  }

  return status;
}

function countDealerMembers(
  members: HealthBoxRecord[] | null,
  dealerMallId: number,
  mallName: string,
  displayName: string,
) {
  if (!members?.length) {
    return 0;
  }

  return members.filter((member) => {
    const memberDealerId = idValue(member, "dealerMallId");
    if (memberDealerId !== null) {
      return memberDealerId === dealerMallId;
    }

    const memberDealerName = stringValue(member, "dealerMallName", "mallName", "dealer", "organization");
    if (!memberDealerName) {
      return false;
    }

    return memberDealerName === mallName || memberDealerName === displayName;
  }).length;
}

function zeroMetric(label: string, hint: string, toneValue: AdminTone) {
  return {
    label,
    value: "0건",
    hint,
    tone: toneValue,
  };
}

function countPendingApplications(records: HealthBoxRecord[] | null) {
  if (!records?.length) {
    return 0;
  }

  return records.filter((record) => {
    const status = stringValue(record, "status");
    return !status || /^PENDING$/i.test(status);
  }).length;
}

function parseRecordDate(record: HealthBoxRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value.map(Number);
      if (year && month && day) {
        const date = new Date(year, month - 1, day, hour, minute, second);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    }

    const text = String(value || "").trim();
    if (text) {
      const date = new Date(text);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isTodayOrder(order: HealthBoxRecord) {
  const date = parseRecordDate(order, "orderedAt", "orderAt", "placedAt", "createdAt");
  return date ? dateKey(date) === dateKey(new Date()) : false;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function orderPendingAgeInfo(order: HealthBoxRecord, shipmentStatus: string, displayStatus: string) {
  if (!/^PENDING$/i.test(shipmentStatus) && !/주문\s*접수/.test(displayStatus)) {
    return null;
  }

  const orderedAt = parseRecordDate(order, "orderedAt", "orderAt", "placedAt", "createdAt");
  if (!orderedAt) {
    return null;
  }

  const diffMs = startOfLocalDay(new Date()).getTime() - startOfLocalDay(orderedAt).getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  return {
    label: `D+${days}`,
    tone: days >= 3 ? "rose" as const : days >= 1 ? "gold" as const : "cyan" as const,
  };
}

export function buildDashboardMetrics(orders: HealthBoxRecord[] | null, dealerApps: HealthBoxRecord[] | null, buyerApps: HealthBoxRecord[] | null) {
  if (!orders && !dealerApps && !buyerApps) {
    return [
      zeroMetric("오늘 주문", "실데이터 없음", "blue"),
      zeroMetric("주문 처리 대기", "실데이터 없음", "cyan"),
      zeroMetric("승인대기 회원", "실데이터 없음", "gold"),
      zeroMetric("승인대기 딜러", "실데이터 없음", "violet"),
    ];
  }

  const todayOrders = orders?.filter(isTodayOrder).length ?? 0;
  const processingOrders =
    orders?.filter((order) => {
      const orderStatus = stringValue(order, "orderStatus", "status").toUpperCase();
      const shipmentStatus = stringValue(order, "shipmentStatus").toUpperCase();
      if (/CANCELED|SHIPPED|DELIVERED|PREPARING|취소|배송|상품\s*준비/.test(shipmentStatus)) {
        return false;
      }

      return /ORDERED|PENDING|주문\s*접수/.test(shipmentStatus || orderStatus);
    }).length ?? 0;
  const pendingDealerCount = countPendingApplications(dealerApps);
  const pendingBuyerCount = countPendingApplications(buyerApps);

  return [
    { label: "오늘 주문", value: `${todayOrders}건`, hint: "주문일 기준", tone: "blue" as const },
    { label: "주문 처리 대기", value: `${processingOrders}건`, hint: "접수/상품 준비 기준", tone: "cyan" as const },
    { label: "승인대기 회원", value: `${pendingBuyerCount}건`, hint: "회원관리에서 처리", tone: "gold" as const },
    { label: "승인대기 딜러", value: `${pendingDealerCount}건`, hint: "딜러몰관리에서 처리", tone: "violet" as const },
  ];
}

export function buildProductMetrics(page: HealthBoxPageResponse<HealthBoxRecord> | null) {
  if (!page?.content?.length) {
    return [
      zeroMetric("등록 상품", "실데이터 없음", "blue"),
      zeroMetric("현재 조회", "실데이터 없음", "cyan"),
      zeroMetric("운영중 상품", "실데이터 없음", "green"),
      zeroMetric("주의 필요", "실데이터 없음", "gold"),
    ];
  }

  const publishStatuses = page.content.map((item) => stringValue(item, "publishStatus"));
  const activeCount = publishStatuses.filter((status) => /노출|판매|운영/.test(status)).length;
  const cautionCount = publishStatuses.filter((status) => /주의|검수|대기|중지/.test(status)).length;

  return [
    {
      label: "등록 상품",
      value: `${page.totalElements}개`,
      hint: "API 조회 기준",
      tone: "blue" as const,
    },
    {
      label: "현재 조회",
      value: `${page.content.length}개`,
      hint: `페이지 ${page.number + 1}`,
      tone: "cyan" as const,
    },
    {
      label: "운영중 상품",
      value: `${activeCount}개`,
      hint: "현재 조회 상태값 기준",
      tone: "green" as const,
    },
    {
      label: "주의 필요",
      value: `${cautionCount}개`,
      hint: "재고/검수/중지 상태 포함",
      tone: "gold" as const,
    },
  ];
}

export function mapRecentOrders(orders: HealthBoxRecord[] | null) {
  if (!orders?.length) {
    return [];
  }

  return [...orders]
    .sort((first, second) => {
      const firstDate = parseRecordDate(first, "orderedAt", "orderAt", "placedAt", "createdAt")?.getTime() ?? 0;
      const secondDate = parseRecordDate(second, "orderedAt", "orderAt", "placedAt", "createdAt")?.getTime() ?? 0;
      return secondDate - firstDate;
    })
    .slice(0, 5)
    .map((order, index) => {
      const orderStatus = stringValue(order, "orderStatus", "status");
      const shipmentStatus = stringValue(order, "shipmentStatus");
      const status = adminOrderDisplayStatus(orderStatus, shipmentStatus);
      const pendingAge = orderPendingAgeInfo(order, shipmentStatus, status);
      const fallbackId = idValue(order, "id", "orderId") ?? index + 1;
      return {
        id: idValue(order, "id", "orderId"),
        number: textOrDash(stringValue(order, "orderNo", "number", "id"), `ORDER-${fallbackId}`),
        member: textOrDash(stringValue(order, "dealerMallName", "mallName", "company")),
        items: orderItemSummary(order),
        amount: formatWon(numberValue(order, "totalPaymentAmount", "amount", "totalAmount") ?? 0),
        status,
        statusTone: tone(`${orderStatus} ${shipmentStatus} ${status}`),
        pendingAgeLabel: pendingAge?.label || "",
        pendingAgeTone: pendingAge?.tone || "cyan",
        date: textOrDash(dateTimeValue(order, "orderedAt", "orderAt", "placedAt", "createdAt")),
      };
    });
}

export function mapApprovalQueue(
  dealerApps: HealthBoxRecord[] | null,
  buyerApps: HealthBoxRecord[] | null,
) {
  if (!dealerApps?.length && !buyerApps?.length) {
    return [];
  }

  const dealerItems = (dealerApps ?? []).map((item) => ({
    id: idValue(item, "id", "applicationId") ?? Math.random(),
    kind: "dealer" as const,
    name: textOrDash(stringValue(item, "applicantName", "name", "wantedMallName"), "딜러 신청"),
    type: "딜러 신청",
    submittedAt: textOrDash(dateTimeValue(item, "createdAt", "submittedAt", "requestedAt")),
    note: textOrDash(
      stringValue(item, "reviewMemo", "wantedMallName", "wantedSlug"),
      "신규 딜러몰 운영 신청",
    ),
  }));

  const buyerItems = (buyerApps ?? []).map((item) => ({
    id: idValue(item, "id", "applicationId") ?? Math.random(),
    kind: "buyer" as const,
    name: textOrDash(stringValue(item, "name", "buyerName"), "회원 신청"),
    type: "회원 신청",
    submittedAt: textOrDash(dateTimeValue(item, "createdAt", "submittedAt", "requestedAt")),
    note: textOrDash(
      stringValue(item, "dealerMallName", "memo", "email"),
      "회원 가입 승인 요청",
    ),
  }));

  return [...dealerItems, ...buyerItems];
}

export function buildDealerMetrics(dealers: HealthBoxRecord[] | null, members: HealthBoxRecord[] | null, dealerApps: HealthBoxRecord[] | null) {
  const pendingDealerCount = countPendingApplications(dealerApps);

  if (!dealers?.length) {
    return [
      { label: "전체 딜러몰", value: "0개", hint: "실데이터 없음", tone: "blue" as const },
      { label: "전체 회원", value: `${members?.length ?? 0}명`, hint: "구매 회원 기준", tone: "cyan" as const },
      { label: "활성 딜러", value: "0개", hint: "실데이터 없음", tone: "green" as const },
      { label: "승인 대기", value: `${pendingDealerCount}건`, hint: "신규 딜러 신청", tone: "gold" as const },
    ];
  }

  return [
    { label: "전체 딜러몰", value: `${dealers.length}개`, hint: "API 기준", tone: "blue" as const },
    { label: "전체 회원", value: `${members?.length ?? 0}명`, hint: "구매 회원 기준", tone: "cyan" as const },
    { label: "활성 딜러", value: `${dealers.filter((item) => /ACTIVE|APPROVED|운영/.test(stringValue(item, "status"))).length}개`, hint: "운영 상태 기준", tone: "green" as const },
    { label: "승인 대기", value: `${pendingDealerCount}건`, hint: "신규 딜러 신청", tone: "gold" as const },
  ];
}

export function mapDealerRows(dealers: HealthBoxRecord[] | null, members: HealthBoxRecord[] | null = null) {
  if (!dealers?.length) {
    return [];
  }

  return dealers.map((dealer, index) => {
    const rawStatus = textOrDash(stringValue(dealer, "status"));
    const fallbackId = idValue(dealer, "id", "dealerMallId") ?? index + 1;
    const mallName = textOrDash(stringValue(dealer, "mallName", "name"), `딜러몰 ${fallbackId}`);
    const displayName = stringValue(dealer, "displayName");
    const slug = textOrDash(stringValue(dealer, "slug"), `dealer-${fallbackId}`);
    const explicitMemberCount = numberValue(dealer, "memberCount", "buyerMemberCount", "buyerCount");
    const memberCount = explicitMemberCount ?? countDealerMembers(members, fallbackId, mallName, displayName || "");
    const contactEmail = stringValue(dealer, "supportEmail");
    const contactPhone = stringValue(dealer, "supportPhone", "representativePhone");

    return {
      id: fallbackId,
      slug,
      domain: `${slug}.everybuy.co.kr`,
      name: mallName,
      displayName: displayName || "",
      dealerCode: textOrDash(stringValue(dealer, "dealerCode"), `ID ${fallbackId}`),
      joinedAt: textOrDash(dateTimeValue(dealer, "joinedAt", "approvedAt", "createdAt")),
      orderCount: `${numberValue(dealer, "orderCount", "totalOrderCount") ?? 0}건`,
      memberCount: `${memberCount}명`,
      totalSales: formatWon(numberValue(dealer, "totalSales", "grossSales", "salesAmount") ?? 0),
      status: dealerStatusLabel(rawStatus),
      tone: tone(rawStatus),
      supportEmail: contactEmail,
      supportPhone: contactPhone,
    };
  });
}

export function buildMemberMetrics(members: HealthBoxRecord[] | null, dealers: HealthBoxRecord[] | null, buyerApps: HealthBoxRecord[] | null) {
  const pendingBuyerCount = countPendingApplications(buyerApps);

  if (!members?.length) {
    return [
      { label: "전체 회원", value: "0명", hint: "실데이터 없음", tone: "blue" as const },
      { label: "활성 딜러몰", value: `${dealers?.length ?? 0}개`, hint: "회원 귀속 기준", tone: "cyan" as const },
      { label: "활성 회원", value: "0명", hint: "실데이터 없음", tone: "green" as const },
      { label: "승인 대기", value: `${pendingBuyerCount}명`, hint: "가입 승인 요청", tone: "gold" as const },
    ];
  }

  return [
    { label: "전체 회원", value: `${members.length}명`, hint: "구매 회원 기준", tone: "blue" as const },
    { label: "활성 딜러몰", value: `${dealers?.length ?? 0}개`, hint: "회원 귀속 기준", tone: "cyan" as const },
    { label: "활성 회원", value: `${members.filter((item) => /ACTIVE|활성/.test(stringValue(item, "status"))).length}명`, hint: "상태 기준", tone: "green" as const },
    { label: "승인 대기", value: `${pendingBuyerCount}명`, hint: "가입 승인 요청", tone: "gold" as const },
  ];
}

export function mapMemberRows(members: HealthBoxRecord[] | null) {
  if (!members?.length) {
    return [];
  }

  return members.map((member) => {
    const status = textOrDash(stringValue(member, "status"));
    const phone = stringValue(member, "phone", "mobile", "tel");
    const email = stringValue(member, "email");
    const contact = [phone, email].filter(Boolean).join(" / ");

    return {
      id: idValue(member, "id", "buyerMemberId"),
      name: textOrDash(stringValue(member, "name", "buyerName", "memberName"), "이름 없음"),
      phone: textOrDash(phone),
      email: textOrDash(email),
      dealerId: idValue(member, "dealerMallId"),
      dealer: textOrDash(stringValue(member, "dealerMallName", "mallName", "dealer")),
      organization: textOrDash(stringValue(member, "organization")),
      contact: textOrDash(contact),
      joinedAt: textOrDash(dateTimeValue(member, "joinedAt", "approvedAt", "createdAt")),
      orders: textOrDash(
        stringValue(member, "orderCount", "orders"),
        `${numberValue(member, "orderCount", "orders") ?? 0}건`,
      ),
      purchases: formatWon(numberValue(member, "purchaseAmount", "purchases", "totalPurchaseAmount") ?? 0),
      status,
      tone: tone(status),
    };
  });
}

export function buildOrderMetrics(orders: HealthBoxRecord[] | null) {
  if (!orders?.length) {
    return [
      zeroMetric("결제 완료", "실데이터 없음", "blue"),
      zeroMetric("배송 준비", "실데이터 없음", "cyan"),
      zeroMetric("주문 수", "실데이터 없음", "green"),
      zeroMetric("취소/반품", "실데이터 없음", "rose"),
    ];
  }

  const orderStatuses = orders.map((item) => stringValue(item, "orderStatus", "status"));
  const shipmentStatuses = orders.map((item) => stringValue(item, "shipmentStatus"));

  return [
    { label: "주문 완료", value: `${orderStatuses.filter((item) => /ORDERED|주문/.test(item)).length}건`, hint: "결제 후 접수", tone: "blue" as const },
    { label: "배송 준비", value: `${shipmentStatuses.filter((item) => /PENDING|PREPARING|배송 준비|송장/.test(item)).length}건`, hint: "출고 대기 기준", tone: "cyan" as const },
    { label: "주문 수", value: `${orders.length}건`, hint: "전체 주문", tone: "green" as const },
    { label: "취소/반품", value: `${orderStatuses.filter((item) => /CANCELED|취소|반품/.test(item)).length}건`, hint: "차감 가능 주문", tone: "rose" as const },
  ];
}

function orderItemSummary(order: HealthBoxRecord) {
  const items = Array.isArray(order.items) ? (order.items as HealthBoxRecord[]) : [];
  if (!items.length) {
    return textOrDash(stringValue(order, "productSummary", "productName", "items"), "주문 상품 없음");
  }

  const firstName = textOrDash(stringValue(items[0], "productNameSnapshot", "productName"), "상품명 없음");
  return items.length > 1 ? `${firstName} 외 ${items.length - 1}건` : firstName;
}

function orderItemDetailLines(order: HealthBoxRecord) {
  const items = Array.isArray(order.items) ? (order.items as HealthBoxRecord[]) : [];

  return items.map((item) => {
    const productName = textOrDash(stringValue(item, "productNameSnapshot", "productName"), "상품명 없음");
    const rawOptionValues = [stringValue(item, "optionSummarySnapshot"), stringValue(item, "skuNameSnapshot")]
      .map((value) => value.trim())
      .filter((value) => value && value !== productName && value !== "상품" && value !== "기본 상품");
    const optionValues = rawOptionValues
      .filter((value, index, array) => array.findIndex((itemValue) => itemValue === value || itemValue.includes(value)) === index);
    const quantity = numberValue(item, "quantity") ?? 0;
    const lineAmount = numberValue(item, "lineAmount") ?? 0;
    const optionParts = optionValues.length === 1 ? optionValues[0].split(/\s*[/·,]\s*/).filter(Boolean) : optionValues;
    const inferredNames = optionParts.length === 2 ? ["사이즈", "색상"] : optionParts.length === 3 ? ["사이즈", "색상", "옵션"] : [];

    return {
      amount: formatWon(lineAmount),
      option: optionValues.join(" · ") || "없음",
      optionPairs: optionParts.map((part, index) => {
        const [name, ...rest] = part.split(/\s*[:：]\s*/);
        return rest.length
          ? { name: name.trim() || "옵션", value: rest.join(":").trim() || "-" }
          : { name: inferredNames[index] || "옵션", value: part };
      }),
      productName,
      quantity,
    };
  });
}

function adminShipmentStatusLabel(value: string) {
  const status = value.toUpperCase();
  const labels: Record<string, string> = {
    PENDING: "주문 접수",
    PREPARING: "상품 준비중",
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    PARTIALLY_CANCELED: "부분취소",
  };
  return labels[status] || value;
}

function adminOrderStatusLabel(value: string) {
  const status = value.toUpperCase();
  const labels: Record<string, string> = {
    ORDERED: "주문완료",
    PREPARING: "상품준비",
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    PARTIALLY_CANCELED: "부분취소",
  };
  return labels[status] || value;
}

function adminOrderDisplayStatus(orderStatus: string, shipmentStatus: string) {
  if (/CANCELED|취소/i.test(orderStatus)) {
    return adminOrderStatusLabel(orderStatus);
  }

  if (/CANCELED|취소/i.test(shipmentStatus)) {
    return "취소완료";
  }

  if (shipmentStatus) {
    return adminShipmentStatusLabel(shipmentStatus);
  }

  return adminOrderStatusLabel(orderStatus);
}

export function mapOrderRows(orders: HealthBoxRecord[] | null) {
  if (!orders?.length) {
    return [];
  }

  return orders.map((order, index) => {
    const orderStatus = stringValue(order, "orderStatus", "status");
    const shipmentStatus = stringValue(order, "shipmentStatus");
    const status = adminOrderDisplayStatus(orderStatus, shipmentStatus);
    const pendingAge = orderPendingAgeInfo(order, shipmentStatus, status);
    const fallbackId = idValue(order, "id", "orderId") ?? index + 1;

    return {
      id: idValue(order, "id", "orderId"),
      number: textOrDash(stringValue(order, "orderNo", "number", "id"), `ORDER-${fallbackId}`),
      company: textOrDash(stringValue(order, "dealerNameSnapshot", "dealerMallName", "mallName", "company")),
      companyType: textOrDash(stringValue(order, "companyType", "memberType")),
      buyer: textOrDash(stringValue(order, "ordererName", "buyerName", "memberName", "buyer")),
      buyerPhone: textOrDash(stringValue(order, "ordererPhone", "buyerPhone", "receiverPhone")),
      buyerType: textOrDash(stringValue(order, "buyerType", "memberType")),
      items: orderItemSummary(order),
      itemDetails: orderItemDetailLines(order),
      amount: formatWon(numberValue(order, "totalPaymentAmount", "amount", "totalAmount") ?? 0),
      status,
      orderStatus,
      shipmentStatus,
      paymentStatus: stringValue(order, "paymentStatus"),
      tone: tone(`${orderStatus} ${shipmentStatus} ${status}`),
      pendingAgeLabel: pendingAge?.label || "",
      pendingAgeTone: pendingAge?.tone || "cyan",
      placedAt: textOrDash(dateTimeValue(order, "orderedAt", "orderAt", "placedAt", "createdAt")),
      shipmentId: idValue(order, "shipmentId"),
    };
  });
}

export function buildNoticeMetrics(notices: HealthBoxRecord[] | null) {
  if (!notices?.length) {
    return [
      zeroMetric("게시중 공지", "실데이터 없음", "blue"),
      zeroMetric("상단 고정", "실데이터 없음", "cyan"),
      zeroMetric("이번 달 등록", "실데이터 없음", "green"),
      zeroMetric("임시 저장", "실데이터 없음", "gold"),
    ];
  }

  const fixedCount = notices.filter((item) => /고정/.test(stringValue(item, "status"))).length;

  return [
    { label: "게시중 공지", value: `${notices.length}건`, hint: "현재 조회 결과 기준", tone: "blue" as const },
    { label: "상단 고정", value: `${fixedCount}건`, hint: "상태값 기준", tone: "cyan" as const },
    { label: "이번 달 등록", value: `${notices.length}건`, hint: "운영 공지 기준", tone: "green" as const },
    { label: "임시 저장", value: "0건", hint: "별도 API 미연동", tone: "gold" as const },
  ];
}

export function mapNoticeRows(notices: HealthBoxRecord[] | null) {
  if (!notices?.length) {
    return [];
  }

  return notices.map((notice, index) => {
    const apiRecordId = idValue(notice, "id", "noticeId");
    const recordId = apiRecordId ?? index + 1;
    const postStatus = stringValue(notice, "postStatus", "status");
    const pinnedYn = stringValue(notice, "pinnedYn");
    const status = pinnedYn === "Y" ? "상단 고정" : /draft/i.test(postStatus) ? "임시 저장" : "게시중";
    const sourceSlug = textOrDash(stringValue(notice, "slug"), "");
    const routeSlug = apiRecordId !== null ? `notice-${apiRecordId}` : textOrDash(sourceSlug, `notice-${recordId}`);

    return {
      recordId: apiRecordId ?? null,
      id: recordId,
      slug: routeSlug,
      sourceSlug: sourceSlug || routeSlug,
      category: textOrDash(stringValue(notice, "noticeType", "category"), "운영안내"),
      title: textOrDash(stringValue(notice, "title"), "제목 없음"),
      summary: textOrDash(noticeSummaryValue(notice), ""),
      date: textOrDash(dateTimeValue(notice, "postedAt", "date", "createdAt", "updatedAt")),
      status,
      tone: tone(status),
      updatedAt: textOrDash(dateTimeValue(notice, "updatedAt", "postedAt", "createdAt")),
      editor: textOrDash(stringValue(notice, "editor", "writer", "createdBy", "authorAccountId")),
      visibility: textOrDash(stringValue(notice, "visibility")),
      previewHref: `/notice/${routeSlug}`,
      adminHref: `/admin/notices/${routeSlug}`,
      editHref: `/admin/notices/${routeSlug}/edit`,
      bodyHtml: noticeBodyHtml(notice),
      paragraphs: splitNoticeParagraphs(notice),
      checklist: Array.isArray(notice.checklist) ? (notice.checklist as string[]) : [],
    };
  });
}

export function findNoticeBySlug(notices: ReturnType<typeof mapNoticeRows>, slug: string) {
  return notices.find((notice) => notice.slug === slug || notice.sourceSlug === slug);
}

export function mapProductRows(page: HealthBoxPageResponse<HealthBoxRecord> | null) {
  if (!page?.content?.length) {
    return {
      items: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
    };
  }

  const items = page.content.map((product, index) => {
    const apiRecordId = idValue(product, "id", "productId");
    const recordId = apiRecordId ?? index + 1;
    const sourceSlug = textOrDash(stringValue(product, "slug"), "");
    const routeSlug = apiRecordId !== null ? `product-${apiRecordId}` : textOrDash(sourceSlug, `product-${recordId}`);
    const publishStatus = textOrDash(stringValue(product, "publishStatus"));
    const badge = stringValue(product, "badge");
    const categoryLabel = productCategoryLabel(product);
    const memberPrice = numberValue(product, "memberPrice", "consumerPrice");
    const consumerPrice = numberValue(product, "consumerPrice");
    const supplyPrice = numberValue(product, "supplyPrice");
    const settlementBasePrice = numberValue(product, "settlementBasePrice");
    const plainPrice = stringValue(product, "price");
    const mediaUrls = productMediaUrls(product);
    const stockQuantity = productStockQuantity(product);

    return {
      recordId: apiRecordId ?? null,
      categoryId: idValue(product, "categoryId") ?? null,
      categoryQueryValue: stringValue(product, "categoryName", "category"),
      id: textOrDash(stringValue(product, "productCode", "code", "id"), String(recordId)),
      productCode: stringValue(product, "productCode"),
      slug: routeSlug,
      sourceSlug: sourceSlug || routeSlug,
      adminHref: `/admin/products/${routeSlug}`,
      previewHref: `/product/${routeSlug}`,
      brand: textOrDash(stringValue(product, "brandName", "brand")),
      title: textOrDash(stringValue(product, "name", "title"), "제목 없음"),
      subtitle: textOrDash(stringValue(product, "subtitle", "summary", "summaryText"), ""),
      category: textOrDash(categoryLabel),
      categoryCode: stringValue(product, "categoryCode"),
      status: textOrDash(stringValue(product, "status"), "ACTIVE"),
      optionUseYn: stringValue(product, "optionUseYn") || "N",
      consumerPrice,
      memberPrice,
      supplyPrice,
      settlementBasePrice,
      priceExposurePolicy: stringValue(product, "priceExposurePolicy"),
      salesPolicyText: stringValue(product, "salesPolicyText"),
      deliveryPolicyText: stringValue(product, "deliveryPolicyText"),
      sortOrder: numberValue(product, "sortOrder"),
      badge,
      publishStatus,
      publishTone: tone(publishStatus),
      statusTone: tone(badge || publishStatus),
      monthlySales: formatWon(numberValue(product, "monthlySales", "salesAmount") ?? 0),
      inventoryCount: String(stockQuantity),
      totalStockQuantity: stockQuantity,
      updatedAt: textOrDash(dateTimeValue(product, "updatedAt", "createdAt")),
      image:
        normalizeProductImageUrl(
          stringValue(
            product,
            "thumbnailUrl",
            "image",
            "imageUrl",
            "mainImageUrl",
            "thumbUrl",
            "fileDownloadUri",
            "prdImgFlpth",
            "extrlImgUrl",
          ),
        ) ||
        mediaUrls[0] ||
        "",
      shipping: textOrDash(stringValue(product, "shipping", "deliveryPolicyText")),
      summary: textOrDash(stringValue(product, "summary", "summaryText"), ""),
      detailHtml: stringValue(product, "detailHtml"),
      gallery: mediaUrls.length ? mediaUrls : stringArrayValue(product, "gallery", "images", "imageUrls", "detailImages"),
      highlights: Array.isArray(product.highlights) ? (product.highlights as string[]) : [],
      detailSections: Array.isArray(product.detailSections)
        ? (product.detailSections as Product["detailSections"])
        : [],
      specs: Array.isArray(product.specs) ? (product.specs as Product["specs"]) : [],
      optionGroups: Array.isArray(product.optionGroups) ? (product.optionGroups as Product["optionGroups"]) : [],
      skus: Array.isArray(product.skus) ? (product.skus as Product["skus"]) : [],
      displayStatus: textOrDash(stringValue(product, "displayStatus", "publishStatus")),
      stockNote: textOrDash(stringValue(product, "stockNote")),
      detailImageCount: Array.isArray(product.detailSections) ? product.detailSections.length : 0,
      exposureZones: Array.isArray(product.exposureZones) ? (product.exposureZones as string[]) : [],
      editorNote: textOrDash(stringValue(product, "note", "editorNote"), ""),
      price: memberPrice !== null ? formatWon(memberPrice) : textOrDash(plainPrice, "회원가 로그인 후 확인"),
      review: textOrDash(stringValue(product, "review"), ""),
      description: Array.isArray(product.description) ? (product.description as string[]) : [],
    };
  });

  return {
    items,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    number: page.number,
  };
}

export function findProductBySlug(products: ReturnType<typeof mapProductRows>["items"], slug: string) {
  return products.find((product) => product.slug === slug || product.sourceSlug === slug);
}

export function buildSalesView(
  dealers: HealthBoxRecord[] | null,
  monthlySales: HealthBoxRecord[] | null,
  monthlySettlements: HealthBoxRecord[] | null,
) {
  if (!dealers?.length || (!monthlySales?.length && !monthlySettlements?.length)) {
    return {
      metrics: [
        { label: "이번 달 매출", value: "0원", hint: "실데이터 없음", tone: "blue" as const },
        { label: "예상 정산액", value: "0원", hint: "실데이터 없음", tone: "cyan" as const },
        { label: "차감 검수", value: "0원", hint: "실데이터 없음", tone: "rose" as const },
        { label: "활성 회원사", value: "0곳", hint: "실데이터 없음", tone: "green" as const },
      ],
      rows: [],
      trend: [],
    };
  }

  const rows = dealers.map((dealer, index) => {
    const settlement = monthlySettlements?.[index] ?? monthlySettlements?.[0];
    const sales = monthlySales?.[index] ?? monthlySales?.[0];
    const status = textOrDash(stringValue(settlement, "status") || stringValue(sales, "status"), "검수중");

    return {
      company: textOrDash(stringValue(dealer, "mallName", "displayName"), `딜러몰 ${index + 1}`),
      type: "딜러 회원사",
      parent: "건강창고 본몰",
      sales: formatWon(numberValue(sales, "grossSales", "salesAmount", "netSales") ?? 0),
      orders: textOrDash(stringValue(sales, "orderCount"), "0건"),
      deduction: formatWon(numberValue(settlement, "deductionAmount", "deduction") ?? 0),
      estimated: formatWon(numberValue(settlement, "estimatedSettlementAmount", "estimated", "confirmedSettlementAmount") ?? 0),
      trend: status,
      tone: tone(status),
    };
  });

  const grossTotal = rows.reduce((sum, row) => sum + Number(row.sales.replace(/[^0-9]/g, "")), 0);
  const estimatedTotal = rows.reduce((sum, row) => sum + Number(row.estimated.replace(/[^0-9]/g, "")), 0);
  const deductionTotal = rows.reduce((sum, row) => sum + Number(row.deduction.replace(/[^0-9]/g, "")), 0);

  return {
    metrics: [
      { label: "이번 달 매출", value: formatWon(grossTotal), hint: "월 집계 기준", tone: "blue" as const },
      { label: "예상 정산액", value: formatWon(estimatedTotal), hint: "딜러몰 기준", tone: "cyan" as const },
      { label: "차감 검수", value: formatWon(deductionTotal), hint: "취소/반품 반영", tone: "rose" as const },
      { label: "활성 회원사", value: `${rows.length}곳`, hint: "매출 발생 딜러몰", tone: "green" as const },
    ],
    rows,
    trend: rows.map((row, index) => ({
      month: `${index + 1}월`,
      width: Math.max(18, Math.min(100, Math.round((Number(row.sales.replace(/[^0-9]/g, "")) / Math.max(grossTotal, 1)) * 100))),
      sales: row.sales,
    })),
  };
}

export function mapStoreNoticeList(notices: HealthBoxRecord[] | null, fallback: Notice[]) {
  if (!notices?.length) {
    return fallback;
  }

  return notices.map((notice, index) => {
    const template = fallback[index % fallback.length];
    return {
      slug: textOrDash(stringValue(notice, "slug"), template.slug),
      category: textOrDash(stringValue(notice, "category"), template.category),
      title: textOrDash(stringValue(notice, "title"), template.title),
      date: textOrDash(dateTimeValue(notice, "date", "createdAt", "updatedAt"), template.date),
      summary: textOrDash(noticeSummaryValue(notice), template.summary),
      paragraphs: splitNoticeParagraphs(notice).length ? splitNoticeParagraphs(notice) : template.paragraphs,
      checklist: Array.isArray(notice.checklist) ? (notice.checklist as string[]) : template.checklist,
    };
  });
}
