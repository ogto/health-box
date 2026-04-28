"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";

type ExistingProductImage = {
  kind: "existing";
  url: string;
};

type LocalProductImage = {
  fileName: string;
  id: string;
  kind: "local";
  previewUrl: string;
  size: number;
};

type ProductImageItem = ExistingProductImage | LocalProductImage;

type UploadedProductImage = {
  fileDownloadUri?: string;
  fileName?: string;
  fileType?: string;
  size?: number;
};

const DEFAULT_IMAGE_BASE_URL = "https://cdn.1472.ai";

function normalizeImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\/cloud\.1472\.ai(?::\d+)?\/downloadFile\//i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/cloud\.1472\.ai(?::\d+)?\/downloadFile\//i, `${DEFAULT_IMAGE_BASE_URL}/`);
  }

  if (/^(blob:|data:)/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  try {
    return new URL(trimmed.replace(/^\/?/, "/"), DEFAULT_IMAGE_BASE_URL).toString();
  } catch {
    return trimmed;
  }
}

function formatBytes(size: number | undefined) {
  if (!size || !Number.isFinite(size)) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function imageIdentity(image: ProductImageItem) {
  return image.kind === "local" ? image.id : image.url;
}

async function uploadImages(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/admin/product-images", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : "";
    const message = typeof payload.message === "string" ? payload.message : "이미지 업로드에 실패했습니다.";
    throw new Error(detail ? `${message} ${detail}` : message);
  }

  return Array.isArray(payload.files) ? (payload.files as UploadedProductImage[]) : [];
}

