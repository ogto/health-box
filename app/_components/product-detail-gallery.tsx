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
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const activeImage = images[activeIndex] ?? images[0];

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
      const nextIndex = (baseIndex + direction + images.length) % images.length;
      setActiveIndex(nextIndex);
      return nextIndex;
    });
  }, [activeIndex, images.length]);

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
              fill
              priority
              sizes="(max-width: 1120px) 100vw, 46vw"
              src={activeImage}
              className="object-cover"
            />
          </div>
          <span className="detail-zoom-hint">이미지 확대 보기</span>
        </button>

        <div className="detail-thumb-row">
          {images.map((image, index) => (
            <button
              aria-label={`${title} 썸네일 ${index + 1} 확대`}
              className={`detail-thumb-button${index === activeIndex ? " is-active" : ""}`}
              key={`${image}-${index}`}
              onClick={() => openLightbox(index)}
              type="button"
            >
              <div className="detail-thumb">
                <Image
                  alt={`${title} 썸네일 ${index + 1}`}
                  fill
                  sizes="120px"
                  src={image}
                  className="object-cover"
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
                fill
                sizes="100vw"
                src={images[lightboxIndex]}
                className="object-contain"
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
                {lightboxIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
