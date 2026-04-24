import type { Metadata } from "next";

import { AdminRouteShell } from "../_components/admin/admin-route-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "건강창고 관리자",
  description: "건강창고 쇼핑몰 운영을 위한 관리자 대시보드",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRouteShell>{children}</AdminRouteShell>;
}
