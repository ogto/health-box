import type { Metadata } from "next";

import { AdminRouteShell } from "../_components/admin/admin-route-shell";
import { getAdminSession } from "../_lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "건강창고 관리자",
  description: "건강창고 쇼핑몰 운영을 위한 관리자 대시보드",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  return <AdminRouteShell session={session}>{children}</AdminRouteShell>;
}
