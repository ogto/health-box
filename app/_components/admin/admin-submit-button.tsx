"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function AdminSubmitButton({
  children,
  pendingLabel,
  className = "admin-button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending || props.disabled} {...props}>
      {pending ? pendingLabel || "처리중..." : children}
    </button>
  );
}
