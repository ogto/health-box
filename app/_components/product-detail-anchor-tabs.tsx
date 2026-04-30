"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

export type ProductDetailAnchorTab = {
  id: string;
  label: string;
};

export function ProductDetailAnchorTabs({ tabs }: { tabs: ProductDetailAnchorTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id || "");
  const clickedActiveIdRef = useRef<string | null>(null);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );
  const tabCount = Math.max(1, tabs.length);
  const style = useMemo(
    () =>
      ({
        "--active-index": activeIndex,
        "--tab-count": tabCount,
      }) as CSSProperties,
    [activeIndex, tabCount],
  );

  useEffect(() => {
    function getSections() {
      return tabs
        .map((tab) => document.getElementById(tab.id))
        .filter((section): section is HTMLElement => Boolean(section));
    }

    function updateActiveSection() {
      if (clickedActiveIdRef.current) {
        return;
      }

      const sections = getSections();

      if (!sections.length) {
        return;
      }

      const pageBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;

      if (pageBottom) {
        setActiveId(sections[sections.length - 1].id);
        return;
      }

      const tabsBottom = document.querySelector(".shop-detail-tabs")?.getBoundingClientRect().bottom;
      const anchorLine = (tabsBottom || 88) + 24;
      const currentSection =
        sections.find((section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= anchorLine && rect.bottom > anchorLine;
        }) ||
        sections.find((section) => section.getBoundingClientRect().top > anchorLine) ||
        sections[sections.length - 1];

      setActiveId(currentSection.id);
    }

    function releaseClickedActiveId() {
      clickedActiveIdRef.current = null;
      updateActiveSection();
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("wheel", releaseClickedActiveId, { passive: true });
    window.addEventListener("touchmove", releaseClickedActiveId, { passive: true });
    window.addEventListener("keydown", releaseClickedActiveId);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("wheel", releaseClickedActiveId);
      window.removeEventListener("touchmove", releaseClickedActiveId);
      window.removeEventListener("keydown", releaseClickedActiveId);
    };
  }, [tabs]);

  return (
    <nav className="shop-detail-tabs" style={style}>
      <span className="shop-detail-tabs-active" aria-hidden="true" />
      {tabs.map((tab) => (
        <a
          className={tab.id === activeId ? "is-active" : ""}
          href={`#${tab.id}`}
          key={tab.id}
          onClick={(event) => {
            event.preventDefault();
            clickedActiveIdRef.current = tab.id;
            setActiveId(tab.id);
            document.getElementById(tab.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
