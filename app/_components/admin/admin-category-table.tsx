"use client";

import { useMemo, useState } from "react";

import { deleteCategoryAction, saveCategoryAction, saveCategoryOrderAction } from "../../_actions/health-box-admin";
import type { HealthBoxCategory } from "../../_lib/health-box-api";
import { AdminConfirmSubmitButton } from "./admin-confirm-submit-button";
import { AdminSubmitButton } from "./admin-submit-button";
import { AdminBadge } from "./admin-ui";

type CategoryDraft = HealthBoxCategory & {
  localKey: string;
};

function toDraft(category: HealthBoxCategory, index: number): CategoryDraft {
  return {
    ...category,
    localKey: String(category.id || category.slug || category.name || index),
    sortOrder: category.sortOrder ?? index * 10,
    status: category.status || "ACTIVE",
  };
}

function reorderRows(rows: CategoryDraft[], fromKey: string, toKey: string) {
  const fromIndex = rows.findIndex((row) => row.localKey === fromKey);
  const toIndex = rows.findIndex((row) => row.localKey === toKey);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return rows;
  }

  const next = [...rows];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  return next.map((row, index) => ({
    ...row,
    sortOrder: index * 10,
  }));
}

export function AdminCategoryTable({ categories }: { categories: HealthBoxCategory[] }) {
  const initialRows = useMemo(
    () =>
      [...categories]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((category, index) => toDraft(category, index)),
    [categories],
  );
  const [rows, setRows] = useState(initialRows);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  function patchRow(localKey: string, patch: Partial<CategoryDraft>) {
    setRows((current) => current.map((row) => (row.localKey === localKey ? { ...row, ...patch } : row)));
  }

  if (!rows.length) {
    return <p className="admin-empty-copy">등록된 카테고리가 없습니다.</p>;
  }

  return (
    <div className="admin-category-table-wrap">
      <form action={saveCategoryOrderAction} className="admin-category-order-form">
        <input name="redirectTo" type="hidden" value="/admin/categories" />
        <input name="categoryOrder" type="hidden" value={JSON.stringify(rows)} />
        <div className="admin-category-table-toolbar">
          <span>왼쪽 핸들을 잡고 끌어서 순서를 바꿀 수 있습니다.</span>
          <AdminSubmitButton className="admin-button secondary small" pendingLabel="저장중...">
            순서 저장
          </AdminSubmitButton>
        </div>
      </form>

      <div className="admin-category-table" role="table">
        <div className="admin-category-table-head" role="row">
          <span>순서</span>
          <span>카테고리명</span>
          <span>상태</span>
          <span>주소/코드</span>
          <span>저장</span>
          <span>삭제</span>
        </div>

        {rows.map((item, index) => {
          const deleteFormId = `admin-category-delete-${item.localKey}`;

          return (
            <div
              className={`admin-category-table-row${draggingKey === item.localKey ? " is-dragging" : ""}`}
              draggable
              key={item.localKey}
              onDragEnd={() => setDraggingKey(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggingKey(item.localKey)}
              onDrop={(event) => {
                event.preventDefault();
                if (draggingKey) {
                  setRows((current) => reorderRows(current, draggingKey, item.localKey));
                }
                setDraggingKey(null);
              }}
              role="row"
            >
              <form action={saveCategoryAction} className="admin-category-table-form">
                <input name="redirectTo" type="hidden" value="/admin/categories" />
                <input name="id" type="hidden" value={String(item.id || "")} />
                <input name="slug" type="hidden" value={item.slug || ""} />
                <input name="categoryCode" type="hidden" value={item.categoryCode || ""} />

                <div className="admin-category-drag-cell">
                  <button aria-label={`${item.name || "카테고리"} 순서 이동`} className="admin-drag-handle" type="button">
                    <span />
                  </button>
                  <input
                    className="admin-input admin-category-order-input"
                    min="0"
                    name="sortOrder"
                    onChange={(event) => patchRow(item.localKey, { sortOrder: Number(event.target.value) || 0 })}
                    type="number"
                    value={item.sortOrder ?? index * 10}
                  />
                </div>

                <input
                  className="admin-input"
                  name="name"
                  onChange={(event) => patchRow(item.localKey, { name: event.target.value })}
                  placeholder="카테고리명"
                  type="text"
                  value={item.name || ""}
                />

                <div className="admin-category-status-cell">
                  <select
                    className="admin-select"
                    name="status"
                    onChange={(event) => patchRow(item.localKey, { status: event.target.value })}
                    value={item.status || "ACTIVE"}
                  >
                    <option value="ACTIVE">사용</option>
                    <option value="INACTIVE">중지</option>
                  </select>
                  <AdminBadge tone={item.status === "INACTIVE" ? "gold" : "green"}>
                    {item.status === "INACTIVE" ? "중지" : "사용중"}
                  </AdminBadge>
                </div>

                <details className="admin-category-table-details">
                  <summary>설정</summary>
                  <div className="admin-category-details-grid">
                    <label>
                      <span>주소</span>
                      <input
                        className="admin-input"
                        onChange={(event) => patchRow(item.localKey, { slug: event.target.value })}
                        placeholder="영문 주소값"
                        value={item.slug || ""}
                      />
                    </label>
                    <label>
                      <span>관리 코드</span>
                      <input
                        className="admin-input"
                        onChange={(event) => patchRow(item.localKey, { categoryCode: event.target.value })}
                        placeholder="관리 코드"
                        value={item.categoryCode || ""}
                      />
                    </label>
                  </div>
                </details>

                <div className="admin-category-action-cell">
                  <AdminSubmitButton className="admin-button secondary small" pendingLabel="저장중...">
                    저장
                  </AdminSubmitButton>
                </div>
              </form>

              <form action={deleteCategoryAction} id={deleteFormId}>
                <input name="redirectTo" type="hidden" value="/admin/categories" />
                <input name="id" type="hidden" value={String(item.id || "")} />
              </form>
              <AdminConfirmSubmitButton
                className="admin-button danger small admin-category-delete-button"
                confirmMessage={`"${item.name || "카테고리"}" 카테고리를 삭제할까요? 상품에 연결된 경우 먼저 상품 카테고리를 변경해주세요.`}
                confirmTitle="카테고리 삭제"
                form={deleteFormId}
                pendingLabel="삭제중..."
                tone="danger"
              >
                삭제
              </AdminConfirmSubmitButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
