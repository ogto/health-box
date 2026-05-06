import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { MemberAccountLayout } from "../../../_components/member-account-layout";
import { MemberOrderComingSoonButton, MemberReorderButton } from "../../../_components/member-reorder-button";
import { Breadcrumbs, StoreShell } from "../../../_components/store-ui";
import { healthBoxFetch, type HealthBoxRecord } from "../../../_lib/health-box-api";
import { getMemberSession } from "../../../_lib/member-auth";
import { getStorefrontRuntime } from "../../../_lib/storefront-runtime";

function formatDate(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return [year, month, day].filter(Boolean).join(".");
  }

  const text = String(value || "");
  return text ? text.slice(0, 10).replace(/-/g, ".") : "-";
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

function formatDateTime(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day, hour, minute] = value;
    const date = [year, month, day].filter(Boolean).join(".");
    const time =
      hour === undefined
        ? ""
        : ` ${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
    return date ? `${date}${time}` : "-";
  }

  const text = String(value || "");
  if (!text) {
    return "-";
  }

  return text.replace("T", " ").slice(0, 16).replace(/-/g, ".");
}

function formatTrackingDate(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day, hour, minute] = value;
    if (!year || !month || !day) {
      return "-";
    }
    const time =
      hour === undefined
        ? ""
        : ` ${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
    return `${month}월 ${day}, ${year}${time}`;
  }

  const text = String(value || "");
  if (!text) {
    return "-";
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return formatDateTime(value);
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}, ${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatArrivalDate(value: unknown) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    if (!year || !month || !day) {
      return "";
    }
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return `${month}/${day}(${weekdays[date.getDay()]})`;
  }

  const text = String(value || "");
  if (!text) {
    return "";
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}

function formatWon(value: unknown) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function pickString(record: HealthBoxRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = String(record[key] || "").trim();
    if (value) {
      return value;
    }
  }

  return "";
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

function paymentStatusLabel(value: unknown) {
  const status = String(value || "PAID").toUpperCase();
  const labels: Record<string, string> = {
    PAID: "결제완료",
    READY: "결제대기",
    CANCELED: "결제취소",
    PARTIALLY_CANCELED: "부분취소",
  };
  return labels[status] || status;
}

function shipmentStatusLabel(value: unknown) {
  const status = String(value || "PENDING").toUpperCase();
  const labels: Record<string, string> = {
    ORDERED: "주문 접수",
    PENDING: "주문 접수",
    PREPARING: "상품 준비중",
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
  };
  return labels[status] || status;
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

  return shipmentStatusLabel(shipmentStatus || orderStatus);
}

function shouldShowTracking(order: HealthBoxRecord) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  return /SHIPPED|DELIVERED/.test(shipmentStatus) || Boolean(order.trackingNo);
}

function deliveryTrackingUrl(order: HealthBoxRecord) {
  const trackingNo = String(order.trackingNo || "").trim();
  if (!trackingNo) {
    return "";
  }

  const courierCompany = String(order.courierCompany || "택배").trim();
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${courierCompany} ${trackingNo} 배송조회`)}`;
}

function trackingHeadline(order: HealthBoxRecord) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  if (shipmentStatus === "DELIVERED") {
    const deliveredDate = formatArrivalDate(order.deliveredAt);
    return deliveredDate ? `${deliveredDate} 도착 완료` : "배송완료";
  }
  if (shipmentStatus === "SHIPPED") {
    return "배송중";
  }
  if (shipmentStatus === "PREPARING") {
    return "상품 준비중";
  }
  return customerOrderStatusLabel(order);
}

function trackingDescription(order: HealthBoxRecord) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  if (shipmentStatus === "DELIVERED") {
    return "고객님이 주문하신 상품이 배송완료 되었습니다.";
  }
  if (shipmentStatus === "SHIPPED") {
    return "고객님이 주문하신 상품이 배송중입니다.";
  }
  return "고객님이 주문하신 상품의 배송을 준비하고 있습니다.";
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
  const status = `${order.orderStatus || ""} ${order.shipmentStatus || ""} ${order.paymentStatus || ""}`.toUpperCase();
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
  const status = `${order.orderStatus || ""} ${order.shipmentStatus || ""} ${order.paymentStatus || ""}`.toUpperCase();
  if (/CANCELED/.test(status)) {
    return "canceled";
  }
  if (/SHIPPED|DELIVERED/.test(status)) {
    return "delivery";
  }
  return "ready";
}

