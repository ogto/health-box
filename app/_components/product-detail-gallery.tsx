"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export function ProductDetailGallery({
  title,
  images,
}: {
  title: string;
  images: string[];
}) {
  const safeImages = images.length ? images : ["/file.svg"];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const moveImage = useCallback((direction: 1 | -1) => {
    setLightboxIndex((currentIndex) => {
      const baseIndex = currentIndex ?? activeIndex;
      const nextIndex = (baseIndex + direction + safeImages.length) % safeImages.length;
      setActiveIndex(nextIndex);
      return nextIndex;
    });
  }, [activeIndex, safeImages.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        moveImage(1);
      }

      if (event.key === "ArrowLeft") {
        moveImage(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, moveImage]);

  return (
    <>
      <div className="detail-gallery">
        <button
          className="detail-main-image-button"
          onClick={() => openLightbox(activeIndex)}
          type="button"
        >
          <div className="detail-main-image">
            <Image
              alt={title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1120px) 100vw, 46vw"
              src={activeImage}
            />
          </div>
          <span className="detail-zoom-hint">이미지 크게 보기</span>
        </button>

        <div className="detail-thumb-row">
          {safeImages.map((image, index) => (
            <button
              aria-label={`${title} 이미지 ${index + 1} 보기`}
              className={`detail-thumb-button${index === activeIndex ? " is-active" : ""}`}
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <div className="detail-thumb">
                <Image
                  alt={`${title} 이미지 ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="120px"
                  src={image}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null ? (
        <div className="lightbox-backdrop" onClick={closeLightbox} role="presentation">
          <div className="lightbox-panel" onClick={(event) => event.stopPropagation()} role="dialog">
            <button
              aria-label="팝업 닫기"
              className="lightbox-close"
              onClick={closeLightbox}
              type="button"
            >
              ×
            </button>

            <button
              aria-label="이전 이미지"
              className="lightbox-nav prev"
              onClick={() => moveImage(-1)}
              type="button"
            >
              ‹
            </button>

            <div className="lightbox-image-wrap">
              <Image
                alt={`${title} 확대 이미지 ${lightboxIndex + 1}`}
                className="object-contain"
                fill
                sizes="100vw"
                src={safeImages[lightboxIndex]}
              />
            </div>

            <button
              aria-label="다음 이미지"
              className="lightbox-nav next"
              onClick={() => moveImage(1)}
              type="button"
            >
              ›
            </button>

            <div className="lightbox-caption">
              <strong>{title}</strong>
              <span>
                {lightboxIndex + 1} / {safeImages.length}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
