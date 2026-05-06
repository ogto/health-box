import Link from "next/link";
import { notFound } from "next/navigation";

import { updateShipmentStatusAction } from "../../../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "../../../../_components/admin/admin-confirm-submit-button";
import { AdminHeader } from "../../../../_components/admin/admin-header";
import { AdminBadge, AdminPanel } from "../../../../_components/admin/admin-ui";
import {
  fetchAdminOrder,
  hasHealthBoxApi,
  numberValue,
  stringValue,
  toneFromStatus,
} from "../../../../_lib/health-box-api";

const shipmentStatusOptions = [
  { value: "PENDING", label: "주문 접수" },
  { value: "PREPARING", label: "상품 준비중" },
  { value: "SHIPPED", label: "배송중" },
  { value: "DELIVERED", label: "배송완료" },
];

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
    SHIPPED: "배송중",
    DELIVERED: "배송완료",
    CANCELED: "취소완료",
    PARTIALLY_CANCELED: "주문 접수",
  };
  return labels[status] || String(value || "-");
}

export default async function AdminOrderShippingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const numericOrderId = Number(orderId);

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
          <div className="admin-status-stack">
            <form action={updateShipmentStatusAction} className="admin-status-stack" id={formId}>
              <input name="shipmentId" type="hidden" value={String(order.shipmentId)} />
              <input name="redirectTo" type="hidden" value={`/admin/orders/${numericOrderId}/shipping`} />

              <label className="admin-field">
                <span>배송 상태</span>
                <select className="admin-select" defaultValue={status.toUpperCase()} name="shipmentStatus">
                  {shipmentStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-order-form-grid">
                <label className="admin-field">
                  <span>택배사</span>
                  <input className="admin-input" name="courierCompany" placeholder="예: CJ대한통운" type="text" />
                </label>
                <label className="admin-field">
                  <span>송장 번호</span>
                  <input className="admin-input" name="trackingNo" placeholder="송장 번호를 입력하세요" type="text" />
                </label>
              </div>

              <div className="admin-order-form-grid">
                <label className="admin-field">
                  <span>출고일시</span>
                  <input className="admin-input" name="shippedAt" type="datetime-local" />
                </label>
                <label className="admin-field">
                  <span>배송완료일시</span>
                  <input className="admin-input" name="deliveredAt" type="datetime-local" />
                </label>
              </div>
            </form>

            <div className="admin-order-shipping-actions">
              <Link className="admin-button secondary" href={backHref}>
                취소
              </Link>
              <AdminConfirmSubmitButton
                confirmMessage="입력한 배송 상태와 송장 정보를 저장할까요?"
                confirmTitle="배송 상태 저장"
                form={formId}
                pendingLabel="저장중..."
              >
                배송 상태 저장
              </AdminConfirmSubmitButton>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
