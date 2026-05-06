import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { MemberAccountLayout } from "../_components/member-account-layout";
import { MemberOrderComingSoonButton, MemberReorderButton } from "../_components/member-reorder-button";
import { healthBoxFetch, type HealthBoxRecord } from "../_lib/health-box-api";
import { getMemberSession } from "../_lib/member-auth";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

function formatDate(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return [year, month, day].filter(Boolean).join(".");
  }

  const text = String(value || "");
  return text ? text.slice(0, 10).replace(/-/g, ".") : "-";
}

function parseHealthBoxDate(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value.map(Number);
    if (!year || !month || !day) {
      return null;
    }

    const date = new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = String(value || "");
  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatOrderDate(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return year && month && day ? `${year}. ${month}. ${day}` : "-";
  }

  const text = String(value || "");
  if (!text) {
    return "-";
  }

  const [year, month, day] = text.slice(0, 10).split("-");
  return year && month && day ? `${Number(year)}. ${Number(month)}. ${Number(day)}` : formatDate(value);
}

function formatShortDate(value: unknown) {
  if (Array.isArray(value)) {
    const [, month, day] = value;
    return month && day ? `${month}/${day}` : "";
  }

  const text = String(value || "");
  if (!text) {
    return "";
  }

  const [, month, day] = text.slice(0, 10).split("-");
  return month && day ? `${Number(month)}/${Number(day)}` : "";
}

function formatWon(value: unknown) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function displayOrderNo(order: HealthBoxRecord) {
  const orderNo = String(order.orderNo || "");
  const legacyMatch = orderNo.match(/^HB-O-(\d{6})$/);
  if (!legacyMatch) {
    return orderNo || "주문번호 없음";
  }

  const orderedAt = formatDate(order.orderedAt).replace(/[^0-9]/g, "");
  return orderedAt ? `${orderedAt}${legacyMatch[1].slice(-4)}` : orderNo;
}

function orderItems(order: HealthBoxRecord) {
  return Array.isArray(order.items) ? (order.items as HealthBoxRecord[]) : [];
}

function itemImageUrl(item: HealthBoxRecord) {
  return String(item.thumbnailUrl || item.imageUrl || item.mediaUrl || "");
}

function orderImageUrl(order: HealthBoxRecord) {
  const item = orderItems(order).find((orderItem) => itemImageUrl(orderItem));
  return item ? itemImageUrl(item) : "";
}

function itemInitial(order: HealthBoxRecord) {
  return orderItemSummary(order).trim().charAt(0) || "상";
}

function itemInitialFromItem(item: HealthBoxRecord) {
  return String(item.productNameSnapshot || "상품").trim().charAt(0) || "상";
}

function orderItemSummary(order: HealthBoxRecord) {
  const items = orderItems(order);
  if (!items.length) {
    return "주문 상품 정보 없음";
  }

  const first = items[0];
  const productName = String(first.productNameSnapshot || "상품명 없음");
  return items.length > 1 ? `${productName} 외 ${items.length - 1}건` : productName;
}

function itemOptionText(item: HealthBoxRecord) {
  const productName = String(item.productNameSnapshot || "").trim();
  const optionTexts = [item.optionSummarySnapshot, item.skuNameSnapshot]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== productName && value !== "기본 상품" && value !== "상품");
  const normalizedOptions = optionTexts.filter(
    (value, index, array) => array.findIndex((itemValue) => itemValue === value || itemValue.includes(value)) === index,
  );

  return normalizedOptions.join(" · ") || "없음";
}

