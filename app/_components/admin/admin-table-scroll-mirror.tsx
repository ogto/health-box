"use client";

import { useEffect, useRef, useState } from "react";

export function AdminTableScrollMirror({ className, targetId }: { className?: string; targetId: string }) {
  const targetRef = useRef<HTMLElement | null>(null);
  const [max, setMax] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const targetElement = target;
    targetRef.current = targetElement;

    function syncWidth() {
      setMax(Math.max(0, targetElement.scrollWidth - targetElement.clientWidth));
      setValue(targetElement.scrollLeft);
    }

    syncWidth();
    const resizeObserver = new ResizeObserver(syncWidth);
    resizeObserver.observe(targetElement);
    if (targetElement.firstElementChild) {
      resizeObserver.observe(targetElement.firstElementChild);
    }

    targetElement.addEventListener("scroll", syncWidth, { passive: true });
    window.addEventListener("resize", syncWidth);

    return () => {
      resizeObserver.disconnect();
      targetElement.removeEventListener("scroll", syncWidth);
      window.removeEventListener("resize", syncWidth);
      targetRef.current = null;
    };
  }, [targetId]);

  function moveScroll(nextValue: number) {
    setValue(nextValue);
    if (targetRef.current) {
      targetRef.current.scrollLeft = nextValue;
    }
  }

  return (
    <div className={`admin-table-scroll-mirror${className ? ` ${className}` : ""}`} aria-hidden="true">
      <input
        aria-label="주문목록 가로 스크롤"
        max={Math.max(1, max)}
        min="0"
        onChange={(event) => moveScroll(Number(event.target.value))}
        type="range"
        value={Math.min(value, Math.max(1, max))}
      />
    </div>
  );
}
