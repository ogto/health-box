import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";

import {
  cancelOrderAction,
  createOrderClaimAction,
  delayShipmentAction,
  partialCancelOrderAction,
  processOrderClaimAction,
} from "../../../_actions/health-box-admin";
import { AdminConfirmSubmitButton } from "../../../_components/admin/admin-confirm-submit-button";
import { AdminHeader } from "../../../_components/admin/admin-header";
import { AdminOrderAddressForm } from "../../../_components/admin/admin-order-address-form";
import { AdminReadOnlyNotice } from "../../../_components/admin/admin-read-only-notice";
import { AdminShippingStatusForm } from "../../../_components/admin/admin-shipping-status-form";
import { AdminBadge, AdminPanel } from "../../../_components/admin/admin-ui";
import {
  fetchAdminOrder,
  hasHealthBoxApi,
  idValue,
  numberValue,
  stringValue,
  toneFromStatus,
} from "../../../_lib/health-box-api";
import { getAdminSession } from "../../../_lib/admin-auth";

function formatWon(value: unknown) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function optionText(item: Record<string, unknown>) {
  const productName = String(item.productNameSnapshot || "").trim();
  const rawOptions = [item.optionSummarySnapshot, item.skuNameSnapshot]
    .map((value) => String(value || "").trim())
    .filter((value) => value && value !== productName && value !== "상품" && value !== "기본 상품");
  const options = rawOptions.filter(
    (value, index, array) => array.findIndex((itemValue) => itemValue === value || itemValue.includes(value)) === index,
  );

  return options.join(" · ") || "없음";
}

