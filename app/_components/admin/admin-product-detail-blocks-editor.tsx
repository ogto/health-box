"use client";

import { useState } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

export function AdminProductDetailBlocksEditor({
  defaultHtml = "",
}: {
  defaultHtml?: string;
}) {
  const [html, setHtml] = useState(defaultHtml);

  return (
    <>
      <input name="detailHtml" type="hidden" value={html} />
      <SimpleEditor content={defaultHtml || "<p></p>"} onChange={setHtml} />
    </>
  );
}
