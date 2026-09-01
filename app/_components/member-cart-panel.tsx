"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  deleteMemberCartItem,
  dispatchMemberCartSync,
  fetchMemberCart,
  saveMemberCartItem,
  type MemberCartItem,
} from "../_lib/member-cart";
import { addressAlias, addressLine, isDefaultAddress, type MemberAddress } from "../_lib/member-address";
import {
  readMemberCheckoutDraft,
  writeMemberCheckoutDraft,
  type MemberCheckoutDraft,
} from "../_lib/member-checkout-draft";
import { writeMemberOrderDraft } from "../_lib/member-order-draft";
import type { Product } from "../_lib/store-data";
import { calculateShippingBreakdown, remainingForFreeShipping } from "../_lib/storefront-policy";
import { AddressSearchButton } from "./address-search-button";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      widgets: (params: { customerKey: string }) => {
        renderAgreement: (params: { selector: string }) => Promise<unknown>;
        renderPaymentMethods: (params: { selector: string; variantKey?: string }) => Promise<unknown>;
        setAmount: (params: { currency: "KRW"; value: number }) => Promise<void>;
        requestPayment: (params: {
          customerEmail?: string;
          customerMobilePhone?: string;
          customerName?: string;
          failUrl: string;
          orderId: string;
          orderName: string;
          successUrl: string;
        }) => Promise<void>;
      };
    };
  }
}

type TossPaymentWidgets = ReturnType<NonNullable<Window["TossPayments"]>> extends infer TossInstance
  ? TossInstance extends { widgets: (params: { customerKey: string }) => infer Widgets }
    ? Widgets
    : never
  : never;

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function displayOptionLabel(value: string) {
  const label = value.trim();
  return !label || label === "기본 상품" || label === "상품" ? "없음" : label;
}

type OrderQuote = {
  checkoutIntent: string;
  discountAmount: number;
  freeShippingThreshold: number;
  orderId: string;
  productAmount: number;
  remainingForFreeShipping: number;
  remoteAreaFee: number;
  shippingFee: number;
  totalPaymentAmount: number;
};

async function fetchOrderQuote(items: MemberCartItem[], zipCode: string): Promise<OrderQuote> {
  const response = await fetch("/api/member/orders/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      zipCode,
      items: items.map((item) => ({
        skuId: item.skuId,
        quantity: item.quantity,
      })),
    }),
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    const detail = data?.detail ? ` ${data.detail}` : "";
    throw new Error(`${data?.message || "주문 금액을 확인하지 못했습니다."}${detail}`);
  }

  return {
    checkoutIntent: String(data.checkoutIntent || ""),
    orderId: String(data.orderId || ""),
    productAmount: Number(data.productAmount || 0),
    shippingFee: Number(data.shippingFee || 0),
    remoteAreaFee: Number(data.remoteAreaFee || 0),
    discountAmount: Number(data.discountAmount || 0),
    totalPaymentAmount: Number(data.totalPaymentAmount || 0),
    freeShippingThreshold: Number(data.freeShippingThreshold || 0),
    remainingForFreeShipping: Number(data.remainingForFreeShipping || 0),
  };
}

