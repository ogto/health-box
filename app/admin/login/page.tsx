import type { Metadata } from "next";

import { AdminLoginForm } from "../../_components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "건강창고 관리자 로그인",
  description: "건강창고 관리자 페이지 접근을 위한 로그인 화면",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return <AdminLoginForm nextPath={params.next} />;
}

