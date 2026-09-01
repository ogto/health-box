import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminHeader } from "../../../../_components/admin/admin-header";
import { AdminShippingStatusForm } from "../../../../_components/admin/admin-shipping-status-form";
import { AdminBadge, AdminPanel } from "../../../../_components/admin/admin-ui";
import {
  fetchAdminOrder,
  hasHealthBoxApi,
  numberValue,
  stringValue,
  toneFromStatus,
} from "../../../../_lib/health-box-api";
import { getAdminSession } from "../../../../_lib/admin-auth";

function formatWon(value: unknown) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function shipmentStatusLabel(value: unknown) {
  const status = String(value || "PENDING").toUpperCase();
  const labels: Record<string, string> = {
    ORDERED: "주문 접수",
    PENDING: "주문 접수",
    PREPARING: "상품 준비중",
    DELAYED: "발송 지연",
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    PARTIALLY_CANCELED: "주문 접수",
  };
  return labels[status] || String(value || "-");
}

function dateTimeLocalValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().replace(" ", "T").slice(0, 16);
  }
  if (Array.isArray(value) && value.length >= 5) {
    const [year, month, day, hour, minute] = value;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  return "";
}

export default async function AdminOrderShippingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ orderId }, session] = await Promise.all([params, getAdminSession()]);
  const numericOrderId = Number(orderId);

  if (session?.scopeType === "DEALER" && Number.isFinite(numericOrderId)) {
    redirect(`/admin/orders/${numericOrderId}`);
  }

  if (!hasHealthBoxApi() || !Number.isFinite(numericOrderId)) {
    notFound();
  }

  const order = await fetchAdminOrder(numericOrderId);
  if (!order?.shipmentId) {
    notFound();
  }

  const status = stringValue(order, "shipmentStatus") || "PENDING";
  const backHref = `/admin/orders/${numericOrderId}`;
  const formId = "admin-order-shipping-form";

  return (
    <div className="admin-page">
      <AdminHeader title="배송 처리" />

      <div className="admin-order-shipping-flow">
        <div className="admin-order-shipping-topbar">
          <Link className="admin-button secondary" href={backHref}>
            주문 상세로
          </Link>
        </div>

        <AdminPanel
          action={<AdminBadge tone={toneFromStatus(status)}>{shipmentStatusLabel(status)}</AdminBadge>}
          description="선택한 주문의 배송 상태, 택배사, 송장번호, 출고일시를 처리합니다."
          title={stringValue(order, "orderNo") || `주문 ${orderId}`}
        >
          <div className="admin-order-shipping-summary">
            <div className="admin-status-row">
              <span>수령인</span>
              <strong>{stringValue(order, "receiverName", "ordererName") || "-"}</strong>
            </div>
            <div className="admin-status-row">
              <span>연락처</span>
              <strong>{stringValue(order, "receiverPhone", "ordererPhone") || "-"}</strong>
            </div>
            <div className="admin-status-row">
              <span>결제금액</span>
              <strong>{formatWon(numberValue(order, "totalPaymentAmount"))}</strong>
            </div>
            <div className="admin-status-row">
              <span>배송지</span>
              <strong>
                {[stringValue(order, "zipCode"), stringValue(order, "baseAddress"), stringValue(order, "detailAddress")]
                  .filter(Boolean)
                  .join(" ") || "-"}
              </strong>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="배송 정보 입력">
          <AdminShippingStatusForm
            courierCompany={stringValue(order, "courierCompany")}
            deliveredAt={dateTimeLocalValue(order.deliveredAt)}
            formId={formId}
            redirectTo={`/admin/orders/${numericOrderId}/shipping`}
            shippedAt={dateTimeLocalValue(order.shippedAt)}
            shipmentId={String(order.shipmentId)}
            shipmentStatus={status}
            trackingNo={stringValue(order, "trackingNo")}
          />
        </AdminPanel>
      </div>
    </div>
  );
}
