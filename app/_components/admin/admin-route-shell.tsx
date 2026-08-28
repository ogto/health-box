"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminShell } from "./admin-shell";
import type { AdminSession } from "../../_lib/admin-session";

export function AdminRouteShell({ children, session }: { children: ReactNode; session: AdminSession | null }) {
  const pathname = usePathname();

  if (pathname === "/admin/login" || pathname === "/login") {
    return <>{children}</>;
  }

  return session ? <AdminShell session={session}>{children}</AdminShell> : <>{children}</>;
}

