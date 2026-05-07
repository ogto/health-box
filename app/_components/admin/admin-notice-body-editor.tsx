"use client";

import { useMemo, useState } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(value: string) {
  const paragraphs = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return "<p></p>";
  }

  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function normalizeNoticeContent(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "<p></p>";
  }

  return /<\/?[a-z][\s\S]*>/i.test(trimmed) ? trimmed : textToHtml(trimmed);
}

export function AdminNoticeBodyEditor({ defaultBody = "" }: { defaultBody?: string }) {
  const initialHtml = useMemo(() => normalizeNoticeContent(defaultBody), [defaultBody]);
  const [html, setHtml] = useState(initialHtml);

  return (
    <>
      <input name="body" type="hidden" value={html} />
      <SimpleEditor content={initialHtml} onChange={setHtml} />
    </>
  );
}
