import { redirect } from "next/navigation";

export default async function LegacyAdminProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/products/${slug}`);
}
