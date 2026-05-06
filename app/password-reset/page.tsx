import type { Metadata } from "next";

import { MemberPasswordResetForm } from "../_components/member-password-reset-form";
import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "건강창고 구매 회원 비밀번호 찾기",
};

function resolveNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/mypage";
  }

  return nextPath;
}

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getStorefrontRuntime();
  const safeNextPath = resolveNextPath(params.next);

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "비밀번호 찾기" },
          ]}
        />

        <div className="member-auth-screen">
          {runtime.dealer?.slug ? (
            <MemberPasswordResetForm
              dealerMallId={runtime.dealer.dealerMallId}
              dealerName={runtime.dealer.displayName}
              dealerSlug={runtime.dealer.slug}
              nextPath={safeNextPath}
            />
          ) : (
            <MemberPasswordResetForm
              host={runtime.host.hostname}
              hqMall
              nextPath={safeNextPath}
            />
          )}
        </div>
      </section>
    </StoreShell>
  );
}
