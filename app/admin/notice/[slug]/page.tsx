import { redirect } from "next/navigation";

export default async function LegacyAdminNoticeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/notices/${slug}`);
}