function itemOptionPairs(item: HealthBoxRecord) {
  const optionText = itemOptionText(item);
  if (optionText === "없음") {
    return [];
  }

  const parts = optionText
    .split(/\s*[/·,]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const inferredNames = parts.length === 2 ? ["사이즈", "색상"] : parts.length === 3 ? ["사이즈", "색상", "옵션"] : [];

  return parts.map((part, index) => {
    const [name, ...rest] = part.split(/\s*[:：]\s*/);
    return rest.length
      ? { name: name.trim() || "옵션", value: rest.join(":").trim() || "-" }
      : { name: inferredNames[index] || "옵션", value: part };
  });
}

function MemberOrderOptionDisplay({ item }: { item: HealthBoxRecord }) {
  const pairs = itemOptionPairs(item);
  if (!pairs.length) {
    return <p className="member-option-empty">옵션: 없음</p>;
  }

  return (
    <div className="member-order-option-pair-list" aria-label="옵션 정보">
      {pairs.map((pair, index) => (
        <span className="member-order-option-pair" key={`${pair.name}-${pair.value}-${index}`}>
          <span className="member-order-option-name">{pair.name}</span>
          <span className="member-order-option-value">{pair.value}</span>
        </span>
      ))}
    </div>
  );
}

function orderQuantitySummary(order: HealthBoxRecord) {
  const quantity = orderItems(order).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return quantity > 0 ? `총 ${quantity}개` : "수량 정보 없음";
}

function orderSearchText(order: HealthBoxRecord) {
  return [
    displayOrderNo(order),
    order.orderNo,
    order.ordererName,
    order.receiverName,
    ...orderItems(order).flatMap((item) => [
      item.productNameSnapshot,
      item.optionSummarySnapshot,
      item.skuNameSnapshot,
    ]),
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
}

function itemLineAmount(item: HealthBoxRecord) {
  const lineAmount = Number(item.lineAmount || 0);
  if (lineAmount > 0) {
    return lineAmount;
  }

  return Number(item.priceSnapshot || 0) * Number(item.quantity || 0);
}

function itemUnitPrice(item: HealthBoxRecord) {
  const priceSnapshot = Number(item.priceSnapshot || 0);
  if (priceSnapshot > 0) {
    return priceSnapshot;
  }

  const quantity = Number(item.quantity || 0);
  const lineAmount = Number(item.lineAmount || 0);
  return quantity > 0 ? Math.floor(lineAmount / quantity) : 0;
}

function orderStatusLabel(value: unknown) {
  const status = String(value || "ORDERED").toUpperCase();
  const labels: Record<string, string> = {
    ORDERED: "주문 접수",
    PREPARING: "상품 준비중",
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    PARTIALLY_CANCELED: "부분취소",
  };
  return labels[status] || status;
}

function shipmentStatusLabel(value: unknown) {
  const status = String(value || "").toUpperCase();
  const labels: Record<string, string> = {
    ORDERED: "주문 접수",
    PENDING: "주문 접수",
    PREPARING: "상품 준비중",
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    PARTIALLY_CANCELED: "부분취소",
  };
  return status ? labels[status] || status : "";
}

function customerOrderStatusLabel(order: HealthBoxRecord) {
  const orderStatus = String(order.orderStatus || "").toUpperCase();
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();

  if (/CANCELED/.test(orderStatus)) {
    return orderStatusLabel(orderStatus);
  }

  if (/CANCELED/.test(shipmentStatus)) {
    return "취소완료";
  }

  return shipmentStatusLabel(shipmentStatus) || orderStatusLabel(orderStatus);
}

function orderStatusDetail(order: HealthBoxRecord) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  const label = customerOrderStatusLabel(order);

  if (shipmentStatus === "DELIVERED") {
    const deliveredDate = formatShortDate(order.deliveredAt);
    return deliveredDate ? `${label} · ${deliveredDate} 도착` : label;
  }

  if (shipmentStatus === "SHIPPED") {
    const shippedDate = formatShortDate(order.shippedAt);
    return shippedDate ? `${label} · ${shippedDate} 출고` : label;
  }

  return label;
}

function statusToneClass(order: HealthBoxRecord) {
  const status = `${order.orderStatus || ""} ${order.shipmentStatus || ""}`.toUpperCase();
  if (/CANCELED/.test(status)) {
    return "is-canceled";
  }
  if (/DELIVERED/.test(status)) {
    return "is-delivered";
  }
  if (/SHIPPED/.test(status)) {
    return "is-shipped";
  }
  if (/PREPARING/.test(status)) {
    return "is-preparing";
  }
  return "is-pending";
}

function orderActionMode(order: HealthBoxRecord) {
  const status = `${order.orderStatus || ""} ${order.shipmentStatus || ""}`.toUpperCase();
  if (/CANCELED/.test(status)) {
    return "canceled";
  }
  if (/SHIPPED|DELIVERED/.test(status)) {
    return "delivery";
  }
  return "ready";
}

const orderGuideSteps = [
  { title: "주문 접수", copy: "주문과 결제가 접수되었습니다." },
  { title: "상품 준비중", copy: "판매자가 상품을 준비하고 있습니다." },
  { title: "배송중", copy: "송장번호가 등록되어 배송이 시작되었습니다." },
  { title: "배송완료", copy: "상품이 배송 완료되었습니다." },
];

const orderPeriodFilters = [
  { key: "today", label: "오늘", months: 0 },
  { key: "week", label: "1주일", days: 7 },
  { key: "month", label: "1개월", months: 1 },
  { key: "quarter", label: "3개월", months: 3 },
];

function periodStartDate(period: string) {
  const now = new Date();
  const filter = orderPeriodFilters.find((item) => item.key === period) || orderPeriodFilters[1];
  const start = new Date(now);

  if (filter.key === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter.days) {
    start.setDate(start.getDate() - filter.days);
    return start;
  }

  start.setMonth(start.getMonth() - (filter.months || 1));
  return start;
}

async function fetchMemberOrders(session: Awaited<ReturnType<typeof getMemberSession>>) {
  if (!session?.memberId || !session.dealerMallId || !session.sessionToken) {
    return {
      orders: [] as HealthBoxRecord[],
      message: session ? "로그인 정보가 오래되었습니다. 다시 로그인해주세요." : "",
    };
  }

  try {
    const orders = await healthBoxFetch<HealthBoxRecord[]>("/health-box/public/orders", {
      query: {
        buyerMemberId: session.memberId,
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
      },
    });
    return { orders, message: "" };
  } catch {
    return {
      orders: [] as HealthBoxRecord[],
      message: "주문 내역을 불러오지 못했습니다. 잠시 후 다시 확인해주세요.",
    };
  }
}

export default async function MyPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string; q?: string }>;
}) {
  const [runtime, session] = await Promise.all([getStorefrontRuntime(), getMemberSession()]);
  const { dealer } = runtime;

  if (!session) {
    redirect("/login?next=/mypage");
  }

  const dealerMismatch =
    (dealer?.dealerMallId && session.dealerMallId !== dealer.dealerMallId) ||
    (dealer?.slug && session.dealerSlug && session.dealerSlug !== dealer.slug);

  if (dealerMismatch) {
    redirect("/login?next=/mypage");
  }

  const orderResult = await fetchMemberOrders(session);
  const params = await searchParams;
  const query = String(params?.q || "").trim();
  const periodFilter = String(params?.period || "week");
  const normalizedQuery = query.toLowerCase();
  const startDate = periodStartDate(periodFilter);
  const filteredOrders = orderResult.orders.filter((order) => {
    const matchesQuery = !normalizedQuery || orderSearchText(order).includes(normalizedQuery);
    if (!matchesQuery) {
      return false;
    }

    const orderedDate = parseHealthBoxDate(order.orderedAt);
    return !orderedDate || orderedDate >= startDate;
  });

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "마이페이지" },
          ]}
        />

        <MemberAccountLayout activeKey="orders" runtime={runtime} session={session}>
          <div className="dashboard-grid account-dashboard-grid">
            <section className="content-panel account-orders-panel">
              <div className="account-order-page-head">
                <h3 className="section-panel-title">주문목록</h3>
                <form action="/mypage" className="account-order-search">
                  <input name="q" placeholder="주문한 상품을 검색할 수 있어요!" type="search" defaultValue={query} />
                  <input name="period" type="hidden" value={periodFilter} />
                  <button aria-label="검색" type="submit">
                    <span aria-hidden="true" />
                  </button>
                </form>
                <div className="account-order-filter-tabs" aria-label="주문 기간">
                  {orderPeriodFilters.map((filter) => {
                    const href = query ? `/mypage?q=${encodeURIComponent(query)}&period=${filter.key}` : `/mypage?period=${filter.key}`;
                    return (
                      <Link className={periodFilter === filter.key ? "is-active" : ""} href={href} key={filter.key}>
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              {orderResult.message ? (
                <div className="info-panel compact">
                  <p className="member-auth-empty">{orderResult.message}</p>
                </div>
              ) : filteredOrders.length ? (
                <div className="account-order-card-list">
                  {filteredOrders.map((order) => (
                    <article className="account-order-card" key={String(order.id || order.orderNo)}>
                      <div className="account-order-card-head">
                        <div>
                          <h4>{formatOrderDate(order.orderedAt)} 주문</h4>
                        </div>
                        <Link href={`/mypage/orders/${String(order.id || "")}`}>주문 상세보기</Link>
                      </div>
                      <div className="account-order-product-list">
                        {orderItems(order).map((item) => (
                          <div
                            className={`account-order-product-row${orderActionMode(order) === "canceled" ? " is-canceled" : ""}`}
                            key={String(item.id || item.skuId)}
                          >
                            <div className="account-order-product-main">
                              <div className="account-order-product-status">
                                <strong className={statusToneClass(order)}>{orderStatusDetail(order)}</strong>
                              </div>
                              <div className="account-order-product-body">
                                <div className="account-order-product-thumb" aria-hidden="true">
                                  {itemImageUrl(item) ? (
                                    <Image src={itemImageUrl(item)} alt="" fill sizes="84px" />
                                  ) : (
                                    <span>{itemInitialFromItem(item)}</span>
                                  )}
                                </div>
                                <div className="account-order-product-copy">
                                  <strong>{String(item.productNameSnapshot || "상품명 없음")}</strong>
                                  <MemberOrderOptionDisplay item={item} />
                                  <small>
                                    {formatWon(itemLineAmount(item))} · {String(item.quantity || 0)}개
                                  </small>
                                </div>
                              </div>
                              <MemberReorderButton
                                image={itemImageUrl(item)}
                                optionLabel={itemOptionText(item)}
                                productSlug={String(item.productSlug || item.productSlugSnapshot || "")}
                                productTitle={String(item.productNameSnapshot || "상품명 없음")}
                                quantity={Number(item.quantity || 1)}
                                skuId={Number(item.skuId || 0)}
                                unitPrice={itemUnitPrice(item)}
                              />
                            </div>
                            {orderActionMode(order) !== "canceled" ? (
                              <div className="account-order-product-actions">
                                {orderActionMode(order) === "ready" ? (
                                  <>
                                    <MemberOrderComingSoonButton>취소 요청</MemberOrderComingSoonButton>
                                    <MemberOrderComingSoonButton>리뷰 작성하기</MemberOrderComingSoonButton>
                                  </>
                                ) : null}
                                {orderActionMode(order) === "delivery" ? (
                                  <>
                                    <Link className="is-delivery" href={`/mypage/orders/${String(order.id || "")}/tracking`}>
                                      배송 조회
                                    </Link>
                                    <MemberOrderComingSoonButton>교환, 반품 신청</MemberOrderComingSoonButton>
                                    <MemberOrderComingSoonButton>리뷰 작성하기</MemberOrderComingSoonButton>
                                  </>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="info-panel compact">
                  <p className="member-auth-empty">조건에 맞는 주문 내역이 없습니다.</p>
                </div>
              )}
            </section>

            <section className="content-panel account-order-guide">
              <div className="account-order-guide-head">
                <h3>배송상품 주문상태 안내</h3>
              </div>
              <div className="account-order-guide-steps">
                {orderGuideSteps.map((step, index) => (
                  <div className="account-order-guide-step" key={step.title}>
                    <div className="account-order-guide-icon" aria-hidden="true">
                      {index + 1}
                    </div>
                    <strong>{step.title}</strong>
                    <p>{step.copy}</p>
                  </div>
                ))}
              </div>

              <div className="account-order-notice">
                <h3>취소/반품/교환 신청 전 확인해주세요!</h3>
                <div className="account-order-notice-grid">
                  <div>
                    <strong>취소</strong>
                    <p>주문 접수 후 상품 준비 전까지 취소 요청이 가능합니다.</p>
                    <p>상품 준비가 시작된 이후에는 고객센터 확인이 필요할 수 있습니다.</p>
                  </div>
                  <div>
                    <strong>반품</strong>
                    <p>상품 수령 후 7일 이내 신청해주세요.</p>
                    <p>출고 이후에는 배송 완료 후 반품 상품을 회수합니다.</p>
                  </div>
                  <div>
                    <strong>교환</strong>
                    <p>상품 교환은 고객센터로 문의해주세요.</p>
                    <p>설치상품, 주문제작, 신선냉동 상품은 정책에 따라 제한될 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </MemberAccountLayout>
      </section>
    </StoreShell>
  );
}
