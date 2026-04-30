"use client";

import { useEffect, useId, useMemo, useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";

import {
  deleteDeliveryPolicyTemplateAction,
  deleteSalesPolicyTemplateAction,
  fetchDeliveryPolicyTemplateAction,
  fetchSalesPolicyTemplateAction,
  saveDeliveryPolicyTemplateAction,
  saveSalesPolicyTemplateAction,
} from "../../_actions/health-box-admin";

type PolicyTemplateType = "delivery" | "sales";

export type AdminPolicyTemplate = {
  content: string;
  id: string;
  policyId?: number | null;
  sortOrder?: number | null;
  status?: string;
  title: string;
  type: PolicyTemplateType;
};

export function AdminPolicyTemplatePicker({
  defaultValue = "",
  initialTemplates,
  label,
  name,
  placeholder,
  type,
}: {
  defaultValue?: string;
  initialTemplates?: AdminPolicyTemplate[];
  label: string;
  name: string;
  placeholder?: string;
  type: PolicyTemplateType;
}) {
  const templatesFromProps = initialTemplates?.filter((template) => template.type === type) || [];
  const [templates, setTemplates] = useState(() => templatesFromProps);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [value, setValue] = useState(defaultValue);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  function handleTemplateChange(nextTemplateId: string) {
    setSelectedTemplateId(nextTemplateId);
    if (!nextTemplateId) {
      setValue("");
      return;
    }

    const nextTemplate = templates.find((template) => template.id === nextTemplateId);
    if (nextTemplate) {
      setValue(nextTemplate.content);
    }
  }

  function handleTemplatesChange(nextTemplates: AdminPolicyTemplate[], nextSelectedTemplateId: string) {
    setTemplates(nextTemplates);
    setSelectedTemplateId(nextSelectedTemplateId);

    const nextTemplate = nextTemplates.find((template) => template.id === nextSelectedTemplateId);
    if (nextTemplate) {
      setValue(nextTemplate.content);
    }
  }

  return (
    <div className="admin-policy-template">
      <div className="admin-policy-template-toolbar">
        <label className="admin-field admin-policy-template-select">
          <span>{label}</span>
          <select
            className="admin-select"
            onChange={(event) => handleTemplateChange(event.target.value)}
            value={selectedTemplateId}
          >
            <option value="">직접 입력</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-policy-template-actions">
          <button className="admin-button secondary" onClick={() => setIsManagerOpen(true)} type="button">
            템플릿 관리
          </button>
        </div>
      </div>

      <label className="admin-field">
        <span>{label} 문구</span>
        <textarea
          className="admin-textarea admin-policy-template-textarea"
          name={name}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </label>

      {isManagerOpen ? (
        <PolicyTemplateManagerDialog
          currentText={value}
          onClose={() => setIsManagerOpen(false)}
          onTemplatesChange={handleTemplatesChange}
          selectedTemplateId={selectedTemplateId}
          templates={templates}
          type={type}
        />
      ) : null}
    </div>
  );
}

function normalizeSavedPolicy(
  savedPolicy: {
    content?: string;
    id?: number;
    sortOrder?: number;
    status?: string;
    title?: string;
  },
  fallback: AdminPolicyTemplate,
): AdminPolicyTemplate {
  const policyId = typeof savedPolicy.id === "number" ? savedPolicy.id : fallback.policyId;

  return {
    content: savedPolicy.content || fallback.content,
    id: policyId ? `${fallback.type}-${policyId}` : fallback.id,
    policyId,
    sortOrder: typeof savedPolicy.sortOrder === "number" ? savedPolicy.sortOrder : fallback.sortOrder,
    status: savedPolicy.status || fallback.status || "ACTIVE",
    title: savedPolicy.title || fallback.title,
    type: fallback.type,
  };
}

function PolicyTemplateManagerDialog({
  currentText,
  onClose,
  onTemplatesChange,
  selectedTemplateId,
  templates,
  type,
}: {
  currentText: string;
  onClose: () => void;
  onTemplatesChange: (templates: AdminPolicyTemplate[], selectedTemplateId: string) => void;
  selectedTemplateId: string;
  templates: AdminPolicyTemplate[];
  type: PolicyTemplateType;
}) {
  const titleId = useId();
  const policyLabel = type === "sales" ? "판매정책" : "배송정책";
  const [draftTemplates, setDraftTemplates] = useState(templates);
  const [activeTemplateId, setActiveTemplateId] = useState(
    selectedTemplateId || templates[0]?.id || `draft-${type}-${Date.now()}`,
  );
  const [message, setMessage] = useState("");
  const [templateToDelete, setTemplateToDelete] = useState<AdminPolicyTemplate | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTemplate = useMemo(
    () => draftTemplates.find((template) => template.id === activeTemplateId) || null,
    [activeTemplateId, draftTemplates],
  );
  const [title, setTitle] = useState(activeTemplate?.title || "");
  const [content, setContent] = useState(activeTemplate?.content || currentText);
  const canUseRemoteApi = true;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onClose]);

  useEffect(() => {
    setTitle(activeTemplate?.title || "");
    setContent(activeTemplate?.content || "");
    setMessage("");
  }, [activeTemplate]);

  function createTemplate() {
    const nextTemplate: AdminPolicyTemplate = {
      id: `draft-${type}-${Date.now()}`,
      policyId: null,
      sortOrder: draftTemplates.length,
      status: "ACTIVE",
      type,
      title: "새 템플릿",
      content: currentText,
    };

    setDraftTemplates((currentTemplates) => [...currentTemplates, nextTemplate]);
    setActiveTemplateId(nextTemplate.id);
  }

  function selectTemplate(template: AdminPolicyTemplate) {
    setActiveTemplateId(template.id);

    if (!canUseRemoteApi || !template.policyId) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const policy =
            type === "sales"
              ? await fetchSalesPolicyTemplateAction(template.policyId || 0)
              : await fetchDeliveryPolicyTemplateAction(template.policyId || 0);
          const detailedTemplate = normalizeSavedPolicy(policy, template);
          setDraftTemplates((currentTemplates) =>
            currentTemplates.map((currentTemplate) =>
              currentTemplate.id === template.id ? detailedTemplate : currentTemplate,
            ),
          );
          setActiveTemplateId(detailedTemplate.id);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "템플릿 상세 조회 중 오류가 발생했습니다.");
        }
      })();
    });
  }

  function updateActiveTemplateDraft(nextDraft: Partial<Pick<AdminPolicyTemplate, "content" | "title">>) {
    setDraftTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.id === activeTemplateId
          ? {
              ...template,
              ...nextDraft,
            }
          : template,
      ),
    );
  }

  function closeWithTemplate(nextTemplates: AdminPolicyTemplate[], nextSelectedTemplateId: string) {
    onTemplatesChange(nextTemplates, nextSelectedTemplateId);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent || !activeTemplate) {
      return;
    }

    const nextTemplate: AdminPolicyTemplate = {
      ...activeTemplate,
      title: trimmedTitle,
      content: trimmedContent,
    };

    if (!canUseRemoteApi) {
      const nextTemplates = draftTemplates.map((template) =>
        template.id === activeTemplateId ? nextTemplate : template,
      );
      closeWithTemplate(nextTemplates, activeTemplateId);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const payload = {
            content: nextTemplate.content,
            id: nextTemplate.policyId,
            sortOrder: nextTemplate.sortOrder,
            status: nextTemplate.status,
            title: nextTemplate.title,
          };
          const savedPolicy =
            type === "sales"
              ? await saveSalesPolicyTemplateAction(payload)
              : await saveDeliveryPolicyTemplateAction(payload);
          const savedTemplate = normalizeSavedPolicy(savedPolicy, nextTemplate);
          const nextTemplates = draftTemplates.some((template) => template.id === activeTemplateId)
            ? draftTemplates.map((template) => (template.id === activeTemplateId ? savedTemplate : template))
            : [...draftTemplates, savedTemplate];
          closeWithTemplate(nextTemplates, savedTemplate.id);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "템플릿 저장 중 오류가 발생했습니다.");
        }
      })();
    });
  }

  function handleDelete() {
    const targetTemplate = templateToDelete;

    if (!targetTemplate) {
      return;
    }

    if (!canUseRemoteApi || !targetTemplate.policyId) {
      const nextTemplates = draftTemplates.filter((template) => template.id !== targetTemplate.id);
      const nextSelectedTemplateId = nextTemplates[0]?.id || "";
      setDraftTemplates(nextTemplates);
      setActiveTemplateId(nextSelectedTemplateId);
      setTemplateToDelete(null);
      onTemplatesChange(nextTemplates, nextSelectedTemplateId);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          if (type === "sales") {
            await deleteSalesPolicyTemplateAction(targetTemplate.policyId || 0);
          } else {
            await deleteDeliveryPolicyTemplateAction(targetTemplate.policyId || 0);
          }
          const nextTemplates = draftTemplates.filter((template) => template.id !== targetTemplate.id);
          const nextSelectedTemplateId = nextTemplates[0]?.id || "";
          setDraftTemplates(nextTemplates);
          setActiveTemplateId(nextSelectedTemplateId);
          setTemplateToDelete(null);
          onTemplatesChange(nextTemplates, nextSelectedTemplateId);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "템플릿 삭제 중 오류가 발생했습니다.");
        }
      })();
    });
  }

  return createPortal(
    <div className="admin-info-dialog-layer" role="presentation">
      <button
        aria-label={`${policyLabel} 템플릿 관리 닫기`}
        className="admin-info-dialog-backdrop"
        disabled={isPending}
        onClick={onClose}
        type="button"
      />
      <form
        aria-labelledby={titleId}
        aria-modal="true"
        className="admin-info-dialog admin-policy-template-dialog"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <div className="admin-info-dialog-head">
          <div className="admin-info-dialog-copy">
            <strong id={titleId}>{policyLabel} 템플릿 관리</strong>
          </div>

          <button
            aria-label={`${policyLabel} 템플릿 관리 닫기`}
            className="admin-info-dialog-close"
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            <svg fill="none" viewBox="0 0 24 24">
              <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
            </svg>
          </button>
        </div>

        <div className="admin-info-dialog-body admin-policy-template-manager">
          <div className="admin-policy-template-list" role="listbox" aria-label={`${policyLabel} 템플릿 목록`}>
            {draftTemplates.map((template) => (
              <button
                aria-selected={template.id === activeTemplateId}
                className={`admin-policy-template-list-item${template.id === activeTemplateId ? " is-active" : ""}`}
                disabled={isPending}
                key={template.id}
                onClick={() => selectTemplate(template)}
                role="option"
                type="button"
              >
                {template.title}
              </button>
            ))}
          </div>

          <div className="admin-policy-template-editor">
            <label className="admin-field">
              <span>템플릿 이름</span>
              <input
                className="admin-input"
                disabled={isPending}
                onChange={(event) => {
                  setTitle(event.target.value);
                  updateActiveTemplateDraft({ title: event.target.value });
                }}
                placeholder="예: 회원 전용 기본 판매정책"
                type="text"
                value={title}
              />
            </label>

            <label className="admin-field">
              <span>템플릿 내용</span>
              <textarea
                className="admin-textarea admin-policy-template-modal-textarea"
                disabled={isPending}
                onChange={(event) => {
                  setContent(event.target.value);
                  updateActiveTemplateDraft({ content: event.target.value });
                }}
                placeholder="상품 상세에 노출할 정책 문구를 입력하세요."
                value={content}
              />
            </label>

            {message ? <div className="admin-feedback is-error">{message}</div> : null}
          </div>
        </div>

        <div className="admin-policy-template-dialog-actions">
          <div className="admin-policy-template-dialog-left-actions">
            <button className="admin-button secondary" disabled={isPending} onClick={createTemplate} type="button">
              새 템플릿
            </button>
            <button
              className="admin-button danger"
              disabled={isPending || !activeTemplate}
              onClick={() => setTemplateToDelete(activeTemplate)}
              type="button"
            >
              삭제
            </button>
          </div>
          <div className="admin-policy-template-dialog-save-actions">
            <button className="admin-button secondary" disabled={isPending} onClick={onClose} type="button">
              취소
            </button>
            <button className="admin-button" disabled={isPending || !title.trim() || !content.trim()} type="submit">
              {isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {templateToDelete ? (
          <div className="admin-policy-delete-confirm" role="presentation">
            <button
              aria-label="삭제 확인 닫기"
              className="admin-policy-delete-confirm-backdrop"
              disabled={isPending}
              onClick={() => setTemplateToDelete(null)}
              type="button"
            />
            <div aria-modal="true" className="admin-policy-delete-confirm-dialog" role="alertdialog">
              <div className="admin-confirm-icon" aria-hidden="true">
                !
              </div>
              <div className="admin-confirm-copy">
                <h2>템플릿 삭제</h2>
                <p>{`"${templateToDelete.title}" 템플릿을 삭제할까요?`}</p>
              </div>
              <div className="admin-confirm-actions">
                <button
                  className="admin-button secondary"
                  disabled={isPending}
                  onClick={() => setTemplateToDelete(null)}
                  type="button"
                >
                  취소
                </button>
                <button className="admin-button danger" disabled={isPending} onClick={handleDelete} type="button">
                  {isPending ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>,
    document.body,
  );
}