export function MemberCartPanel({
  baseShippingFee,
  defaultName,
  defaultPhone,
  customerEmail,
  customerKey,
  loggedIn,
  orderSessionReady,
  productCatalog = [],
  freeShippingThreshold,
  remoteAreaFee,
  remoteAreaZipRanges,
  mode = "cart",
}: {
  baseShippingFee: number;
  customerEmail?: string;
  customerKey?: string;
  defaultName?: string;
  defaultPhone?: string;
  loggedIn: boolean;
  orderSessionReady: boolean;
  productCatalog?: Product[];
  freeShippingThreshold: number;
  remoteAreaFee: number;
  remoteAreaZipRanges: string[];
  mode?: "cart" | "checkout";
}) {
  const router = useRouter();
  const checkoutMode = mode === "checkout";
  const [items, setItems] = useState<MemberCartItem[]>([]);
  const [selectedSkuIds, setSelectedSkuIds] = useState<Set<number>>(() => new Set());
  const [checkoutSource, setCheckoutSource] = useState<MemberCheckoutDraft["source"]>("cart");
  const [addresses, setAddresses] = useState<MemberAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("new");
  const [addressAliasInput, setAddressAliasInput] = useState("");
  const [receiverName, setReceiverName] = useState(defaultName || "");
  const [receiverPhone, setReceiverPhone] = useState(defaultPhone || "");
  const [zipCode, setZipCode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentWidgetError, setPaymentWidgetError] = useState("");
  const [paymentWidgetReady, setPaymentWidgetReady] = useState(false);
  const paymentWidgetsRef = useRef<TossPaymentWidgets | null>(null);
  const paymentWidgetCustomerRef = useRef("");

  const repairCartItem = useCallback((item: MemberCartItem) => {
    const matchedProduct =
      productCatalog.find((product) => product.skus?.some((sku) => Number(sku.id || 0) === item.skuId)) ||
      productCatalog.find((product) => product.title === item.productTitle);

    return {
      ...item,
      optionLabel: displayOptionLabel(item.optionLabel),
      productSlug: matchedProduct?.slug || item.productSlug,
      productTitle: matchedProduct?.title || item.productTitle,
    };
  }, [productCatalog]);

  useEffect(() => {
    if (!loggedIn) {
      return;
    }

    let canceled = false;

    async function loadItems() {
      try {
        const checkoutDraft = checkoutMode ? readMemberCheckoutDraft() : null;
        const nextItems = checkoutMode
          ? (checkoutDraft?.items || []).map(repairCartItem)
          : (await fetchMemberCart()).map(repairCartItem);
        if (!canceled) {
          setItems(nextItems);
          setSelectedSkuIds(new Set(nextItems.map((item) => item.skuId)));
          if (checkoutDraft) {
            setCheckoutSource(checkoutDraft.source);
          } else if (checkoutMode) {
            setError("주문할 상품 정보가 없거나 만료되었습니다. 장바구니에서 다시 선택해주세요.");
          }
        }
      } catch (cartError) {
        if (!canceled) {
          setItems([]);
          setError(cartError instanceof Error ? cartError.message : "장바구니를 불러오지 못했습니다.");
        }
      }
    }

    void loadItems();

    return () => {
      canceled = true;
    };
  }, [checkoutMode, loggedIn, repairCartItem]);

  useEffect(() => {
    let canceled = false;

    async function loadAddresses() {
      if (!checkoutMode || !loggedIn || !orderSessionReady) {
        return;
      }

      try {
        const response = await fetch("/api/member/addresses", { credentials: "same-origin" });
        const data = (await response.json().catch(() => ({}))) as { addresses?: MemberAddress[] };
        if (canceled) {
          return;
        }
        const savedAddresses = data.addresses || [];
        setAddresses(savedAddresses);
        const defaultAddress = savedAddresses.find(isDefaultAddress) || savedAddresses[0];
        if (defaultAddress) {
          applyAddress(defaultAddress);
        }
      } catch {
        if (!canceled) {
          setAddresses([]);
        }
      }
    }

    void loadAddresses();

    return () => {
      canceled = true;
    };
  }, [checkoutMode, loggedIn, orderSessionReady]);

  const selectedItems = useMemo(
    () => checkoutMode ? items : items.filter((item) => selectedSkuIds.has(item.skuId)),
    [checkoutMode, items, selectedSkuIds],
  );
  const allItemsSelected = items.length > 0 && items.every((item) => selectedSkuIds.has(item.skuId));
  const productAmount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [selectedItems],
  );
  const shippingPolicy = useMemo(
    () => ({
      baseShippingFee,
      freeShippingThreshold,
      remoteAreaFee,
      remoteAreaZipRanges,
      deliveryGuide: "",
      exchangeReturnGuide: "",
      safetyTip: "",
    }),
    [baseShippingFee, freeShippingThreshold, remoteAreaFee, remoteAreaZipRanges],
  );
  const shippingBreakdown = calculateShippingBreakdown(productAmount, shippingPolicy, zipCode);
  const shippingFee = shippingBreakdown.shippingFee;
  const totalPaymentAmount = productAmount + shippingFee;
  const freeShippingRemaining = remainingForFreeShipping(productAmount, shippingPolicy);
  const tossClientKey = process.env.NEXT_PUBLIC_HEALTH_BOX_TOSS_CLIENT_KEY || "";
  const customerIdentifier = customerKey || "healthbox-member-anonymous";

  function commitItems(nextItems: MemberCartItem[]) {
    setItems(nextItems);
    dispatchMemberCartSync();
  }

  function toggleItemSelection(skuId: number) {
    setSelectedSkuIds((current) => {
      const next = new Set(current);
      if (next.has(skuId)) {
        next.delete(skuId);
      } else {
        next.add(skuId);
      }
      return next;
    });
  }

  function toggleAllItems() {
    setSelectedSkuIds(() =>
      allItemsSelected ? new Set() : new Set(items.map((item) => item.skuId)),
    );
  }

  async function updateQuantity(skuId: number, quantity: number) {
    const nextQuantity = Math.max(1, Math.min(99, quantity));
    commitItems(items.map((item) => item.skuId === skuId ? { ...item, quantity: nextQuantity } : item));

    try {
      commitItems((await saveMemberCartItem(skuId, nextQuantity)).map(repairCartItem));
    } catch (quantityError) {
      setError(quantityError instanceof Error ? quantityError.message : "수량을 변경하지 못했습니다.");
      commitItems((await fetchMemberCart().catch(() => items)).map(repairCartItem));
    }
  }

  async function removeItem(skuId: number) {
    const previousItems = items;
    commitItems(items.filter((item) => item.skuId !== skuId));
    setSelectedSkuIds((current) => {
      const next = new Set(current);
      next.delete(skuId);
      return next;
    });

    try {
      commitItems((await deleteMemberCartItem(skuId)).map(repairCartItem));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "상품을 삭제하지 못했습니다.");
      commitItems(previousItems);
    }
  }

  function applyAddress(address: MemberAddress) {
    setSelectedAddressId(String(address.id));
    setAddressAliasInput(addressAlias(address));
    setReceiverName(address.receiverName || "");
    setReceiverPhone(address.receiverPhone || "");
    setZipCode(address.zipCode || "");
    setBaseAddress(address.baseAddress || "");
    setDetailAddress(address.detailAddress || "");
  }

  function startNewAddress() {
    setSelectedAddressId("new");
    setAddressAliasInput("");
    setReceiverName(defaultName || "");
    setReceiverPhone(defaultPhone || "");
    setZipCode("");
    setBaseAddress("");
    setDetailAddress("");
  }

  async function saveNewAddressTemplate() {
    setMessage("");
    setError("");

    if (Number(selectedAddressId || 0)) {
      setError("저장된 배송지 수정은 마이페이지 배송지 설정에서 할 수 있습니다.");
      return;
    }

    if (!addressAliasInput.trim() || !receiverName.trim() || !receiverPhone.trim() || !baseAddress.trim()) {
      setError("별칭, 받는 분, 연락처, 주소를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/member/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          receiverName,
          addressAlias: addressAliasInput,
          receiverPhone,
          zipCode,
          baseAddress,
          detailAddress,
          defaultYn: addresses.length ? "N" : "Y",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { address?: MemberAddress; addresses?: MemberAddress[]; message?: string; ok?: boolean };
      if (!response.ok || data.ok === false) {
        throw new Error(data.message || "배송지를 저장하지 못했습니다.");
      }

      setMessage(data.message || "배송지를 저장했습니다.");
      const listResponse = await fetch("/api/member/addresses", { credentials: "same-origin" });
      const listData = (await listResponse.json().catch(() => ({}))) as { addresses?: MemberAddress[] };
      const nextAddresses = listData.addresses || [];
      setAddresses(nextAddresses);
      if (data.address?.id) {
        setSelectedAddressId(String(data.address.id));
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "배송지를 저장하지 못했습니다.");
    }
  }

  function loadTossPaymentsSdk() {
    return new Promise<void>((resolve, reject) => {
      if (window.TossPayments) {
        resolve();
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>("script[data-toss-payments-sdk]");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다.")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js.tosspayments.com/v2/standard";
      script.async = true;
      script.dataset.tossPaymentsSdk = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("토스페이먼츠 SDK를 불러오지 못했습니다."));
      document.head.appendChild(script);
    });
  }

  useEffect(() => {
    let canceled = false;

    async function renderPaymentWidget() {
      setPaymentWidgetReady(false);
      setPaymentWidgetError("");

      if (
        !checkoutMode ||
        !loggedIn ||
        !orderSessionReady ||
        !selectedItems.length ||
        totalPaymentAmount <= 0 ||
        !tossClientKey
      ) {
        return;
      }

      try {
        const existingWidgets = paymentWidgetsRef.current;
        if (existingWidgets && paymentWidgetCustomerRef.current === customerIdentifier) {
          await existingWidgets.setAmount({ currency: "KRW", value: totalPaymentAmount });
          if (!canceled) {
            setPaymentWidgetReady(true);
          }
          return;
        }

        paymentWidgetsRef.current = null;
        paymentWidgetCustomerRef.current = "";
        document.querySelector("#health-box-payment-methods")?.replaceChildren();
        document.querySelector("#health-box-payment-agreement")?.replaceChildren();

        await loadTossPaymentsSdk();
        if (canceled) {
          return;
        }

        const tossPayments = window.TossPayments?.(tossClientKey);
        const widgets = tossPayments?.widgets({ customerKey: customerIdentifier });

        if (!widgets) {
          throw new Error("토스페이먼츠 결제위젯을 초기화하지 못했습니다.");
        }

        await widgets.setAmount({ currency: "KRW", value: totalPaymentAmount });
        await widgets.renderPaymentMethods({ selector: "#health-box-payment-methods" });
        await widgets.renderAgreement({ selector: "#health-box-payment-agreement" });

        if (!canceled) {
          paymentWidgetsRef.current = widgets;
          paymentWidgetCustomerRef.current = customerIdentifier;
          setPaymentWidgetReady(true);
        }
      } catch (widgetError) {
        if (!canceled) {
          setPaymentWidgetError(widgetError instanceof Error ? widgetError.message : "결제수단을 불러오지 못했습니다.");
        }
      }
    }

    void renderPaymentWidget();

    return () => {
      canceled = true;
    };
  }, [checkoutMode, customerIdentifier, loggedIn, orderSessionReady, selectedItems.length, tossClientKey, totalPaymentAmount]);

  function startCheckout() {
    setMessage("");
    setError("");

    if (!selectedItems.length) {
      setError("주문할 상품을 선택해주세요.");
      return;
    }

    writeMemberCheckoutDraft("cart", selectedItems);
    router.push("/cart/checkout");
  }

  async function handleOrder() {
    setMessage("");
    setError("");

    if (!loggedIn) {
      setError("로그인 후 주문할 수 있습니다.");
      return;
    }

    if (!orderSessionReady) {
      setError("로그인 정보가 만료되었습니다. 다시 로그인 후 주문해주세요.");
      return;
    }

    if (!selectedItems.length) {
      setError("주문할 상품을 담아주세요.");
      return;
    }

    if (!receiverName.trim() || !receiverPhone.trim() || !baseAddress.trim()) {
      setError("받는 분, 연락처, 주소를 입력해주세요.");
      return;
    }

    if (!tossClientKey) {
      setError("결제 클라이언트 키가 설정되지 않았습니다.");
      return;
    }

    setLoading(true);
    try {
      if (!paymentWidgetReady) {
        setError(paymentWidgetError || "결제수단을 선택할 수 있도록 잠시 후 다시 시도해주세요.");
        return;
      }

      const orderName =
        selectedItems.length > 1
          ? `${selectedItems[0].productTitle} 외 ${selectedItems.length - 1}건`
          : selectedItems[0]?.productTitle || "건강창고 주문";
      const quote = await fetchOrderQuote(selectedItems, zipCode);

      if (!quote.orderId || !quote.checkoutIntent || quote.totalPaymentAmount <= 0) {
        throw new Error("주문 금액을 확인하지 못했습니다.");
      }

      writeMemberOrderDraft({
        amount: quote.totalPaymentAmount,
        baseAddress,
        buyerAddressId: Number(selectedAddressId || 0) || undefined,
        checkoutIntent: quote.checkoutIntent,
        detailAddress,
        items: selectedItems.map((item) => ({
          skuId: item.skuId,
          optionLabel: item.optionLabel,
          quantity: item.quantity,
        })),
        orderId: quote.orderId,
        orderName,
        receiverName,
        receiverPhone,
        zipCode,
      });

      const widgets = paymentWidgetsRef.current;
      if (!widgets) {
        throw new Error("결제수단을 선택할 수 있도록 잠시 후 다시 시도해주세요.");
      }
      await widgets.setAmount({ currency: "KRW", value: quote.totalPaymentAmount });

      const origin = window.location.origin;
      await widgets.requestPayment({
        orderId: quote.orderId,
        orderName,
        customerEmail,
        customerName: receiverName,
        customerMobilePhone: receiverPhone.replace(/[^0-9]/g, ""),
        successUrl: `${origin}/cart/payment/success`,
        failUrl: `${origin}/cart/payment/fail`,
      });
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "결제 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="cart-page-head">
        <Link aria-label="이전으로" className="cart-back-link" href={checkoutMode ? "/cart" : "/"}>
          <span aria-hidden="true">‹</span>
        </Link>
        <h1>{checkoutMode ? "주문/결제" : `장바구니(${items.length})`}</h1>
        <div className="cart-stepper" aria-label="주문 단계">
          <span>01 옵션선택</span>
          <i aria-hidden="true">›</i>
          {checkoutMode ? <span>02 장바구니</span> : <strong>02 장바구니</strong>}
          <i aria-hidden="true">›</i>
          {checkoutMode ? <strong>03 주문/결제</strong> : <span>03 주문/결제</span>}
          <i aria-hidden="true">›</i>
          <span>04 주문완료</span>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-list-panel">
          {!checkoutMode && items.length ? (
            <div className="cart-selection-toolbar">
              <label className="cart-selection-check">
                <input
                  checked={allItemsSelected}
                  onChange={toggleAllItems}
                  type="checkbox"
                />
                <span>전체 선택</span>
              </label>
              <span>선택 {selectedItems.length}개</span>
            </div>
          ) : checkoutMode && items.length ? (
            <div className="cart-checkout-source">
              {checkoutSource === "buy-now" ? "바로 구매 상품" : "장바구니에서 선택한 상품"}만 주문합니다.
            </div>
          ) : null}
          <div className="cart-list">
            {items.map((item) => (
              <article
                className={`cart-item${checkoutMode ? " is-checkout" : ""}${selectedSkuIds.has(item.skuId) ? " is-selected" : ""}`}
                key={item.skuId}
              >
                {!checkoutMode ? (
                  <label className="cart-item-check">
                    <input
                      aria-label={`${item.productTitle} 선택`}
                      checked={selectedSkuIds.has(item.skuId)}
                      onChange={() => toggleItemSelection(item.skuId)}
                      type="checkbox"
                    />
                  </label>
                ) : null}
                <Link className="cart-thumb" href={`/product/${item.productSlug}`}>
                  {item.image ? (
                    <Image alt={item.productTitle} className="object-cover" fill sizes="120px" src={item.image} />
                  ) : null}
                </Link>

                <Link className="cart-item-copy" href={`/product/${item.productSlug}`}>
                  <h4>{item.productTitle}</h4>
                  <p className="product-subtitle">옵션: {displayOptionLabel(item.optionLabel)}</p>
                </Link>

                <div className="cart-item-meta">
                  {!checkoutMode ? (
                    <>
                      <button className="text-button cart-remove-button" onClick={() => void removeItem(item.skuId)} type="button">
                        삭제
                      </button>
                      <div className="shop-quantity-stepper" aria-label={`${item.productTitle} 수량 선택`}>
                        <button
                          aria-label="수량 감소"
                          disabled={item.quantity <= 1}
                          onClick={() => void updateQuantity(item.skuId, item.quantity - 1)}
                          type="button"
                        >
                          -
                        </button>
                        <strong aria-live="polite">{item.quantity}</strong>
                        <button
                          aria-label="수량 증가"
                          onClick={() => void updateQuantity(item.skuId, item.quantity + 1)}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="cart-checkout-quantity">수량 {item.quantity}개</span>
                  )}
                  <strong>{formatWon(item.unitPrice * item.quantity)}</strong>
                </div>
              </article>
            ))}

            {!items.length ? (
              <div className="info-panel compact">
                <p className="member-auth-empty">
                  {checkoutMode
                    ? "주문할 상품이 없습니다. 장바구니에서 상품을 다시 선택해주세요."
                    : "장바구니에 담긴 상품이 없습니다."}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="summary-panel">
          <h3 className="section-panel-title">주문 예상 금액</h3>

          <div className="summary-rows">
            <div className="summary-row">
              <span>총 상품 가격</span>
              <strong>{formatWon(productAmount)}</strong>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <strong>
                {shippingBreakdown.baseShippingFee ? `+${formatWon(shippingBreakdown.baseShippingFee)}` : "무료"}
              </strong>
            </div>
            {shippingBreakdown.remoteAreaFee ? (
              <div className="summary-row">
                <span>제주·도서산간 추가 배송비</span>
                <strong>{`+${formatWon(shippingBreakdown.remoteAreaFee)}`}</strong>
              </div>
            ) : null}
            <div className="summary-row total">
              <span>총 결제 예상 금액</span>
              <strong>{formatWon(totalPaymentAmount)}</strong>
            </div>
          </div>

          {items.length && freeShippingRemaining > 0 ? (
            <p className="cart-shipping-notice">
              {formatWon(freeShippingRemaining)} 더 담으면 기본 배송비가 무료입니다.
            </p>
          ) : items.length && freeShippingThreshold > 0 ? (
            <p className="cart-shipping-notice is-free">무료배송 조건을 충족했습니다.</p>
          ) : null}

          {items.length && shippingBreakdown.isRemoteArea && remoteAreaFee > 0 ? (
            <p className="cart-shipping-notice is-remote-area">
              제주·도서산간 지역으로 추가 배송비 {formatWon(remoteAreaFee)}이 더해집니다.
            </p>
          ) : items.length && remoteAreaFee > 0 && !zipCode ? (
            <p className="cart-shipping-notice">
              배송지를 선택하면 제주·도서산간 추가 배송비가 반영됩니다.
            </p>
          ) : null}

          {checkoutMode ? <div className="cart-order-form">
            {addresses.length ? (
              <div className="cart-address-select-wrap">
                <label className="member-auth-field">
                  <span>배송지 선택</span>
                  <select
                    className="member-auth-input"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (nextValue === "new") {
                        startNewAddress();
                        return;
                      }
                      const address = addresses.find((entry) => String(entry.id) === nextValue);
                      if (address) {
                        applyAddress(address);
                      }
                    }}
                    value={selectedAddressId}
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={String(address.id)}>
                        {addressAlias(address)}{isDefaultAddress(address) ? " (기본)" : ""}
                      </option>
                    ))}
                    <option value="new">새 배송지</option>
                  </select>
                </label>
                {selectedAddressId !== "new" ? (
                  <div className="cart-address-selected">
                    <strong>{addressAlias(addresses.find((address) => String(address.id) === selectedAddressId) || {})}</strong>
                    <span>{addressLine(addresses.find((address) => String(address.id) === selectedAddressId) || { baseAddress, detailAddress, zipCode })}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            {selectedAddressId === "new" ? (
              <>
                <label className="member-auth-field">
                  <span>별칭</span>
                  <input className="member-auth-input" onChange={(event) => setAddressAliasInput(event.target.value)} placeholder="예: 집, 회사" value={addressAliasInput} />
                </label>
                <label className="member-auth-field">
                  <span>받는 분</span>
                  <input className="member-auth-input" onChange={(event) => setReceiverName(event.target.value)} value={receiverName} />
                </label>
                <label className="member-auth-field">
                  <span>연락처</span>
                  <input
                    className="member-auth-input"
                    inputMode="tel"
                    onChange={(event) => setReceiverPhone(event.target.value)}
                    value={receiverPhone}
                  />
                </label>
                <label className="member-auth-field">
                  <span>우편번호</span>
                  <div className="address-search-row">
                    <input className="member-auth-input" onChange={(event) => setZipCode(event.target.value)} value={zipCode} />
                    <AddressSearchButton
                      onSelect={(address) => {
                        setZipCode(address.zipCode);
                        setBaseAddress(address.baseAddress);
                      }}
                    />
                  </div>
                </label>
                <label className="member-auth-field">
                  <span>주소</span>
                  <input className="member-auth-input" onChange={(event) => setBaseAddress(event.target.value)} value={baseAddress} />
                </label>
                <label className="member-auth-field">
                  <span>상세주소</span>
                  <input className="member-auth-input" onChange={(event) => setDetailAddress(event.target.value)} value={detailAddress} />
                </label>
                {loggedIn && orderSessionReady ? (
                  <button className="address-save-inline-button" onClick={() => void saveNewAddressTemplate()} type="button">
                    배송지 저장
                  </button>
                ) : null}
              </>
            ) : null}
          </div> : null}

          {message ? <div className="member-auth-alert is-success">{message}</div> : null}
          {error ? <div className="member-auth-alert is-error">{error}</div> : null}

          {checkoutMode && loggedIn && !orderSessionReady ? (
            <div className="member-auth-alert is-error">
              로그인 정보가 오래되었습니다. 다시 로그인 후 주문해주세요.
            </div>
          ) : null}

          {checkoutMode && loggedIn && orderSessionReady && selectedItems.length ? (
            <div className="cart-payment-widget">
              <div id="health-box-payment-methods" />
              <div id="health-box-payment-agreement" />
              {paymentWidgetError ? <div className="member-auth-alert is-error">{paymentWidgetError}</div> : null}
            </div>
          ) : null}

          {!checkoutMode && loggedIn && orderSessionReady ? (
            <button
              className="button-primary full-width-button"
              disabled={!selectedItems.length}
              onClick={startCheckout}
              type="button"
            >
              {selectedItems.length ? `선택 상품 ${selectedItems.length}개 주문하기` : "상품을 선택해주세요"}
            </button>
          ) : checkoutMode && loggedIn && orderSessionReady ? (
            <button
              className="button-primary full-width-button"
              disabled={loading || !selectedItems.length || !paymentWidgetReady}
              onClick={() => void handleOrder()}
              type="button"
            >
              {loading
                ? "결제 준비 중..."
                : !selectedItems.length
                  ? "상품을 선택해주세요"
                  : paymentWidgetReady
                    ? "결제 후 주문"
                    : "결제수단 준비 중..."}
            </button>
          ) : loggedIn ? (
            <Link className="button-primary full-width-button" href={`/login?next=${encodeURIComponent(checkoutMode ? "/cart/checkout" : "/cart")}`}>
              다시 로그인 후 주문
            </Link>
          ) : (
            <Link className="button-primary full-width-button" href={`/login?next=${encodeURIComponent(checkoutMode ? "/cart/checkout" : "/cart")}`}>
              로그인 후 주문
            </Link>
          )}
          {checkoutMode ? (
            <Link className="button-secondary full-width-button" href="/cart">
              장바구니로 돌아가기
            </Link>
          ) : null}
          <Link className="button-secondary full-width-button" href="/">계속 쇼핑하기</Link>
        </aside>
      </div>
    </>
  );
}