function optionPairs(item: Record<string, unknown>) {
  const option = optionText(item);
  if (option === "없음") {
    return [];
  }

  const parts = option
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

function AdminOptionDisplay({ item }: { item: Record<string, unknown> }) {
  const pairs = optionPairs(item);
  if (!pairs.length) {
    return <span className="admin-option-empty">없음</span>;
  }

  return (
    <span className="admin-option-pair-list">
      {pairs.map((pair, index) => (
        <span className="admin-option-pair" key={`${pair.name}-${pair.value}-${index}`}>
          <span className="admin-option-name">{pair.name}</span>
          <span className="admin-option-value">{pair.value}</span>
        </span>
      ))}
    </span>
  );
}

function itemImageUrl(item: Record<string, unknown>) {
  return String(item.thumbnailUrl || item.imageUrl || item.mediaUrl || "");
}

function itemInitial(item: Record<string, unknown>) {
  return String(item.productNameSnapshot || "상품").trim().charAt(0) || "상";
}

function remainingQuantity(item: Record<string, unknown>) {
  const explicit = numberValue(item, "remainingQuantity");
  if (explicit !== null) {
    return explicit;
  }

  return Math.max(0, (numberValue(item, "quantity") ?? 0) - (numberValue(item, "canceledQuantity") ?? 0));
}

function partialCancelOptionText(item: Record<string, unknown>) {
  const productName = stringValue(item, "productNameSnapshot", "productName") || "상품명 없음";
  const option = optionText(item);
  return option === "없음" ? productName : `${productName} / ${option}`;
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

function claimTypeLabel(value: unknown) {
  const labels: Record<string, string> = {
    CANCEL: "취소",
    RETURN: "반품",
    EXCHANGE: "교환",
    DELIVERY_DELAY: "발송 지연",
  };
  const normalized = String(value || "").toUpperCase();
  return labels[normalized] || String(value || "클레임");
}

function claimStatusLabel(value: unknown) {
  const labels: Record<string, string> = {
    REQUESTED: "접수",
    APPROVED: "승인",
    REJECTED: "반려",
    APPLIED: "처리 완료",
    COMPLETED: "처리 완료",
  };
  const normalized = String(value || "").toUpperCase();
  return labels[normalized] || String(value || "-");
}

function claimTone(value: unknown) {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "REJECTED") return "rose" as const;
  if (normalized === "REQUESTED") return "gold" as const;
  if (normalized === "APPROVED") return "blue" as const;
  return "green" as const;
}

function paymentStatusLabel(value: unknown) {
  const status = String(value || "PAID").toUpperCase();
  const labels: Record<string, string> = {
    PAID: "결제완료",
    READY: "결제대기",
    CANCELED: "결제취소",
    PARTIALLY_CANCELED: "부분취소",
  };
  return labels[status] || String(value || "-");
}

function orderDisplayStatusLabel(orderStatus: unknown, paymentStatus: unknown, shipmentStatus: unknown, claimStatus?: unknown) {
  const orderStatusText = String(orderStatus || "").toUpperCase();
  const paymentStatusText = String(paymentStatus || "").toUpperCase();

  if (String(claimStatus || "").toUpperCase() === "REQUESTED") {
    return "취소 요청";
  }

  if (/PARTIALLY_CANCELED/.test(orderStatusText) || /PARTIALLY_CANCELED/.test(paymentStatusText)) {
    return "부분취소";
  }

  if (/CANCELED/.test(orderStatusText) || /CANCELED/.test(paymentStatusText)) {
    return "취소완료";
  }

  return shipmentStatusLabel(shipmentStatus);
}

function dateTimeLocalValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().replace(" ", "T").slice(0, 16);
  }

  if (Array.isArray(value) && value.length >= 5) {
    const [year, month, day, hour, minute] = value;
    if ([year, month, day, hour, minute].every((part) => Number.isFinite(Number(part)))) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }

  return "";
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ orderId }, session] = await Promise.all([params, getAdminSession()]);
  const readOnly = session?.scopeType === "DEALER";
  const numericOrderId = Number(orderId);

  if (!hasHealthBoxApi() || !Number.isFinite(numericOrderId)) {
    notFound();
  }

  const order = await fetchAdminOrder(numericOrderId);
  if (!order) {
    notFound();
  }

  const orderNo = stringValue(order, "orderNo") || `주문 ${orderId}`;
  const shipmentStatus = stringValue(order, "shipmentStatus") || "PENDING";
  const orderStatus = stringValue(order, "orderStatus", "status");
  const paymentStatus = stringValue(order, "paymentStatus");
  const claimStatus = stringValue(order, "claimStatus");
  const normalizedClaimStatus = claimStatus.toUpperCase();
  const statusTone = toneFromStatus(`${orderStatus} ${shipmentStatus} ${claimStatus}`);
  const displayStatus = orderDisplayStatusLabel(orderStatus, paymentStatus, shipmentStatus, claimStatus);
  const items = Array.isArray(order.items) ? (order.items as Array<Record<string, unknown>>) : [];
  const claims = Array.isArray(order.claims) ? (order.claims as Array<Record<string, unknown>>) : [];
  const shipmentId = idValue(order, "shipmentId");
  const cancelableItems = items.filter((item) => remainingQuantity(item) > 0 && idValue(item, "id"));
  const address = [
    stringValue(order, "zipCode"),
    stringValue(order, "baseAddress"),
    stringValue(order, "detailAddress"),
  ]
    .filter(Boolean)
    .join(" ");
  const detailHref = `/admin/orders/${numericOrderId}`;
  const normalizedShipmentStatus = shipmentStatus.toUpperCase();
  const addressEditable = !["SHIPPED", "DELIVERED", "CANCELED"].includes(normalizedShipmentStatus);
  const delayEligible = ["PENDING", "ORDERED", "PARTIALLY_CANCELED", "PREPARING", "DELAYED"].includes(normalizedShipmentStatus);
  const orderCanceled = orderStatus.toUpperCase() === "CANCELED" || paymentStatus.toUpperCase() === "CANCELED";
  const fullCancelLabel = normalizedClaimStatus === "REQUESTED"
    ? "취소 요청 승인 및 환불"
    : normalizedShipmentStatus === "DELIVERED"
      ? "구매확정 후 취소 및 환불"
      : "판매자 직접 취소";
  const fullCancellationRequestId = randomUUID();
  const partialCancellationRequestId = randomUUID();

  return (
    <div className="admin-page">
      <AdminHeader title="주문 상세" />

      {readOnly ? <AdminReadOnlyNotice scopeName={session?.scopeName} /> : null}

      <div className="admin-order-detail-topbar">
        <Link className="admin-button secondary" href="/admin/orders">
          목록으로
        </Link>
      </div>

      <div className="admin-order-detail-layout">
        <AdminPanel
          action={<AdminBadge tone={statusTone}>{displayStatus}</AdminBadge>}
          title={orderNo}
        >
          <div className="admin-status-stack">
            <div className="admin-list-row">
              <div className="admin-row-stack">
                <strong>
                  {stringValue(order, "dealerNameSnapshot", "dealerMallName", "mallName") || "회원사 없음"}
                </strong>
                <p>
                  {stringValue(order, "receiverName", "ordererName") || "-"} ·{" "}
                  {stringValue(order, "receiverPhone", "ordererPhone") || "-"}
                </p>
                <span>{address || "배송지 정보 없음"}</span>
              </div>
            </div>

            <div className="admin-order-detail-grid">
              <div className="admin-status-row">
                <span>결제상태</span>
                <strong>{paymentStatusLabel(paymentStatus)}</strong>
              </div>
              <div className="admin-status-row">
                <span>배송상태</span>
                <strong>{shipmentStatusLabel(shipmentStatus)}</strong>
              </div>
              <div className="admin-status-row">
                <span>결제금액</span>
                <strong>{formatWon(numberValue(order, "totalPaymentAmount"))}</strong>
              </div>
              <div className="admin-status-row">
                <span>취소금액</span>
                <strong>{formatWon(numberValue(order, "canceledPaymentAmount"))}</strong>
              </div>
              <div className="admin-status-row">
                <span>취소 요청</span>
                <strong>{normalizedClaimStatus === "REQUESTED" ? "처리 대기" : normalizedClaimStatus === "APPLIED" ? "처리 완료" : "-"}</strong>
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="상품 목록"
        >
          <div className="admin-order-item-table">
            <div className="admin-order-item-table-head">
              <span>이미지</span>
              <span>상품명</span>
              <span>옵션정보</span>
              <span>단가</span>
              <span>주문</span>
              <span>취소</span>
              <span>취소 가능</span>
              <span>금액</span>
            </div>
            {items.map((item) => {
              const remaining = remainingQuantity(item);

              return (
                <div className="admin-order-item-table-row" key={String(item.id || item.skuId)}>
                  <div className="admin-order-item-media" aria-hidden="true">
                    {itemImageUrl(item) ? (
                      <Image alt="" fill sizes="54px" src={itemImageUrl(item)} />
                    ) : (
                      <span>{itemInitial(item)}</span>
                    )}
                  </div>
                  <strong>{stringValue(item, "productNameSnapshot", "productName") || "상품명 없음"}</strong>
                  <AdminOptionDisplay item={item} />
                  <span>{formatWon(numberValue(item, "priceSnapshot"))}</span>
                  <span>{numberValue(item, "quantity") ?? 0}개</span>
                  <span>{numberValue(item, "canceledQuantity") ?? 0}개</span>
                  <span>
                    <AdminBadge tone={remaining > 0 ? "blue" : "rose"}>{remaining > 0 ? `${remaining}개 가능` : "없음"}</AdminBadge>
                  </span>
                  <strong>{formatWon(numberValue(item, "lineAmount"))}</strong>
                </div>
              );
            })}
            {!items.length ? <p className="admin-row-muted admin-order-empty-line">상품 상세가 없습니다.</p> : null}
          </div>
        </AdminPanel>

        <div className="admin-order-process-grid">
          <AdminPanel title={readOnly ? "배송 현황" : "배송 처리"}>
            {readOnly ? (
              <div className="admin-status-stack">
                <div className="admin-status-row"><span>배송 상태</span><strong>{shipmentStatusLabel(shipmentStatus)}</strong></div>
                <div className="admin-status-row"><span>택배사</span><strong>{stringValue(order, "courierCompany") || "-"}</strong></div>
                <div className="admin-status-row"><span>송장 번호</span><strong>{stringValue(order, "trackingNo") || "-"}</strong></div>
              </div>
            ) : shipmentId ? (
              <AdminShippingStatusForm
                courierCompany={stringValue(order, "courierCompany")}
                deliveredAt={dateTimeLocalValue(order.deliveredAt)}
                formId="admin-order-shipping-form"
                redirectTo={detailHref}
                shippedAt={dateTimeLocalValue(order.shippedAt)}
                shipmentId={String(shipmentId)}
                shipmentStatus={shipmentStatus}
                trackingNo={stringValue(order, "trackingNo")}
              />
            ) : (
              <p className="admin-row-muted">이 주문에는 배송 처리 정보가 연결되어 있지 않습니다.</p>
            )}
          </AdminPanel>

          {!readOnly ? <AdminPanel title="취소 처리">
            <div className="admin-status-stack">
              {!orderCanceled ? (
                <>
                  <form action={cancelOrderAction} id="admin-order-cancel-form">
                    <input name="cancellationRequestId" type="hidden" value={fullCancellationRequestId} />
                    <input name="orderId" type="hidden" value={String(numericOrderId)} />
                    <input name="redirectTo" type="hidden" value={detailHref} />
                  </form>
                  <AdminConfirmSubmitButton
                    className="admin-button danger"
                    confirmMessage="결제 승인 취소와 남은 수량의 재고 복구를 즉시 처리할까요?"
                    confirmTitle={fullCancelLabel}
                    form="admin-order-cancel-form"
                    pendingLabel="취소중..."
                    tone="danger"
                  >
                    {fullCancelLabel}
                  </AdminConfirmSubmitButton>
                </>
              ) : (
                <p className="admin-row-muted">전체 취소와 결제 환불이 완료된 주문입니다.</p>
              )}

              {cancelableItems.length ? (
                <>
                  <form action={partialCancelOrderAction} className="admin-status-stack" id="admin-order-partial-cancel-form">
                    <input name="cancellationRequestId" type="hidden" value={partialCancellationRequestId} />
                    <input name="orderId" type="hidden" value={String(numericOrderId)} />
                    <input name="redirectTo" type="hidden" value={detailHref} />
                    <label className="admin-field">
                      <span>부분 취소 상품</span>
                      <select className="admin-select" name="orderItemId">
                        {cancelableItems.map((item) => (
                          <option key={String(item.id || item.skuId)} value={String(idValue(item, "id") || "")}>
                            {partialCancelOptionText(item)}
                          </option>
                        ))}
                      </select>
                      <em className="admin-field-hint">
                        선택한 상품의 남은 수량 안에서 취소할 수 있습니다.
                      </em>
                    </label>
                    <label className="admin-field">
                      <span>취소 수량</span>
                      <input className="admin-input" defaultValue="1" min="1" name="quantity" type="number" />
                    </label>
                  </form>
                  <AdminConfirmSubmitButton
                    className="admin-button secondary"
                    confirmMessage="선택한 상품 수량만 부분 취소할까요? 해당 수량만큼 SKU 재고가 복구됩니다."
                    confirmTitle="부분 취소"
                    form="admin-order-partial-cancel-form"
                    pendingLabel="처리중..."
                    tone="danger"
                  >
                    부분 취소
                  </AdminConfirmSubmitButton>
                </>
              ) : (
                <p className="admin-row-muted">부분 취소 가능한 남은 상품 수량이 없습니다.</p>
              )}
            </div>
          </AdminPanel> : null}
        </div>

        {!readOnly ? (
          <div className="admin-order-process-grid">
            <AdminPanel title="배송지 정보 수정">
              <AdminOrderAddressForm
                baseAddress={stringValue(order, "baseAddress")}
                detailAddress={stringValue(order, "detailAddress")}
                disabled={!addressEditable}
                orderId={numericOrderId}
                receiverName={stringValue(order, "receiverName")}
                receiverPhone={stringValue(order, "receiverPhone")}
                redirectTo={detailHref}
                zipCode={stringValue(order, "zipCode")}
              />
            </AdminPanel>

            <AdminPanel title="발송 지연 처리">
              {shipmentId && delayEligible ? (
                <div className="admin-status-stack">
                  <form action={delayShipmentAction} className="admin-status-stack" id="admin-order-delay-form">
                    <input name="shipmentId" type="hidden" value={String(shipmentId)} />
                    <input name="redirectTo" type="hidden" value={detailHref} />
                    <label className="admin-field">
                      <span>지연 사유</span>
                      <textarea
                        className="admin-textarea"
                        maxLength={450}
                        name="reason"
                        placeholder="고객에게 안내할 지연 사유를 입력해주세요."
                        required
                        rows={4}
                      />
                    </label>
                    <label className="admin-field">
                      <span>예상 출고일</span>
                      <input className="admin-input" name="expectedShipDate" type="date" />
                    </label>
                  </form>
                  <AdminConfirmSubmitButton
                    className="admin-button secondary"
                    confirmMessage="입력한 사유로 발송 지연 상태를 저장할까요?"
                    confirmTitle="발송 지연 처리"
                    form="admin-order-delay-form"
                    pendingLabel="처리중..."
                  >
                    발송 지연 저장
                  </AdminConfirmSubmitButton>
                </div>
              ) : (
                <p className="admin-row-muted">발송 전 주문만 지연 처리할 수 있습니다.</p>
              )}
            </AdminPanel>
          </div>
        ) : null}

        <AdminPanel title={readOnly ? "클레임 현황" : "취소·반품·교환 처리"}>
          <div className="admin-claim-list">
            {claims.map((claim) => {
              const claimId = idValue(claim, "id");
              const type = stringValue(claim, "claimType").toUpperCase();
              const status = stringValue(claim, "status").toUpperCase();
              const active = status === "REQUESTED" || status === "APPROVED";
              const approveStatus = type === "CANCEL" ? "APPLIED" : "APPROVED";
              const approveFormId = `admin-claim-approve-${claimId}`;
              const rejectFormId = `admin-claim-reject-${claimId}`;
              const completeFormId = `admin-claim-complete-${claimId}`;

              return (
                <article className="admin-claim-card" key={String(claimId || `${type}-${status}`)}>
                  <div className="admin-claim-card-head">
                    <strong>{claimTypeLabel(type)}</strong>
                    <AdminBadge tone={claimTone(status)}>{claimStatusLabel(status)}</AdminBadge>
                  </div>
                  <p>{stringValue(claim, "reason") || "접수 사유 없음"}</p>
                  {numberValue(claim, "amount") ? <span>{formatWon(numberValue(claim, "amount"))}</span> : null}

                  {!readOnly && active && type !== "DELIVERY_DELAY" && claimId ? (
                    <div className="admin-claim-actions">
                      {status === "REQUESTED" ? (
                        <>
                          <form action={processOrderClaimAction} id={approveFormId}>
                            <input name="orderId" type="hidden" value={String(numericOrderId)} />
                            <input name="claimId" type="hidden" value={String(claimId)} />
                            <input name="status" type="hidden" value={approveStatus} />
                            <input name="redirectTo" type="hidden" value={detailHref} />
                          </form>
                          <AdminConfirmSubmitButton
                            className="admin-button small"
                            confirmMessage={type === "CANCEL" ? "취소 요청을 승인하고 결제 환불과 재고 복구를 처리할까요?" : `${claimTypeLabel(type)} 요청을 승인할까요?`}
                            confirmTitle={`${claimTypeLabel(type)} 승인`}
                            form={approveFormId}
                            pendingLabel="처리중..."
                            tone={type === "CANCEL" ? "danger" : "default"}
                          >
                            승인
                          </AdminConfirmSubmitButton>
                        </>
                      ) : null}

                      <form action={processOrderClaimAction} id={rejectFormId}>
                        <input name="orderId" type="hidden" value={String(numericOrderId)} />
                        <input name="claimId" type="hidden" value={String(claimId)} />
                        <input name="status" type="hidden" value="REJECTED" />
                        <input name="redirectTo" type="hidden" value={detailHref} />
                      </form>
                      <AdminConfirmSubmitButton
                        className="admin-button secondary small"
                        confirmMessage={`${claimTypeLabel(type)} 요청을 반려할까요?`}
                        confirmTitle={`${claimTypeLabel(type)} 반려`}
                        form={rejectFormId}
                        pendingLabel="처리중..."
                      >
                        반려
                      </AdminConfirmSubmitButton>

                      {status === "APPROVED" && (type === "RETURN" || type === "EXCHANGE") ? (
                        <>
                          <form action={processOrderClaimAction} id={completeFormId}>
                            <input name="orderId" type="hidden" value={String(numericOrderId)} />
                            <input name="claimId" type="hidden" value={String(claimId)} />
                            <input name="status" type="hidden" value="COMPLETED" />
                            <input name="redirectTo" type="hidden" value={detailHref} />
                          </form>
                          <AdminConfirmSubmitButton
                            className="admin-button small"
                            confirmMessage={type === "RETURN" ? "반품 입고를 확인하고 결제 환불과 재고 복구를 완료할까요?" : "교환 상품 배송완료를 확인하고 교환 처리를 완료할까요?"}
                            confirmTitle={`${claimTypeLabel(type)} 완료`}
                            form={completeFormId}
                            pendingLabel="처리중..."
                            tone={type === "RETURN" ? "danger" : "default"}
                          >
                            처리 완료
                          </AdminConfirmSubmitButton>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
            {!claims.length ? <p className="admin-row-muted">접수된 취소·반품·교환 또는 발송 지연 이력이 없습니다.</p> : null}
          </div>

          {!readOnly && !orderCanceled ? (
            <div className="admin-claim-create">
              <h3>반품·교환 수동 접수</h3>
              <form action={createOrderClaimAction} className="admin-status-stack" id="admin-order-claim-create-form">
                <input name="orderId" type="hidden" value={String(numericOrderId)} />
                <input name="redirectTo" type="hidden" value={detailHref} />
                <label className="admin-field">
                  <span>접수 종류</span>
                  <select className="admin-select" name="claimType" defaultValue="RETURN">
                    <option value="RETURN">반품</option>
                    <option value="EXCHANGE">교환</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>접수 사유</span>
                  <textarea
                    className="admin-textarea"
                    maxLength={450}
                    name="reason"
                    placeholder="고객 요청 내용과 접수 사유를 입력해주세요."
                    required
                    rows={4}
                  />
                </label>
              </form>
              <AdminConfirmSubmitButton
                className="admin-button secondary"
                confirmMessage="입력한 내용으로 반품 또는 교환을 접수할까요?"
                confirmTitle="클레임 접수"
                form="admin-order-claim-create-form"
                pendingLabel="접수중..."
              >
                반품·교환 접수
              </AdminConfirmSubmitButton>
            </div>
          ) : null}
        </AdminPanel>
      </div>
    </div>
  );
}