function trackingEvents(order: HealthBoxRecord) {
  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  const events: Array<{ at: unknown; location: string; status: string }> = [];

  if (shipmentStatus === "DELIVERED") {
    events.push({
      at: order.deliveredAt || order.shippedAt || order.orderedAt,
      location: String(order.baseAddress || "도착지"),
      status: "배송완료",
    });
  }

  if (/SHIPPED|DELIVERED/.test(shipmentStatus)) {
    events.push({
      at: order.shippedAt || order.orderedAt,
      location: String(order.dealerNameSnapshot || "판매처"),
      status: shipmentStatus === "SHIPPED" ? "배송중" : "배송출발",
    });
  }

  events.push({
    at: order.orderedAt,
    location: String(order.dealerNameSnapshot || "판매처"),
    status: "주문 접수",
  });

  return events;
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

function itemImageUrl(item: HealthBoxRecord) {
  return String(item.thumbnailUrl || item.imageUrl || item.mediaUrl || "");
}

function itemInitial(item: HealthBoxRecord) {
  return String(item.productNameSnapshot || "상품").trim().charAt(0) || "상";
}

async function fetchOrder(orderId: string, session: Awaited<ReturnType<typeof getMemberSession>>) {
  if (!session?.memberId || !session.dealerMallId || !session.sessionToken) {
    return null;
  }

  return healthBoxFetch<HealthBoxRecord>(`/health-box/public/orders/${orderId}`, {
    query: {
      buyerMemberId: session.memberId,
      dealerMallId: session.dealerMallId,
      sessionToken: session.sessionToken,
    },
  });
}

export default async function MemberOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ orderId }, runtime, session] = await Promise.all([
    params,
    getStorefrontRuntime(),
    getMemberSession(),
  ]);

  if (!session) {
    redirect(`/login?next=/mypage/orders/${orderId}`);
  }

  const dealerMismatch =
    (runtime.dealer?.dealerMallId && session.dealerMallId !== runtime.dealer.dealerMallId) ||
    (runtime.dealer?.slug && session.dealerSlug && session.dealerSlug !== runtime.dealer.slug);

  if (dealerMismatch) {
    redirect(`/login?next=/mypage/orders/${orderId}`);
  }

  let order: HealthBoxRecord | null = null;
  try {
    order = await fetchOrder(orderId, session);
  } catch {
    notFound();
  }

  if (!order) {
    redirect("/login?next=/mypage");
  }

  const items = orderItems(order);
  const itemQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const productTotalAmount = items.reduce((sum, item) => sum + itemLineAmount(item), 0);
  const shippingFee = Number(order.shippingFee || order.deliveryFee || 0);
  const canceledAmount = Number(order.canceledPaymentAmount || 0);
  const payment = order.payment && typeof order.payment === "object" ? order.payment as HealthBoxRecord : null;
  const paymentMethod =
    pickString(payment || {}, "paymentMethodName", "methodDetail", "method") ||
    pickString(order, "paymentMethodName", "paymentMethod", "payMethod", "paymentType") ||
    "결제수단 정보 없음";
  const receiverAddress = [order.zipCode, order.baseAddress, order.detailAddress].filter(Boolean).join(" ") || "-";
  const deliveryRequest =
    pickString(order, "deliveryRequest", "deliveryMemo", "shippingMemo", "requestMemo", "memo") || "없음";

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "마이페이지", href: "/mypage" },
            { label: "주문 상세" },
          ]}
        />

        <MemberAccountLayout activeKey="orders" runtime={runtime} session={session}>
          <div className="cart-page-head detail-page-head">
            <Link aria-label="주문 목록으로" className="cart-back-link" href="/mypage">
              <span aria-hidden="true">‹</span>
            </Link>
            <h1>주문 상세</h1>
          </div>

          <div className="order-detail-panel order-detail-shop-layout">
            <div className="order-detail-order-title">
              <strong>{formatOrderDate(order.orderedAt)} 주문</strong>
              <span>주문번호 {displayOrderNo(order)}</span>
            </div>

            <section className="account-order-product-list order-detail-product-card">
              {items.map((item) => (
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
                          <span>{itemInitial(item)}</span>
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
                          {shouldShowTracking(order) ? (
                            <Link className="is-delivery" href={`/mypage/orders/${String(order.id || orderId)}/tracking`}>
                              배송 조회
                            </Link>
                          ) : null}
                          <MemberOrderComingSoonButton>교환, 반품 신청</MemberOrderComingSoonButton>
                          <MemberOrderComingSoonButton>리뷰 작성하기</MemberOrderComingSoonButton>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>

            <section className="order-detail-flat-section">
              <h2>받는사람 정보</h2>
              <div className="order-detail-flat-lines">
                <div>
                  <strong>받는사람</strong>
                  <span>{String(order.receiverName || "-")}</span>
                </div>
                <div>
                  <strong>연락처</strong>
                  <span>{String(order.receiverPhone || "-")}</span>
                </div>
                <div>
                  <strong>받는주소</strong>
                  <span>{receiverAddress}</span>
                </div>
                <div>
                  <strong>배송요청사항</strong>
                  <span>{deliveryRequest}</span>
                </div>
              </div>
            </section>

            <section className="order-detail-flat-section">
              <h2>결제 정보</h2>
              <div className="order-detail-payment-box">
                <div className="order-detail-payment-method">
                  <strong>결제수단</strong>
                  <span>{paymentMethod}</span>
                </div>
                <div className="order-detail-payment-summary">
                  <div>
                    <span>총 상품가격</span>
                    <strong>{formatWon(productTotalAmount)}</strong>
                  </div>
                  {canceledAmount > 0 ? (
                    <div>
                      <span>취소금액</span>
                      <strong>-{formatWon(canceledAmount)}</strong>
                    </div>
                  ) : null}
                  <div>
                    <span>배송비</span>
                    <strong>{formatWon(shippingFee)}</strong>
                  </div>
                  <div>
                    <span>결제상태</span>
                    <strong>{paymentStatusLabel(order.paymentStatus)}</strong>
                  </div>
                  <div className="is-total">
                    <span>총 결제금액</span>
                    <strong>{formatWon(order.totalPaymentAmount)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <div className="order-detail-actions">
              <Link className="order-detail-subtle-link" href="/mypage">
                주문목록으로
              </Link>
              <Link className="order-detail-subtle-link primary" href="/">
                상품 더 둘러보기
              </Link>
            </div>
          </div>
        </MemberAccountLayout>
      </section>
    </StoreShell>
  );
}
