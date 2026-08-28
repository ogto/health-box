"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export type AdminToastTone = "error" | "info" | "success";

type AdminToastItem = {
  id: number;
  message: string;
  tone: AdminToastTone;
};

const TOAST_DURATION_MS = 3200;
const ERROR_TOAST_PARAMS = ["toastError", "createError", "memberApprovalError", "staffError"] as const;
const SUCCESS_TOAST_PARAMS = ["toast", "staffSaved"] as const;

export function dispatchAdminToast(message: string, tone: AdminToastTone = "success") {
  const trimmedMessage = message.trim();
  if (!trimmedMessage || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("admin-toast", {
      detail: { message: trimmedMessage, tone },
    }),
  );
}

function messageFromSearchParams(searchParams: URLSearchParams) {
  for (const key of ERROR_TOAST_PARAMS) {
    const message = searchParams.get(key);
    if (message) {
      return { message, tone: "error" as const };
    }
  }

  for (const key of SUCCESS_TOAST_PARAMS) {
    const message = searchParams.get(key);
    if (message) {
      return { message, tone: "success" as const };
    }
  }

  if (searchParams.get("createStatus") === "success") {
    return { message: "등록이 완료되었습니다.", tone: "success" as const };
  }

  return null;
}

function removeToastParams(pathname: string, searchParams: URLSearchParams) {
  const nextParams = new URLSearchParams(searchParams);
  for (const key of [...ERROR_TOAST_PARAMS, ...SUCCESS_TOAST_PARAMS]) {
    nextParams.delete(key);
  }
  nextParams.delete("createStatus");

  const query = nextParams.toString();
  const hash = window.location.hash;
  window.history.replaceState(null, "", `${query ? `${pathname}?${query}` : pathname}${hash}`);
}

export function AdminToastViewport() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const lastSearchToastRef = useRef("");
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);

  const searchParamsSnapshot = useMemo(() => new URLSearchParams(searchParamString), [searchParamString]);

  useEffect(() => {
    const payload = messageFromSearchParams(searchParamsSnapshot);
    if (!payload) {
      return;
    }

    const toastKey = `${payload.tone}:${payload.message}`;
    if (lastSearchToastRef.current === toastKey) {
      return;
    }

    lastSearchToastRef.current = toastKey;
    const id = Date.now();
    setToasts((current) => [...current, { id, ...payload }]);
    removeToastParams(pathname, searchParamsSnapshot);
    window.setTimeout(() => {
      if (lastSearchToastRef.current === toastKey) {
        lastSearchToastRef.current = "";
      }
    }, 250);
  }, [pathname, searchParamsSnapshot]);

  useEffect(() => {
    function handleAdminToast(event: Event) {
      const detail = (event as CustomEvent<{ message?: string; tone?: AdminToastTone }>).detail;
      if (!detail?.message) {
        return;
      }

      setToasts((current) => [
        ...current,
        {
          id: Date.now(),
          message: detail.message || "",
          tone: detail.tone || "success",
        },
      ]);
    }

    window.addEventListener("admin-toast", handleAdminToast);
    return () => window.removeEventListener("admin-toast", handleAdminToast);
  }, []);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, TOAST_DURATION_MS),
    );

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [toasts]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div aria-live="polite" className="admin-toast-viewport">
      {toasts.map((toast) => (
        <div className={`admin-toast is-${toast.tone}`} key={toast.id} role={toast.tone === "error" ? "alert" : "status"}>
          <span className="admin-toast-dot" />
          <div>
            <strong>{toast.tone === "error" ? "처리 실패" : toast.tone === "info" ? "안내" : "처리 완료"}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            aria-label="알림 닫기"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            type="button"
          >
            닫기
          </button>
        </div>
      ))}
    </div>
  );
}
