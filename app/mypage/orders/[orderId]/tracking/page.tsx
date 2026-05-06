import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MemberAccountLayout } from "../../../../_components/member-account-layout";
import { Breadcrumbs, StoreShell } from "../../../../_components/store-ui";
import { fetchDeliveryApiTracking, type DeliveryTrackingResult } from "../../../../_lib/delivery-api";
import { healthBoxFetch, type HealthBoxRecord } from "../../../../_lib/health-box-api";
import { getMemberSession } from "../../../../_lib/member-auth";
import { getStorefrontRuntime } from "../../../../_lib/storefront-runtime";

function formatDate(value: unknown) {
  if (Array.isArray(value)) {
    const [year, month, day] = value;
    return [year, month, day].filter(Boolean).join(".");
  }

  const text = String(value || "");
  return text ? text.slice(0, 10).replace(/-/g, ".") : "-";
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
  return text ? text.replace("T", " ").slice(0, 16).replace(/-/g, ".") : "-";
}

function formatTrackingDate(value: unknown) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  if (Array.isArray(value)) {
    const [year, month, day, hour, minute] = value;
    if (!year || !month || !day) {
      return "-";
    }
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const time =
      hour === undefined
        ? ""
        : ` ${String(hour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
    return `${String(month).padStart(2, "0")}. ${String(day).padStart(2, "0")}. (${weekdays[date.getDay()]})${time}`;
  }

  const text = String(value || "");
  const date = new Date(text);
  if (!text || Number.isNaN(date.getTime())) {
    return formatDateTime(value);
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}. ${String(date.getDate()).padStart(2, "0")}. (${weekdays[date.getDay()]}) ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
  const date = new Date(text);
  if (!text || Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
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

function statusToneClass(order: HealthBoxRecord) {
  const status = `${order.orderStatus || ""} ${order.shipmentStatus || ""} ${order.paymentStatus || ""}`.toUpperCase();
  if (/CANCELED|취소/.test(status)) {
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

function trackingHeadline(order: HealthBoxRecord, deliveryTracking: DeliveryTrackingResult | null) {
  if (deliveryTracking?.isDelivered) {
    const deliveredAt = deliveryTracking.events.find((event) => /완료/.test(event.status))?.at;
    const deliveredDate = formatArrivalDate(deliveredAt);
    return deliveredDate ? `${deliveredDate} 도착 완료` : "배송완료";
  }
  if (deliveryTracking?.statusText) {
    return deliveryTracking.statusText;
  }

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
  return shipmentStatusLabel(order.shipmentStatus || order.orderStatus);
}

function trackingDescription(order: HealthBoxRecord, deliveryTracking: DeliveryTrackingResult | null) {
  if (deliveryTracking?.isDelivered) {
    return "고객님이 주문하신 상품이 배송완료 되었습니다.";
  }
  if (deliveryTracking?.events.length) {
    return "택배사에서 조회한 최신 배송 정보를 표시하고 있습니다.";
  }

  const shipmentStatus = String(order.shipmentStatus || "").toUpperCase();
  if (shipmentStatus === "DELIVERED") {
    return "고객님이 주문하신 상품이 배송완료 되었습니다.";
  }
  if (shipmentStatus === "SHIPPED") {
    return "고객님이 주문하신 상품이 배송중입니다.";
  }
  return "고객님이 주문하신 상품의 배송을 준비하고 있습니다.";
}

function fallbackTrackingEvents(order: HealthBoxRecord) {
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

function trackingEvents(order: HealthBoxRecord, deliveryTracking: DeliveryTrackingResult | null) {
  return deliveryTracking?.events.length ? deliveryTracking.events : fallbackTrackingEvents(order);
}

function trackingSourceText(order: HealthBoxRecord, deliveryTracking: DeliveryTrackingResult | null) {
  if (deliveryTracking?.events.length) {
    return "실시간 조회";
  }

  if (order.trackingNo) {
    return "조회 대기";
  }

  return "내부 주문 상태 기준";
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

export default async function MemberOrderTrackingPage({
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
    redirect(`/login?next=/mypage/orders/${orderId}/tracking`);
  }

  const dealerMismatch =
    (runtime.dealer?.dealerMallId && session.dealerMallId !== runtime.dealer.dealerMallId) ||
    (runtime.dealer?.slug && session.dealerSlug && session.dealerSlug !== runtime.dealer.slug);

  if (dealerMismatch) {
    redirect(`/login?next=/mypage/orders/${orderId}/tracking`);
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

  const deliveryTracking = await fetchDeliveryApiTracking(order);
  const courierName = deliveryTracking?.courierName || String(order.courierCompany || "택배사 확인중");
  const trackingNumber = deliveryTracking?.trackingNumber || String(order.trackingNo || "확인중");

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "마이페이지", href: "/mypage" },
            { label: "배송 조회" },
          ]}
        />

        <MemberAccountLayout activeKey="orders" runtime={runtime} session={session}>
          <div className="cart-page-head detail-page-head">
            <Link aria-label="주문 목록으로" className="cart-back-link" href="/mypage">
              <span aria-hidden="true">‹</span>
            </Link>
            <h1>배송 조회</h1>
            <div className="detail-page-meta">
              <strong>{displayOrderNo(order)}</strong>
              <span className={`order-detail-status ${statusToneClass(order)}`}>{shipmentStatusLabel(order.shipmentStatus || order.orderStatus)}</span>
            </div>
          </div>

          <div className="content-panel order-detail-panel">
            <section className="order-tracking-panel">
              <div className="order-tracking-hero">
                <strong>{trackingHeadline(order, deliveryTracking)}</strong>
                <p>{trackingDescription(order, deliveryTracking)}</p>
              </div>
              <div className="order-tracking-info">
                <div className="order-tracking-carrier" aria-hidden="true">
                  <span>배송</span>
                </div>
                <div className="order-tracking-carrier-copy">
                  <strong>{courierName}</strong>
                  <dl>
                    <div>
                      <dt>송장번호</dt>
                      <dd>{trackingNumber}</dd>
                    </div>
                    <div>
                      <dt>조회상태</dt>
                      <dd>{deliveryTracking?.statusText || trackingSourceText(order, deliveryTracking)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="order-tracking-address">
                  <dl>
                    <div>
                      <dt>받는사람</dt>
                      <dd>{String(order.receiverName || "-")}</dd>
                    </div>
                    <div>
                      <dt>받는주소</dt>
                      <dd>{[order.zipCode, order.baseAddress, order.detailAddress].filter(Boolean).join(" ") || "-"}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="order-tracking-timeline" aria-label="배송 추적">
                {trackingEvents(order, deliveryTracking).map((event, index) => (
                  <div className={index === 0 ? "order-tracking-step is-current" : "order-tracking-step"} key={`${event.status}-${index}`}>
                    <div className="order-tracking-step-marker" aria-hidden="true">
                      {index === 0 ? "✓" : ""}
                    </div>
                    <div className="order-tracking-step-copy">
                      <strong>{event.location}</strong>
                      <p>
                        <span>{formatTrackingDate(event.at)}</span>
                        <span aria-hidden="true">·</span>
                        <em>{event.status}</em>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </MemberAccountLayout>
      </section>
    </StoreShell>
  );
}
