"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";

import {
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGE_FILE_SIZE_MB,
} from "@/lib/image-upload-limits";
import { dispatchAdminToast } from "./admin-toast";

type UploadedImage = {
  fileDownloadUri?: string;
};

function normalizeUploadedUrl(value: string) {
  const trimmed = value.trim();
  if (/^http:\/\/api\.everybuy\.co\.kr(?=\/|$)/i.test(trimmed)) {
    return trimmed.replace(/^http:/i, "https:");
  }

  return trimmed;
}

export function AdminStorefrontVisualUpload({
  assetLabel,
  defaultValue = "",
  fallbackAlt,
  fallbackImageUrl,
  fallbackStatusLabel,
  fieldName,
  recommendedSize,
}: {
  assetLabel: string;
  defaultValue?: string;
  fallbackAlt: string;
  fallbackImageUrl: string;
  fallbackStatusLabel: string;
  fieldName: "mainVisualUrl" | "middleBannerUrl";
  recommendedSize: string;
}) {
  const [imageUrl, setImageUrl] = useState(normalizeUploadedUrl(defaultValue));
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const previewUrl = localPreviewUrl || imageUrl || fallbackImageUrl;
  const isFallback = !localPreviewUrl && !imageUrl;
  const isError = /실패|초과|형식|선택/i.test(message);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  async function uploadVisual(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      const errorMessage = "JPG, PNG, WebP 이미지 형식만 등록할 수 있습니다.";
      setMessage(errorMessage);
      dispatchAdminToast(errorMessage, "error");
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      const errorMessage = `이미지 파일은 ${MAX_IMAGE_FILE_SIZE_MB}MB를 초과할 수 없습니다.`;
      setMessage(errorMessage);
      dispatchAdminToast(errorMessage, "error");
      return;
    }

    const previewObjectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(previewObjectUrl);
    setMessage(`${assetLabel} 이미지를 업로드하고 있습니다.`);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = typeof payload.detail === "string" ? payload.detail : "";
        const responseMessage =
          typeof payload.message === "string" ? payload.message : `${assetLabel} 업로드에 실패했습니다.`;
        throw new Error(detail ? `${responseMessage} ${detail}` : responseMessage);
      }

      const uploadedUrl = Array.isArray(payload.files)
        ? (payload.files as UploadedImage[])
            .map((item) => normalizeUploadedUrl(item.fileDownloadUri || ""))
            .find(Boolean)
        : "";

      if (!uploadedUrl) {
        throw new Error("업로드 응답에서 이미지 주소를 확인할 수 없습니다.");
      }

      setImageUrl(uploadedUrl);
      setLocalPreviewUrl("");
      const successMessage = `업로드 완료. 아래 공통 설정 저장 버튼을 누르면 ${assetLabel} 영역에 반영됩니다.`;
      setMessage(successMessage);
      dispatchAdminToast(successMessage);
    } catch (error) {
      setLocalPreviewUrl("");
      const errorMessage = error instanceof Error ? error.message : `${assetLabel} 업로드에 실패했습니다.`;
      setMessage(errorMessage);
      dispatchAdminToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  }

  function clearVisual() {
    setImageUrl("");
    setLocalPreviewUrl("");
    const successMessage = "등록 이미지를 해제했습니다. 저장하면 기본 노출 이미지로 돌아갑니다.";
    setMessage(successMessage);
    dispatchAdminToast(successMessage);
  }

  return (
    <div className="admin-storefront-visual-upload" aria-busy={isUploading}>
      <input name={fieldName} type="hidden" value={imageUrl} />

      <div className="admin-storefront-visual-preview">
        <Image
          alt={isFallback ? fallbackAlt : `등록된 ${assetLabel} 미리보기`}
          className="object-cover"
          fill
          sizes="(max-width: 1024px) 100vw, 760px"
          src={previewUrl}
          unoptimized={Boolean(localPreviewUrl)}
        />
        <span className="admin-storefront-visual-status">
          {isFallback ? fallbackStatusLabel : "관리자 등록 이미지"}
        </span>
      </div>

      <div className="admin-storefront-visual-guide">
        <strong>권장 사이즈 {recommendedSize}</strong>
        <span>JPG · PNG · WebP / 최대 {MAX_IMAGE_FILE_SIZE_MB}MB</span>
        <span>모바일에서는 좌우가 일부 잘릴 수 있으니 중요한 내용은 이미지 중앙에 배치해주세요.</span>
      </div>

      <div className="admin-storefront-visual-actions">
        <label className="admin-button secondary" aria-disabled={isUploading}>
          {isUploading ? "업로드 중..." : imageUrl ? "이미지 교체" : `${assetLabel} 등록`}
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={uploadVisual}
            type="file"
          />
        </label>
        {imageUrl ? (
          <button className="admin-button secondary" disabled={isUploading} onClick={clearVisual} type="button">
            등록 이미지 해제
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          className={`admin-storefront-visual-message ${isError ? "is-error" : "is-success"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
