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

function tone(status: string): AdminTone {
  return toneFromStatus(status);
}

function textOrDash(value: string, fallback = "-") {
  return value || fallback;
}

function splitNoticeParagraphs(record: HealthBoxRecord) {
  if (Array.isArray(record.paragraphs)) {
    return (record.paragraphs as string[]).filter(Boolean);
  }

  const source = stringValue(record, "content", "body");
  if (source) {
    return source
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
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

export function buildDashboardMetrics(orders: HealthBoxRecord[] | null, dealerApps: HealthBoxRecord[] | null, buyerApps: HealthBoxRecord[] | null) {
  if (!orders && !dealerApps && !buyerApps) {
    return [
      zeroMetric("오늘 주문", "실데이터 없음", "blue"),
      zeroMetric("승인 대기", "실데이터 없음", "cyan"),
      { label: "주문 회원사", value: "0곳", hint: "실데이터 없음", tone: "green" as const },
      { label: "운영 상태", value: "데이터 없음", hint: "API 연결 후 집계", tone: "gold" as const },
    ];
  }

  const totalOrders = orders?.length ?? 0;
  const shippingReady = orders?.filter((order) => /배송 준비|송장/.test(stringValue(order, "status", "shipmentStatus"))).length ?? 0;
  const pendingDealerCount = countPendingApplications(dealerApps);
  const pendingBuyerCount = countPendingApplications(buyerApps);
  const approvalCount = pendingDealerCount + pendingBuyerCount;

  return [
    { label: "오늘 주문", value: `${totalOrders}건`, hint: `배송준비 ${shippingReady}건`, tone: "blue" as const },
    { label: "승인 대기", value: `${approvalCount}건`, hint: `딜러 ${pendingDealerCount} · 회원 ${pendingBuyerCount}`, tone: "cyan" as const },
    { label: "주문 회원사", value: `${new Set((orders ?? []).map((item) => stringValue(item, "dealerMallName", "mallName", "company"))).size || 0}곳`, hint: "주문 기준 집계", tone: "green" as const },
    { label: "운영 상태", value: "API 연결", hint: "cloud-api 기준 실시간 조회", tone: "gold" as const },
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

  return orders.slice(0, 5).map((order, index) => {
    const status = textOrDash(stringValue(order, "status", "shipmentStatus"));
    const fallbackId = idValue(order, "id", "orderId") ?? index + 1;
    return {
      number: textOrDash(stringValue(order, "orderNo", "number", "id"), `ORDER-${fallbackId}`),
      member: textOrDash(stringValue(order, "dealerMallName", "mallName", "company")),
      items: textOrDash(stringValue(order, "items", "productSummary", "productName")),
      amount: formatWon(numberValue(order, "totalPaymentAmount", "amount", "totalAmount") ?? 0),
      status,
      statusTone: tone(status),
      date: textOrDash(dateTimeValue(order, "orderAt", "placedAt", "createdAt")),
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

  const orderStatuses = orders.map((item) => stringValue(item, "status", "shipmentStatus"));

  return [
    { label: "결제 완료", value: `${orderStatuses.filter((item) => /결제/.test(item)).length}건`, hint: "주문 상태 기준", tone: "blue" as const },
    { label: "배송 준비", value: `${orderStatuses.filter((item) => /배송 준비|송장/.test(item)).length}건`, hint: "출고 대기 기준", tone: "cyan" as const },
    { label: "주문 수", value: `${orders.length}건`, hint: "전체 주문", tone: "green" as const },
    { label: "취소/반품", value: `${orderStatuses.filter((item) => /취소|반품/.test(item)).length}건`, hint: "차감 가능 주문", tone: "rose" as const },
  ];
}

export function mapOrderRows(orders: HealthBoxRecord[] | null) {
  if (!orders?.length) {
    return [];
  }

  return orders.map((order, index) => {
    const status = textOrDash(stringValue(order, "status", "shipmentStatus"));
    const fallbackId = idValue(order, "id", "orderId") ?? index + 1;

    return {
      id: idValue(order, "id", "orderId"),
      number: textOrDash(stringValue(order, "orderNo", "number", "id"), `ORDER-${fallbackId}`),
      company: textOrDash(stringValue(order, "dealerMallName", "mallName", "company")),
      companyType: textOrDash(stringValue(order, "companyType", "memberType")),
      buyer: textOrDash(stringValue(order, "buyerName", "memberName", "buyer")),
      buyerType: textOrDash(stringValue(order, "buyerType", "memberType")),
      items: textOrDash(stringValue(order, "items", "productSummary", "productName")),
      amount: formatWon(numberValue(order, "totalPaymentAmount", "amount", "totalAmount") ?? 0),
      status,
      tone: tone(status),
      placedAt: textOrDash(dateTimeValue(order, "orderAt", "placedAt", "createdAt")),
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
    const plainPrice = stringValue(product, "price");

    return {
      recordId: apiRecordId ?? null,
      categoryId: idValue(product, "categoryId") ?? null,
      categoryQueryValue: stringValue(product, "categoryName", "category"),
      id: textOrDash(stringValue(product, "productCode", "code", "id"), String(recordId)),
      slug: routeSlug,
      sourceSlug: sourceSlug || routeSlug,
      adminHref: `/admin/products/${routeSlug}`,
      previewHref: `/product/${routeSlug}`,
      brand: textOrDash(stringValue(product, "brandName", "brand")),
      title: textOrDash(stringValue(product, "name", "title"), "제목 없음"),
      subtitle: textOrDash(stringValue(product, "subtitle", "summary", "summaryText"), ""),
      category: textOrDash(categoryLabel),
      status: textOrDash(stringValue(product, "status"), "ACTIVE"),
      badge,
      publishStatus,
      publishTone: tone(publishStatus),
      statusTone: tone(badge || publishStatus),
      monthlySales: formatWon(numberValue(product, "monthlySales", "salesAmount") ?? 0),
      inventoryCount: textOrDash(stringValue(product, "inventoryCount", "stockQuantity"), "0"),
      updatedAt: textOrDash(dateTimeValue(product, "updatedAt", "createdAt")),
      image: stringValue(product, "image", "thumbnailUrl", "thumbUrl"),
      shipping: textOrDash(stringValue(product, "shipping", "deliveryPolicyText")),
      summary: textOrDash(stringValue(product, "summary", "summaryText"), ""),
      gallery: Array.isArray(product.gallery) ? (product.gallery as string[]) : [],
      highlights: Array.isArray(product.highlights) ? (product.highlights as string[]) : [],
      detailSections: Array.isArray(product.detailSections)
        ? (product.detailSections as Product["detailSections"])
        : [],
      specs: Array.isArray(product.specs) ? (product.specs as Product["specs"]) : [],
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