export function AdminProductImageUpload({
  defaultImages = [],
}: {
  defaultImages?: string[];
}) {
  const [images, setImages] = useState<ProductImageItem[]>(
    Array.from(new Set(defaultImages.map((url) => normalizeImageUrl(url)).filter(Boolean))).map(
      (url) => ({ kind: "existing", url }) satisfies ExistingProductImage,
    ),
  );
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = useRef(new Map<string, DOMRect>());

  const imageUrls = useMemo(
    () => images.filter((image): image is ExistingProductImage => image.kind === "existing").map((image) => image.url),
    [images],
  );
  const mainImageUrl = imageUrls[0] || "";
  const mainImage = images[0];
  const mainPreviewUrl = mainImage?.kind === "existing" ? mainImage.url : mainImage?.previewUrl;
  const isErrorMessage = message.includes("실패") || message.includes("없습니다");

  function captureImagePositions() {
    const nextRects = new Map<string, DOMRect>();
    for (const [key, element] of itemRefs.current.entries()) {
      nextRects.set(key, element.getBoundingClientRect());
    }
    previousRectsRef.current = nextRects;
  }

  useLayoutEffect(() => {
    const previousRects = previousRectsRef.current;
    if (!previousRects.size) {
      return;
    }

    for (const image of images) {
      const key = imageIdentity(image);
      const element = itemRefs.current.get(key);
      const previousRect = previousRects.get(key);
      if (!element || !previousRect) {
        continue;
      }

      const nextRect = element.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        continue;
      }

      element.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" },
        ],
        {
          duration: 240,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        },
      );
    }

    previousRectsRef.current = new Map();
  }, [images]);

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (!selected.length) {
      return;
    }

    const localImages = selected.map((file) => ({
      fileName: file.name,
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      kind: "local" as const,
      previewUrl: URL.createObjectURL(file),
      size: file.size,
    }));

    setImages((current) => [...current, ...localImages]);
    setMessage(`${localImages.length}개 이미지 업로드 중입니다.`);
    setIsUploading(true);

    try {
      const uploaded = await uploadImages(selected);
      const uploadedImages = uploaded
        .map((file) => normalizeImageUrl(file.fileDownloadUri || ""))
        .filter(Boolean)
        .map((url) => ({ kind: "existing", url }) satisfies ExistingProductImage);

      if (!uploadedImages.length) {
        throw new Error("업로드 응답에 이미지 URL이 없습니다.");
      }

      setImages((current) => {
        const localIds = new Set(localImages.map((image) => image.id));
        const withoutLocal = current.filter((image) => image.kind !== "local" || !localIds.has(image.id));
        const existingUrls = new Set(
          withoutLocal.filter((image): image is ExistingProductImage => image.kind === "existing").map((image) => image.url),
        );
        return [...withoutLocal, ...uploadedImages.filter((image) => !existingUrls.has(image.url))];
      });
      setMessage(`${uploadedImages.length}개 이미지 업로드 완료`);
    } catch (error) {
      setImages((current) => current.filter((image) => !localImages.some((localImage) => localImage.id === imageIdentity(image))));
      setMessage(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
    } finally {
      for (const image of localImages) {
        URL.revokeObjectURL(image.previewUrl);
      }
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    captureImagePositions();
    setImages((current) =>
      current.filter((image, currentIndex) => {
        if (currentIndex === index && image.kind === "local") {
          URL.revokeObjectURL(image.previewUrl);
        }

        return currentIndex !== index;
      }),
    );
    setMessage("이미지가 제거되었습니다. 상품 수정 버튼을 눌러 저장하세요.");
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= images.length || toIndex >= images.length) {
      return;
    }

    captureImagePositions();
    setImages((current) => {
      if (fromIndex >= current.length || toIndex >= current.length) {
        return current;
      }

      const nextImages = [...current];
      const [movedImage] = nextImages.splice(fromIndex, 1);
      nextImages.splice(toIndex, 0, movedImage);
      return nextImages;
    });
    setMessage("이미지 순서가 변경되었습니다. 상품 수정 버튼을 눌러 저장하세요.");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, dropIndex: number) {
    event.preventDefault();
    if (draggingIndex === null) {
      return;
    }

    moveImage(draggingIndex, dropIndex);
    setDraggingIndex(null);
    setDropTargetIndex(null);
  }

  return (
    <div className="admin-product-image-upload">
      <input name="image" type="hidden" value={mainImageUrl} />
      <input name="imageUrl" type="hidden" value={mainImageUrl} />
      <input name="thumbnailUrl" type="hidden" value={mainImageUrl} />
      <input name="mainImageUrl" type="hidden" value={mainImageUrl} />
      <input name="fileDownloadUri" type="hidden" value={mainImageUrl} />
      <input name="gallery" type="hidden" value={JSON.stringify(imageUrls)} />

      <div className="admin-product-image-stage">
        {mainPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="대표 상품 이미지" src={mainPreviewUrl} />
        ) : (
          <div className="admin-product-image-empty-state">
            <strong>대표 이미지 없음</strong>
            <span>이미지를 추가하면 이 영역에 크게 표시됩니다.</span>
          </div>
        )}
      </div>

      <div className="admin-product-image-actions">
        <label className="admin-product-image-add-button">
          {isUploading ? "업로드 중..." : "이미지 추가"}
          <input accept="image/*" disabled={isUploading} multiple onChange={selectFiles} type="file" />
        </label>
        <span>썸네일을 드래그하거나 버튼으로 대표 이미지와 갤러리 순서를 바꿀 수 있습니다.</span>
      </div>

      {message ? (
        <p className={`admin-product-image-message ${isErrorMessage ? "is-error" : "is-success"}`} role="status">
          {message}
        </p>
      ) : null}

      {images.length ? (
        <div className="admin-product-image-list">
          {images.map((image, index) => {
            const imageUrl = image.kind === "existing" ? image.url : image.previewUrl;
            const label = index === 0 ? "대표 이미지" : `이미지 ${index + 1}`;
            const size = image.kind === "local" ? image.size : undefined;

            return (
              <div
                aria-label={`${label} 순서 변경`}
                className={`admin-product-image-item${draggingIndex === index ? " is-dragging" : ""}${dropTargetIndex === index ? " is-drop-target" : ""}`}
                draggable={!isUploading}
                key={imageIdentity(image)}
                ref={(element) => {
                  const key = imageIdentity(image);
                  if (element) {
                    itemRefs.current.set(key, element);
                  } else {
                    itemRefs.current.delete(key);
                  }
                }}
                onDragEnd={() => {
                  setDraggingIndex(null);
                  setDropTargetIndex(null);
                }}
                onDragEnter={() => setDropTargetIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggingIndex(index)}
                onDrop={(event) => handleDrop(event, index)}
              >
                <div className="admin-product-image-rank">{index + 1}</div>
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={label} src={imageUrl} />
                ) : (
                  <div className="admin-product-image-empty">미리보기 없음</div>
                )}
                <div>
                  <strong>{label}</strong>
                  <span>{image.kind === "local" ? "업로드 중" : index === 0 ? "대표로 노출" : "갤러리 이미지"}</span>
                  {formatBytes(size) ? <em>{formatBytes(size)}</em> : null}
                </div>
                <div className="admin-product-image-order-actions">
                  <button
                    aria-label={`${label} 대표 이미지로 지정`}
                    disabled={isUploading || index === 0}
                    onClick={() => moveImage(index, 0)}
                    title="대표 이미지로"
                    type="button"
                  >
                    ★
                  </button>
                  <button
                    aria-label={`${label} 앞으로 이동`}
                    disabled={isUploading || index === 0}
                    onClick={() => moveImage(index, index - 1)}
                    title="앞으로 이동"
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`${label} 뒤로 이동`}
                    disabled={isUploading || index === images.length - 1}
                    onClick={() => moveImage(index, index + 1)}
                    title="뒤로 이동"
                    type="button"
                  >
                    ↓
                  </button>
                  <button
                    aria-label={`${label} 삭제`}
                    className="is-delete"
                    disabled={isUploading}
                    onClick={() => removeImage(index)}
                    title="삭제"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
