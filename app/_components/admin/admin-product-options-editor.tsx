"use client";

import { useMemo, useState } from "react";

import type { HealthBoxProductOptionGroup, HealthBoxProductSku } from "../../_lib/health-box-api";

type OptionValueDraft = {
  additionalPrice?: number;
  safetyStock?: number;
  soldOutYn?: string;
  sortOrder: number;
  status: string;
  stockQuantity?: number;
  valueCode: string;
  valueName: string;
};

type OptionGroupDraft = {
  groupName: string;
  requiredYn: string;
  sortOrder: number;
  values: OptionValueDraft[];
};

type SkuDraft = {
  consumerPrice: number;
  memberPrice: number;
  optionValueCodes: string[];
  safetyStock: number;
  settlementBasePrice: number;
  skuCode?: string;
  skuName: string;
  soldOutYn: string;
  status: string;
  stockQuantity: number;
  supplyPrice: number;
};

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function defaultCode(value: string, index: number) {
  return normalizeCode(value) || `OPT${index + 1}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createEmptyGroup(): OptionGroupDraft {
  return {
    groupName: "",
    requiredYn: "Y",
    sortOrder: 1,
    values: [
      {
        additionalPrice: 0,
        safetyStock: 0,
        soldOutYn: "N",
        sortOrder: 1,
        status: "ACTIVE",
        stockQuantity: 0,
        valueCode: "",
        valueName: "",
      },
    ],
  };
}

function toGroupDraft(group: HealthBoxProductOptionGroup, index: number): OptionGroupDraft {
  return {
    groupName: group.groupName || "",
    requiredYn: group.requiredYn || "Y",
    sortOrder: group.sortOrder ?? index + 1,
    values: (group.values || []).map((value, valueIndex) => ({
      sortOrder: value.sortOrder ?? valueIndex + 1,
      status: value.status || "ACTIVE",
      valueCode: value.valueCode || defaultCode(value.valueName || "", valueIndex),
      valueName: value.valueName || "",
    })),
  };
}

function toSkuDraft(sku: HealthBoxProductSku, fallbackName: string, baseMemberPrice: number): SkuDraft {
  const optionAdditionalPrice =
    sku.optionValueCodes?.length && numberOrZero(sku.memberPrice) > baseMemberPrice
      ? numberOrZero(sku.memberPrice) - baseMemberPrice
      : 0;
  const displayName = (sku.skuName || fallbackName).replace(new RegExp(`^${escapeRegExp(fallbackName)}\\s*/\\s*`), "");

  return {
    consumerPrice: numberOrZero(sku.consumerPrice),
    memberPrice: optionAdditionalPrice,
    optionValueCodes: sku.optionValueCodes || [],
    safetyStock: numberOrZero(sku.safetyStock),
    settlementBasePrice: numberOrZero(sku.settlementBasePrice),
    skuCode: sku.skuCode,
    skuName: displayName || fallbackName,
    soldOutYn: sku.soldOutYn || "N",
    status: sku.status || "ACTIVE",
    stockQuantity: numberOrZero(sku.stockQuantity),
    supplyPrice: numberOrZero(sku.supplyPrice),
  };
}

export function AdminProductOptionsEditor({
  defaultConsumerPrice = 0,
  defaultMemberPrice = 0,
  defaultOptionGroups = [],
  defaultOptionUseYn = "N",
  defaultSafetyStock = 0,
  defaultSettlementBasePrice = 0,
  defaultSkus = [],
  defaultStockQuantity = 0,
  defaultSupplyPrice = 0,
  productName = "상품",
}: {
  defaultConsumerPrice?: number | null;
  defaultMemberPrice?: number | null;
  defaultOptionGroups?: HealthBoxProductOptionGroup[];
  defaultOptionUseYn?: string | null;
  defaultSafetyStock?: number | null;
  defaultSettlementBasePrice?: number | null;
  defaultSkus?: HealthBoxProductSku[];
  defaultStockQuantity?: number | null;
  defaultSupplyPrice?: number | null;
  productName?: string;
}) {
  const [optionUseYn, setOptionUseYn] = useState(defaultOptionUseYn === "Y" ? "Y" : "N");
  const [groups, setGroups] = useState<OptionGroupDraft[]>(
    defaultOptionGroups.length ? defaultOptionGroups.map(toGroupDraft) : [],
  );
  const [draftGroup, setDraftGroup] = useState<OptionGroupDraft>(() => createEmptyGroup());
  const [deleteGroupOrder, setDeleteGroupOrder] = useState<number | null>(null);
  const [deleteSkuIndex, setDeleteSkuIndex] = useState<number | null>(null);
  const [skus, setSkus] = useState<SkuDraft[]>(
    defaultSkus.length
      ? defaultSkus.map((sku) => toSkuDraft(sku, productName, defaultMemberPrice || 0))
      : [
          {
            consumerPrice: defaultConsumerPrice || 0,
            memberPrice: 0,
            optionValueCodes: [],
            safetyStock: defaultSafetyStock || 0,
            settlementBasePrice: defaultSettlementBasePrice || 0,
            skuName: productName,
            soldOutYn: "N",
            status: "ACTIVE",
            stockQuantity: defaultStockQuantity || 0,
            supplyPrice: defaultSupplyPrice || 0,
          },
        ],
  );
  const fallbackSku: SkuDraft = skus[0] || {
    consumerPrice: defaultConsumerPrice || 0,
    memberPrice: 0,
    optionValueCodes: [],
    safetyStock: defaultSafetyStock || 0,
    settlementBasePrice: defaultSettlementBasePrice || 0,
    skuName: productName,
    soldOutYn: "N",
    status: "ACTIVE",
    stockQuantity: defaultStockQuantity || 0,
    supplyPrice: defaultSupplyPrice || 0,
  };

  const cleanGroups = useMemo(
    () => {
      if (optionUseYn !== "Y") {
        return [];
      }

      const mappedGroups = groups
        .map((group, groupIndex) => ({
          groupName: group.groupName.trim(),
          requiredYn: group.requiredYn || "Y",
          sortOrder: group.sortOrder || groupIndex + 1,
          values: group.values
            .map((value, valueIndex) => ({
              sortOrder: value.sortOrder || valueIndex + 1,
              status: value.status || "ACTIVE",
              valueCode: defaultCode(value.valueCode || value.valueName, valueIndex),
              valueName: value.valueName.trim(),
            }))
            .filter((value) => value.valueName && value.valueCode),
        }))
        .filter((group) => group.groupName && group.values.length);

      if (mappedGroups.length) {
        return mappedGroups;
      }

      const fallbackValues = skus
        .filter((sku) => sku.optionValueCodes.length)
        .map((sku, skuIndex) => ({
          sortOrder: skuIndex + 1,
          status: "ACTIVE",
          valueCode: sku.optionValueCodes[0] || defaultCode(sku.skuName, skuIndex),
          valueName: sku.skuName.trim() || `옵션 ${skuIndex + 1}`,
        }));

      return fallbackValues.length
        ? [
            {
              groupName: "옵션",
              requiredYn: "Y",
              sortOrder: 1,
              values: fallbackValues,
            },
          ]
        : [];
    },
    [groups, optionUseYn, skus],
  );

  const cleanSkus = useMemo(
    () =>
      (optionUseYn === "Y" ? skus : [fallbackSku])
        .map((sku) => ({
          consumerPrice: sku.consumerPrice || 0,
          memberPrice: sku.memberPrice || 0,
          optionValueCodes: optionUseYn === "Y" ? sku.optionValueCodes : [],
          safetyStock: sku.safetyStock || 0,
          settlementBasePrice: sku.settlementBasePrice || 0,
          skuCode: sku.skuCode,
          skuName: sku.skuName.trim() || productName,
          soldOutYn: sku.soldOutYn || "N",
          status: sku.status || "ACTIVE",
          stockQuantity: sku.stockQuantity || 0,
          supplyPrice: sku.supplyPrice || 0,
        }))
        .filter((sku) => (optionUseYn === "Y" ? sku.optionValueCodes.length : true)),
    [fallbackSku, optionUseYn, productName, skus],
  );
  const validOptionCodeSet = useMemo(
    () => new Set(cleanGroups.flatMap((group) => group.values.map((value) => value.valueCode))),
    [cleanGroups],
  );

  function updateSku(index: number, patch: Partial<SkuDraft>) {
    setSkus((current) => current.map((sku, skuIndex) => (skuIndex === index ? { ...sku, ...patch } : sku)));
  }

  function updateDraftGroup(patch: Partial<OptionGroupDraft>) {
    setDraftGroup((current) => ({ ...current, ...patch }));
  }

  function updateDraftValue(valueIndex: number, patch: Partial<OptionValueDraft>) {
    setDraftGroup((current) => ({
      ...current,
      values: current.values.map((value, currentValueIndex) =>
        currentValueIndex === valueIndex ? { ...value, ...patch } : value,
      ),
    }));
  }

  function addDraftValue() {
    setDraftGroup((current) => ({
      ...current,
      values: [
        ...current.values,
        {
          additionalPrice: 0,
          safetyStock: 0,
          soldOutYn: "N",
          sortOrder: current.values.length + 1,
          status: "ACTIVE",
          stockQuantity: 0,
          valueCode: "",
          valueName: "",
        },
      ],
    }));
  }

  function removeDraftValue(valueIndex: number) {
    setDraftGroup((current) => ({
      ...current,
      values:
        current.values.length > 1
          ? current.values.filter((_, currentValueIndex) => currentValueIndex !== valueIndex)
          : createEmptyGroup().values,
    }));
  }

  function saveDraftGroup() {
    const groupName = draftGroup.groupName.trim();
    const codeSeed = Date.now().toString(36).toUpperCase();
    const values = draftGroup.values
      .map((value, valueIndex) => ({
        additionalPrice: value.additionalPrice || 0,
        safetyStock: value.safetyStock || 0,
        soldOutYn: value.soldOutYn || "N",
        sortOrder: valueIndex + 1,
        status: value.status || "ACTIVE",
        valueCode: `OPT-${codeSeed}-${valueIndex + 1}`,
        stockQuantity: value.stockQuantity || 0,
        valueName: value.valueName.trim(),
      }))
      .filter((value) => value.valueName);

    if (!groupName || !values.length) {
      return;
    }

    setGroups((current) => [
      ...current,
      {
        groupName,
        requiredYn: draftGroup.requiredYn || "Y",
        sortOrder: current.length + 1,
        values,
      },
    ]);
    setSkus((current) => [
      ...current.filter((sku) => sku.optionValueCodes.length > 0),
      ...values.map((value) => ({
        consumerPrice: defaultConsumerPrice || 0,
        memberPrice: value.additionalPrice || 0,
        optionValueCodes: [value.valueCode],
        safetyStock: value.safetyStock || 0,
        settlementBasePrice: defaultSettlementBasePrice || 0,
        skuName: value.valueName,
        soldOutYn: value.soldOutYn || "N",
        status: "ACTIVE",
        stockQuantity: value.stockQuantity || 0,
        supplyPrice: defaultSupplyPrice || 0,
      })),
    ]);
    setDraftGroup(createEmptyGroup());
  }

  function deleteSku(index: number) {
    const targetCodes = skus[index]?.optionValueCodes || [];
    const nextSkus = skus.filter((_, skuIndex) => skuIndex !== index);
    setSkus(nextSkus.length ? nextSkus : [{ ...fallbackSku, optionValueCodes: [], skuName: productName }]);
    setGroups((current) => {
      const targetCodeSet = new Set(targetCodes);
      return current
        .map((group) => ({
          ...group,
          values: group.values.filter((value) => !targetCodeSet.has(defaultCode(value.valueCode || value.valueName, value.sortOrder - 1))),
        }))
        .filter((group) => group.values.length)
        .map((group, groupIndex) => ({ ...group, sortOrder: groupIndex + 1 }));
    });
    if (!nextSkus.some((sku) => sku.optionValueCodes.length)) {
      setOptionUseYn("N");
    }
    setDeleteSkuIndex(null);
  }

  function deleteGroup(sortOrder: number) {
    const targetGroup = cleanGroups.find((group) => group.sortOrder === sortOrder);
    const targetCodeSet = new Set(targetGroup?.values.map((value) => value.valueCode) || []);
    const nextSkus = skus.filter((sku) => !sku.optionValueCodes.some((code) => targetCodeSet.has(code)));

    setGroups((current) =>
      current
        .filter((group) => (group.sortOrder || 0) !== sortOrder)
        .map((group, groupIndex) => ({ ...group, sortOrder: groupIndex + 1 })),
    );
    setSkus(nextSkus.length ? nextSkus : [{ ...fallbackSku, optionValueCodes: [], skuName: productName }]);
    if (!nextSkus.some((sku) => sku.optionValueCodes.length)) {
      setOptionUseYn("N");
    }
    setDeleteGroupOrder(null);
  }

  const optionSkuRows = skus
    .map((sku, index) => ({ index, sku }))
    .filter(({ sku }) => sku.optionValueCodes.length > 0);
  const validOptionSkuRows = optionSkuRows.filter(({ sku }) =>
    validOptionCodeSet.size ? sku.optionValueCodes.every((code) => validOptionCodeSet.has(code)) : true,
  );
  const visibleOptionSkuRows = validOptionSkuRows.length ? validOptionSkuRows : optionSkuRows;
  const groupedOptionSkuRows = cleanGroups
    .map((group) => {
      const valueCodes = new Set(group.values.map((value) => value.valueCode));
      return {
        group,
        rows: visibleOptionSkuRows.filter(({ sku }) => sku.optionValueCodes.some((code) => valueCodes.has(code))),
      };
    })
    .filter((group) => group.rows.length);
  const groupedRowIndexes = new Set(groupedOptionSkuRows.flatMap((group) => group.rows.map((row) => row.index)));
  const ungroupedOptionSkuRows = visibleOptionSkuRows.filter((row) => !groupedRowIndexes.has(row.index));

  return (
    <div className="admin-product-options-editor">
      <input name="optionUseYn" type="hidden" value={optionUseYn} />
      <input name="optionGroups" type="hidden" value={JSON.stringify(cleanGroups)} />
      <input name="skus" type="hidden" value={JSON.stringify(cleanSkus)} />

      <div className="admin-option-mode">
        <button
          className={optionUseYn === "N" ? "is-active" : ""}
          onClick={() => {
            setOptionUseYn("N");
            setSkus((current) => [{ ...(current[0] || fallbackSku), optionValueCodes: [], skuName: productName }]);
          }}
          type="button"
        >
          옵션 없음
        </button>
        <button
          className={optionUseYn === "Y" ? "is-active" : ""}
          onClick={() => setOptionUseYn("Y")}
          type="button"
        >
          옵션 사용
        </button>
      </div>

      {optionUseYn === "N" ? (
        <div className="admin-basic-stock-card">
          <strong>기본 상품 재고</strong>
          <label className="admin-field">
            <span>재고</span>
            <input
              className="admin-input"
              min="0"
              onChange={(event) => updateSku(0, { stockQuantity: Number(event.target.value) || 0 })}
              placeholder="판매 가능한 수량"
              type="number"
              value={fallbackSku.stockQuantity}
            />
          </label>
          <label className="admin-field">
            <span>안전재고</span>
            <input
              className="admin-input"
              min="0"
              onChange={(event) => updateSku(0, { safetyStock: Number(event.target.value) || 0 })}
              placeholder="재고 알림 기준"
              type="number"
              value={fallbackSku.safetyStock}
            />
          </label>
          <label className="admin-field">
            <span>판매상태</span>
            <select
              className="admin-select"
              onChange={(event) => updateSku(0, { soldOutYn: event.target.value })}
              value={fallbackSku.soldOutYn}
            >
              <option value="N">판매</option>
              <option value="Y">품절</option>
            </select>
          </label>
        </div>
      ) : null}

      {optionUseYn === "Y" ? (
        <>
          <div className="admin-option-groups">
            <div className="admin-option-create-card">
              <div className="admin-option-create-title">
                <strong>옵션 입력</strong>
                <span>고객이 선택할 옵션과 옵션별 추가금액, 재고를 입력하세요.</span>
              </div>
              <div className="admin-option-group-topline">
                <label className="admin-field">
                  <span>옵션 종류</span>
                  <input
                    className="admin-input admin-option-group-name-input"
                    onChange={(event) => updateDraftGroup({ groupName: event.target.value })}
                    placeholder="예: 맛, 용량, 색상"
                    type="text"
                    value={draftGroup.groupName}
                  />
                </label>
                <label className="admin-field">
                  <span>선택 여부</span>
                  <select
                    className="admin-select admin-option-required-select"
                    onChange={(event) => updateDraftGroup({ requiredYn: event.target.value })}
                    value={draftGroup.requiredYn || "Y"}
                  >
                    <option value="Y">필수</option>
                    <option value="N">선택</option>
                  </select>
                </label>
              </div>

              <div className="admin-option-values">
                <div className="admin-option-value-head">
                  <span>옵션명</span>
                  <span>추가금액</span>
                  <span>재고</span>
                  <span>안전재고</span>
                  <span>상태</span>
                  <span>삭제</span>
                </div>
                {draftGroup.values.map((value, valueIndex) => (
                  <div className="admin-option-value-row is-priced" key={`draft-value-${valueIndex}`}>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        updateDraftValue(valueIndex, {
                          valueCode: defaultCode(event.target.value, valueIndex),
                          valueName: event.target.value,
                        })
                      }
                      placeholder="옵션 예: 딸기맛, 500ml, XL"
                      type="text"
                      value={value.valueName}
                    />
                    <input
                      className="admin-input"
                      min="0"
                      onChange={(event) => updateDraftValue(valueIndex, { additionalPrice: Number(event.target.value) || 0 })}
                      placeholder="추가금액"
                      type="number"
                      value={value.additionalPrice || 0}
                    />
                    <input
                      className="admin-input"
                      min="0"
                      onChange={(event) => updateDraftValue(valueIndex, { stockQuantity: Number(event.target.value) || 0 })}
                      placeholder="재고"
                      type="number"
                      value={value.stockQuantity || 0}
                    />
                    <input
                      className="admin-input"
                      min="0"
                      onChange={(event) => updateDraftValue(valueIndex, { safetyStock: Number(event.target.value) || 0 })}
                      placeholder="안전재고"
                      type="number"
                      value={value.safetyStock || 0}
                    />
                    <select
                      className="admin-select"
                      onChange={(event) => updateDraftValue(valueIndex, { soldOutYn: event.target.value })}
                      value={value.soldOutYn || "N"}
                    >
                      <option value="N">판매</option>
                      <option value="Y">품절</option>
                    </select>
                    <button className="admin-icon-text-button" onClick={() => removeDraftValue(valueIndex)} type="button">
                      삭제
                    </button>
                  </div>
                ))}
                <button className="admin-add-line-button" onClick={addDraftValue} type="button">
                  + 옵션 추가
                </button>
              </div>
              <div className="admin-option-create-actions">
                <button className="admin-button" onClick={saveDraftGroup} type="button">
                  옵션 저장
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {optionUseYn === "Y" ? (
        <div className="admin-sku-table-wrap">
          <div className="admin-option-section-title">
            <strong>판매 조합 / 재고</strong>
          </div>
          {visibleOptionSkuRows.length ? (
            <>
              {groupedOptionSkuRows.map(({ group, rows }) => (
                <div className="admin-sku-group" key={`${group.groupName}-${group.sortOrder}`}>
                  <div className="admin-sku-group-title">
                    <div>
                      <strong>{group.groupName}</strong>
                      <span>{group.requiredYn === "N" ? "선택" : "필수"}</span>
                    </div>
                    <button
                      className="admin-option-delete-text-button"
                      onClick={() => setDeleteGroupOrder(group.sortOrder)}
                      type="button"
                    >
                      {group.groupName} 전체 삭제
                    </button>
                  </div>
                  <div className="admin-sku-table-head">
                    <span>{group.groupName} 옵션</span>
                    <span>추가금액</span>
                    <span>재고</span>
                    <span>안전재고</span>
                    <span>상태</span>
                    <span>삭제</span>
                  </div>
                  {rows.map(({ index, sku }) => (
                    <div className="admin-sku-row" key={`${sku.optionValueCodes.join("-") || "default"}-${index}`}>
                      <input
                        className="admin-input"
                        onChange={(event) => updateSku(index, { skuName: event.target.value })}
                        type="text"
                        value={sku.skuName}
                      />
                      <input
                        className="admin-input"
                        min="0"
                        onChange={(event) => updateSku(index, { memberPrice: Number(event.target.value) || 0 })}
                        placeholder="0"
                        type="number"
                        value={sku.memberPrice}
                      />
                      <input
                        className="admin-input"
                        min="0"
                        onChange={(event) => updateSku(index, { stockQuantity: Number(event.target.value) || 0 })}
                        type="number"
                        value={sku.stockQuantity}
                      />
                      <input
                        className="admin-input"
                        min="0"
                        onChange={(event) => updateSku(index, { safetyStock: Number(event.target.value) || 0 })}
                        type="number"
                        value={sku.safetyStock}
                      />
                      <select
                        className="admin-select"
                        onChange={(event) => updateSku(index, { soldOutYn: event.target.value })}
                        value={sku.soldOutYn}
                      >
                        <option value="N">판매</option>
                        <option value="Y">품절</option>
                      </select>
                      <button
                        aria-label={`${sku.skuName || "옵션 조합"} 삭제`}
                        className="admin-option-delete-text-button is-compact"
                        onClick={() => setDeleteSkuIndex(index)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              {ungroupedOptionSkuRows.length ? (
                <div className="admin-sku-group">
                  <div className="admin-sku-group-title">
                    <strong>기타 옵션</strong>
                  </div>
                  <div className="admin-sku-table-head">
                    <span>옵션명</span>
                    <span>추가금액</span>
                    <span>재고</span>
                    <span>안전재고</span>
                    <span>상태</span>
                    <span>삭제</span>
                  </div>
                  {ungroupedOptionSkuRows.map(({ index, sku }) => (
                    <div className="admin-sku-row" key={`${sku.optionValueCodes.join("-") || "default"}-${index}`}>
                      <input
                        className="admin-input"
                        onChange={(event) => updateSku(index, { skuName: event.target.value })}
                        type="text"
                        value={sku.skuName}
                      />
                      <input
                        className="admin-input"
                        min="0"
                        onChange={(event) => updateSku(index, { memberPrice: Number(event.target.value) || 0 })}
                        placeholder="0"
                        type="number"
                        value={sku.memberPrice}
                      />
                      <input
                        className="admin-input"
                        min="0"
                        onChange={(event) => updateSku(index, { stockQuantity: Number(event.target.value) || 0 })}
                        type="number"
                        value={sku.stockQuantity}
                      />
                      <input
                        className="admin-input"
                        min="0"
                        onChange={(event) => updateSku(index, { safetyStock: Number(event.target.value) || 0 })}
                        type="number"
                        value={sku.safetyStock}
                      />
                      <select
                        className="admin-select"
                        onChange={(event) => updateSku(index, { soldOutYn: event.target.value })}
                        value={sku.soldOutYn}
                      >
                        <option value="N">판매</option>
                        <option value="Y">품절</option>
                      </select>
                      <button
                        aria-label={`${sku.skuName || "옵션 조합"} 삭제`}
                        className="admin-option-delete-text-button is-compact"
                        onClick={() => setDeleteSkuIndex(index)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="admin-option-empty-row">
              옵션 종류와 옵션별 추가금액, 재고를 입력한 뒤 저장을 눌러주세요.
            </div>
          )}
        </div>
      ) : null}

      {deleteSkuIndex !== null ? (
        <div className="admin-confirm-backdrop" role="presentation">
          <div aria-modal="true" className="admin-confirm-dialog is-danger" role="dialog">
            <div className="admin-confirm-icon">!</div>
            <div className="admin-confirm-copy">
              <h2>옵션 조합 삭제</h2>
              <p>&quot;{skus[deleteSkuIndex]?.skuName || "옵션 조합"}&quot;을 삭제할까요?</p>
            </div>
            <div className="admin-confirm-actions">
              <button className="admin-button secondary" onClick={() => setDeleteSkuIndex(null)} type="button">
                취소
              </button>
              <button className="admin-button danger" onClick={() => deleteSku(deleteSkuIndex)} type="button">
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteGroupOrder !== null ? (
        <div className="admin-confirm-backdrop" role="presentation">
          <div aria-modal="true" className="admin-confirm-dialog is-danger" role="dialog">
            <div className="admin-confirm-icon">!</div>
            <div className="admin-confirm-copy">
              <h2>옵션 종류 삭제</h2>
              <p>
                &quot;{cleanGroups.find((group) => group.sortOrder === deleteGroupOrder)?.groupName || "옵션"}&quot; 옵션과
                하위 옵션을 모두 삭제할까요?
              </p>
            </div>
            <div className="admin-confirm-actions">
              <button className="admin-button secondary" onClick={() => setDeleteGroupOrder(null)} type="button">
                취소
              </button>
              <button className="admin-button danger" onClick={() => deleteGroup(deleteGroupOrder)} type="button">
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
