"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type AdminToastTone = "error" | "success";

type AdminToastItem = {
  id: number;
  message: string;
  tone: AdminToastTone;
};

const TOAST_DURATION_MS = 3200;

function messageFromSearchParams(searchParams: URLSearchParams) {
  const toast = searchParams.get("toast");
  if (toast) {
    return { message: toast, tone: "success" as const };
  }

  const toastError = searchParams.get("toastError");
  if (toastError) {
    return { message: toastError, tone: "error" as const };
  }

  const createError = searchParams.get("createError");
  if (createError) {
    return { message: createError, tone: "error" as const };
  }

  if (searchParams.get("createStatus") === "success") {
    return { message: "등록이 완료되었습니다.", tone: "success" as const };
  }

  return null;
}

function removeToastParams(pathname: string, searchParams: URLSearchParams) {
  const nextParams = new URLSearchParams(searchParams);
  nextParams.delete("toast");
  nextParams.delete("toastError");
  nextParams.delete("createStatus");
  nextParams.delete("createError");

  const query = nextParams.toString();
  window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
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
        <div className={`admin-toast is-${toast.tone}`} key={toast.id} role="status">
          <span className="admin-toast-dot" />
          <div>
            <strong>{toast.tone === "error" ? "처리 실패" : "처리 완료"}</strong>
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
