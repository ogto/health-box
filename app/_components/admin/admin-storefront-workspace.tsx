"use client";

import { useId, useState, type ReactNode } from "react";

type StorefrontWorkspaceTab = "settings" | "preview";

export function AdminStorefrontWorkspace({
  preview,
  publicStoreUrl,
  readOnly = false,
  settings,
}: {
  preview: ReactNode;
  publicStoreUrl: string;
  readOnly?: boolean;
  settings: ReactNode;
}) {
  const tabId = useId();
  const [activeTab, setActiveTab] = useState<StorefrontWorkspaceTab>(readOnly ? "preview" : "settings");
  const settingsTabId = `${tabId}-settings-tab`;
  const settingsPanelId = `${tabId}-settings-panel`;
  const previewTabId = `${tabId}-preview-tab`;
  const previewPanelId = `${tabId}-preview-panel`;

  return (
    <div className="admin-storefront-workspace">
      <div aria-label="홈페이지관리 화면 전환" className="admin-storefront-workspace-tabs" role="tablist">
        {!readOnly ? (
          <button
            aria-controls={settingsPanelId}
            aria-selected={activeTab === "settings"}
            className={activeTab === "settings" ? "is-active" : undefined}
            id={settingsTabId}
            onClick={() => setActiveTab("settings")}
            role="tab"
            type="button"
          >
            <span>설정 편집</span>
            <small>문구·배송·판매자·메뉴·이미지 설정</small>
          </button>
        ) : null}
        <button
          aria-controls={previewPanelId}
          aria-selected={activeTab === "preview"}
          className={activeTab === "preview" ? "is-active" : undefined}
          id={previewTabId}
          onClick={() => setActiveTab("preview")}
          role="tab"
          type="button"
        >
          <span>화면 미리보기</span>
          <small>저장된 설정 기준 공개몰 화면 확인</small>
        </button>
      </div>

      {!readOnly ? (
        <section
          aria-labelledby={settingsTabId}
          className="admin-storefront-workspace-panel"
          hidden={activeTab !== "settings"}
          id={settingsPanelId}
          role="tabpanel"
        >
          {settings}
        </section>
      ) : null}

      <section
        aria-labelledby={previewTabId}
        className="admin-storefront-workspace-panel is-preview"
        hidden={activeTab !== "preview"}
        id={previewPanelId}
        role="tabpanel"
      >
        <div className="admin-storefront-preview-toolbar">
          <div>
            <strong>저장된 공개몰 화면</strong>
            <p>미리보기는 관리자 영역 전체 폭으로 표시됩니다. 변경사항을 저장한 뒤 새로고침하면 최신 내용이 반영됩니다.</p>
          </div>
          <a className="admin-button secondary" href={publicStoreUrl} rel="noreferrer" target="_blank">
            공개몰 새 창 열기
          </a>
        </div>
        <div className="admin-storefront-preview-stage">{preview}</div>
      </section>
    </div>
  );
}
