"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../_lib/store-data";
import { addMemberCartItems, type MemberCartItem } from "../_lib/member-cart";

type DropdownOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type SelectedPurchaseItem = {
  key: string;
  label: string;
  quantity: number;
  skuId?: number;
  soldOut: boolean;
  stockQuantity?: number;
  unitPrice: number;
};

type PurchaseContextValue = {
  option: string;
  quantity: number;
  selectedItems: SelectedPurchaseItem[];
  selectedValues: Record<string, string>;
  setOption: (option: string) => void;
  setQuantity: (quantity: number | ((current: number) => number)) => void;
  setSelectedItems: (
    items: SelectedPurchaseItem[] | ((current: SelectedPurchaseItem[]) => SelectedPurchaseItem[]),
  ) => void;
  setSelectedValues: (values: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)) => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function ProductPurchaseProvider({ children }: { children: ReactNode }) {
  const [option, setOption] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedItems, setSelectedItems] = useState<SelectedPurchaseItem[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  return (
    <PurchaseContext.Provider
      value={{ option, quantity, selectedItems, selectedValues, setOption, setQuantity, setSelectedItems, setSelectedValues }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

function usePurchaseContext() {
  const context = useContext(PurchaseContext);

  if (!context) {
    throw new Error("Product purchase controls must be used inside ProductPurchaseProvider.");
  }

  return context;
}

function parseWon(value: string) {
  const number = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function isSkuSoldOut(sku: NonNullable<Product["skus"]>[number] | undefined) {
  return !sku || sku.soldOutYn === "Y" || sku.stockQuantity === 0;
}

function formatAdditionalPrice(additionalPrice: number) {
  if (!additionalPrice) {
    return "";
  }

  const prefix = additionalPrice > 0 ? "+" : "-";
  return ` (${prefix}${Math.abs(additionalPrice).toLocaleString("ko-KR")}원)`;
}

function stripProductName(label: string | undefined, productName: string) {
  if (!label) {
    return "없음";
  }

  const prefix = `${productName} /`;
  const stripped = label.startsWith(prefix) ? label.slice(prefix.length).trim() : label.trim();
  return !stripped || stripped === productName || stripped === "상품" ? "없음" : stripped;
}

type ProductOptionDropdownHandle = {
  focusAndOpen: () => void;
};

type ProductOptionDropdownProps = {
  buttonLabel?: string;
  id: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  value: string;
};

const ProductOptionDropdown = forwardRef<ProductOptionDropdownHandle, ProductOptionDropdownProps>(
function ProductOptionDropdown(
  { buttonLabel, id, onChange, options, placeholder = "선택", value },
  ref,
) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useImperativeHandle(ref, () => ({
    focusAndOpen() {
      buttonRef.current?.focus();
      setOpen(true);
    },
  }));

  return (
    <div
      className={`shop-custom-select${open ? " is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`shop-custom-select-button${selectedOption ? "" : " is-placeholder"}`}
        id={id}
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <span>{selectedOption?.label || buttonLabel || placeholder}</span>
      </button>
      {open ? (
        <div aria-labelledby={id} className="shop-custom-select-list" role="listbox" tabIndex={-1}>
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`shop-custom-select-option${option.value === value ? " is-selected" : ""}`}
              disabled={option.disabled}
              key={option.value}
              onClick={() => {
                if (option.disabled) {
                  return;
                }
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
});

export function ProductPurchaseBox({
  brand,
  title,
  price,
  productImage,
  productSlug,
  highlights,
  displaySubtitle,
  className = "",
  optionGroups = [],
  skus = [],
}: {
  brand: string;
  title: string;
  price: string;
  productImage: string;
  productSlug: string;
  highlights: string[];
  displaySubtitle?: string;
  className?: string;
  optionGroups?: Product["optionGroups"];
  skus?: Product["skus"];
}) {
  const router = useRouter();
  const { quantity, selectedItems, selectedValues, setQuantity, setSelectedItems, setSelectedValues } = usePurchaseContext();
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const optionId = useId();
  const dropdownRefs = useRef<Array<ProductOptionDropdownHandle | null>>([]);
  const activeGroups = (optionGroups || []).filter((group) => group.groupName && group.values?.length);
  const activeSkus = (skus || []).filter((sku) => sku.status !== "INACTIVE");
  const hasGroupedOptions = activeGroups.length > 0;
  const basicSku =
    activeSkus.find((sku) => !(sku.optionValueCodes || []).length) ||
    activeSkus[0];
  const basicStockQuantity =
    typeof basicSku?.stockQuantity === "number" ? Math.max(0, basicSku.stockQuantity) : 99;
  const isBasicSoldOut = isSkuSoldOut(basicSku) || basicStockQuantity <= 0;
  const basePrice = parseWon(price);
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const basicQuantity = isBasicSoldOut ? 0 : Math.min(quantity, basicStockQuantity);

  function skuKey(sku: NonNullable<Product["skus"]>[number], fallback: string, overrideKey?: string) {
    return overrideKey || String(sku.id || sku.skuCode || sku.optionValueCodes?.join("|") || sku.skuName || fallback);
  }

  function findSkuByOptionCode(valueCode: string) {
    return (
      activeSkus.find((sku) => (sku.optionValueCodes || []).includes(valueCode) && (sku.optionValueCodes || []).length === 1) ||
      activeSkus.find((sku) => (sku.optionValueCodes || []).includes(valueCode))
    );
  }

  function addSelectedItem(sku: NonNullable<Product["skus"]>[number], label: string, override?: { key?: string; unitPrice?: number; soldOut?: boolean }) {
    const key = skuKey(sku, label, override?.key);
    const unitPrice = typeof sku.memberPrice === "number" && sku.memberPrice > 0 ? sku.memberPrice : basePrice;
    const soldOut = override?.soldOut ?? isSkuSoldOut(sku);
    const resolvedUnitPrice = override?.unitPrice ?? unitPrice;
    const stockQuantity = typeof sku.stockQuantity === "number" ? Math.max(0, sku.stockQuantity) : undefined;
    const maxQuantity = stockQuantity ?? 99;

    setSelectedItems((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key
            ? {
                ...item,
                label,
                quantity: Math.min(maxQuantity, item.quantity + 1),
                soldOut,
                stockQuantity,
                unitPrice: resolvedUnitPrice,
              }
            : item,
        );
      }

      return [...current, { key, label, quantity: Math.min(1, maxQuantity), skuId: sku.id, soldOut, stockQuantity, unitPrice: resolvedUnitPrice }];
    });
  }

  function addRequiredOptionSet(nextSelectedValues: Record<string, string>) {
    const requiredGroups = activeGroups.filter((group) => group.requiredYn !== "N");
    const requiredCodes = requiredGroups.map((group) => nextSelectedValues[group.groupName || ""]).filter(Boolean);

    if (!requiredGroups.length || requiredCodes.length !== requiredGroups.length) {
      return;
    }

    const exactSku = activeSkus.find((sku) => {
      const codes = sku.optionValueCodes || [];
      return codes.length === requiredCodes.length && requiredCodes.every((code) => codes.includes(code));
    });
    const partSkus = requiredCodes.map((code) => findSkuByOptionCode(code)).filter(Boolean) as NonNullable<Product["skus"]>;
    const label = requiredGroups
      .map((group) => {
        const code = nextSelectedValues[group.groupName || ""];
        return (group.values || []).find((value) => (value.valueCode || value.valueName) === code)?.valueName;
      })
      .filter(Boolean)
      .join(" / ");
    const unitPrice = exactSku
      ? exactSku.memberPrice || basePrice
      : basePrice +
        partSkus.reduce(
          (sum, sku) => sum + Math.max(0, typeof sku.memberPrice === "number" ? sku.memberPrice - basePrice : 0),
          0,
        );
    const representativeSku = exactSku || partSkus[0];

    if (!representativeSku || !label) {
      return;
    }

    addSelectedItem(representativeSku, label, {
      key: requiredCodes.join("|"),
      soldOut: exactSku ? isSkuSoldOut(exactSku) : partSkus.some((sku) => isSkuSoldOut(sku)),
      unitPrice,
    });
    setSelectedValues((current) => {
      const resetValues = { ...current };
      requiredGroups.forEach((group) => {
        delete resetValues[group.groupName || ""];
      });
      return resetValues;
    });
  }

  function updateSelectedItemQuantity(key: string, quantity: number) {
    setSelectedItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const maxQuantity = item.stockQuantity ?? 99;
        return { ...item, quantity: Math.max(1, Math.min(maxQuantity, quantity)) };
      }),
    );
  }

  function removeSelectedItem(key: string) {
    setSelectedItems((current) => current.filter((item) => item.key !== key));
  }

  function getCartItems() {
    const items = hasGroupedOptions
      ? selectedItems
      : basicSku
        ? [
            {
              key: skuKey(basicSku, title),
              label: stripProductName(basicSku.skuName, title),
              quantity: basicQuantity,
              skuId: basicSku.id,
              soldOut: isBasicSoldOut,
              unitPrice: typeof basicSku.memberPrice === "number" && basicSku.memberPrice > 0 ? basicSku.memberPrice : basePrice,
            },
          ]
        : [];

    return items
      .filter((item) => item.skuId && !item.soldOut && item.quantity > 0)
      .map<MemberCartItem>((item) => ({
        image: productImage,
        optionLabel: item.label || "없음",
        productSlug,
        productTitle: title,
        quantity: item.quantity,
        skuId: Number(item.skuId),
        unitPrice: item.unitPrice,
      }));
  }

  function handleCartAction(nextPath?: string) {
    setPurchaseMessage("");
    const cartItems = getCartItems();

    if (!cartItems.length) {
      setPurchaseMessage(hasGroupedOptions ? "옵션을 선택해주세요." : "현재 담을 수 있는 상품이 없습니다.");
      return;
    }

    addMemberCartItems(cartItems);
    setPurchaseMessage("장바구니에 담았습니다.");

    if (nextPath) {
      router.push(nextPath);
    }
  }

  return (
    <div className={`shop-purchase-box ${className}`}>
      <div className="detail-chip-row">
        {highlights.slice(0, 3).map((highlight, index) => (
          <span className={`detail-chip${index === 0 ? " primary" : ""}`} key={highlight}>
            {highlight}
          </span>
        ))}
      </div>

      <p className="detail-brand">{brand}</p>
      <h1 className="detail-title">{title}</h1>
      {displaySubtitle ? <p className="detail-subtitle">{displaySubtitle}</p> : null}

      <div className="price-panel shop-price-panel">
        <div>
          <p className="price-label">회원 전용가</p>
          <p className="price-value">{price}</p>
        </div>
        <p className="price-note">로그인 후 회원 조건에 맞는 가격과 구매 기능을 확인할 수 있습니다.</p>
      </div>

      {hasGroupedOptions ? (
        activeGroups.map((group, index) => {
          const groupName = group.groupName || `옵션 ${index + 1}`;

          return (
            <div className="shop-option-field" key={groupName}>
              <label id={`${optionId}-${index}-label`}>
                옵션 선택 <span className="option-required-text">{group.requiredYn === "N" ? "(선택)" : "(필수)"}</span>
              </label>
              <ProductOptionDropdown
                buttonLabel={groupName}
                id={`${optionId}-${index}`}
                ref={(node) => {
                  dropdownRefs.current[index] = node;
                }}
                onChange={(value) => {
                  const selectedValue = (group.values || []).find(
                    (currentValue) => (currentValue.valueCode || currentValue.valueName) === value,
                  );
                  const matchingSku = value ? findSkuByOptionCode(value) : undefined;
                  const nextSelectedValues = { ...selectedValues, [groupName]: value };

                  if (group.requiredYn === "N") {
                    setSelectedValues((current) => ({ ...current, [groupName]: "" }));
                    if (matchingSku && selectedValue) {
                      addSelectedItem(matchingSku, selectedValue.valueName || stripProductName(matchingSku.skuName, title));
                    }
                    return;
                  }

                  setSelectedValues(nextSelectedValues);
                  const nextRequiredIndex = activeGroups.findIndex(
                    (currentGroup, currentIndex) =>
                      currentIndex > index &&
                      currentGroup.requiredYn !== "N" &&
                      !nextSelectedValues[currentGroup.groupName || ""],
                  );

                  if (nextRequiredIndex >= 0) {
                    dropdownRefs.current[nextRequiredIndex]?.focusAndOpen();
                    return;
                  }

                  addRequiredOptionSet(nextSelectedValues);
                }}
                options={[
                  ...(group.requiredYn === "N" ? [{ label: "선택 안 함", value: "" }] : []),
                  ...(group.values || []).map((value) => {
                    const valueCode = value.valueCode || value.valueName || "";
                    const displaySku = findSkuByOptionCode(valueCode);
                    const disabled = Boolean(displaySku && isSkuSoldOut(displaySku));
                    const additionalPrice =
                      typeof displaySku?.memberPrice === "number" && basePrice ? displaySku.memberPrice - basePrice : 0;

                    return {
                      disabled,
                      label: `${value.valueName}${formatAdditionalPrice(additionalPrice)}${disabled ? " (품절)" : ""}`,
                      value: valueCode,
                    };
                  }),
                ]}
                placeholder="선택"
                value={selectedValues[groupName] || ""}
              />
            </div>
          );
        })
      ) : (
        <div className="shop-basic-purchase">
          <span className="shop-option-label">수량</span>
          {isBasicSoldOut ? (
            <p className="shop-basic-soldout">현재 품절된 상품입니다.</p>
          ) : (
            <div className="shop-quantity-stepper" aria-label={`${title} 수량 선택`}>
              <button
                aria-label="수량 감소"
                disabled={basicQuantity <= 1}
                onClick={() => setQuantity(Math.max(1, basicQuantity - 1))}
                type="button"
              >
                -
              </button>
              <strong aria-live="polite">{basicQuantity}</strong>
              <button
                aria-label="수량 증가"
                disabled={basicQuantity >= basicStockQuantity}
                onClick={() => setQuantity(Math.min(basicStockQuantity, basicQuantity + 1))}
                type="button"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      {selectedItems.length ? (
        <div className="shop-selected-option-card">
          {selectedItems.map((item) => (
            <div className={`shop-selected-option-line${item.soldOut ? " is-soldout" : ""}`} key={item.key}>
              <div className="shop-selected-option-head">
                <strong>{item.label}</strong>
                <button aria-label={`${item.label} 삭제`} onClick={() => removeSelectedItem(item.key)} type="button">
                  ×
                </button>
              </div>
              {item.soldOut ? (
                <p className="shop-selected-option-soldout">품절된 옵션입니다.</p>
              ) : (
                <div className="shop-selected-option-body">
                  <div className="shop-quantity-stepper" aria-label={`${item.label} 수량 선택`}>
                    <button
                      aria-label="수량 감소"
                      disabled={item.quantity <= 1}
                      onClick={() => updateSelectedItemQuantity(item.key, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <strong aria-live="polite">{item.quantity}</strong>
                    <button
                      aria-label="수량 증가"
                      onClick={() => updateSelectedItemQuantity(item.key, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <strong className="shop-selected-option-price">{(item.unitPrice * item.quantity).toLocaleString("ko-KR")}원</strong>
                </div>
              )}
            </div>
          ))}
          <div className="shop-selected-option-total">
            <span>
              총 <strong>{totalQuantity}</strong>개
            </span>
            <span>
              총 금액 <strong>{totalPrice.toLocaleString("ko-KR")}원</strong>
            </span>
          </div>
        </div>
      ) : null}

      <div className="detail-action-row">
        <button
          className={`button-secondary${!hasGroupedOptions && isBasicSoldOut ? " is-disabled" : ""}`}
          onClick={(event) => {
            if (!hasGroupedOptions && isBasicSoldOut) {
              event.preventDefault();
              return;
            }
            handleCartAction();
          }}
          type="button"
        >
          장바구니 담기
        </button>
        <button
          className={`button-primary${!hasGroupedOptions && isBasicSoldOut ? " is-disabled" : ""}`}
          onClick={(event) => {
            if (!hasGroupedOptions && isBasicSoldOut) {
              event.preventDefault();
              return;
            }
            handleCartAction("/cart");
          }}
          type="button"
        >
          바로 구매하기
        </button>
      </div>
      {purchaseMessage ? <div className="member-auth-alert is-muted">{purchaseMessage}</div> : null}
    </div>
  );
}
