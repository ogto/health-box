import type { Metadata } from "next";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { MemberSignupForm } from "../_components/member-signup-form";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export const metadata: Metadata = {
  title: "회원가입",
  description: "건강창고 딜러몰 구매 회원가입 신청",
};

function resolveNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/mypage";
  }

  return nextPath;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getStorefrontRuntime();

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "회원가입" },
          ]}
        />

        <div className="member-auth-screen">
          {runtime.dealer?.slug ? (
            <MemberSignupForm
              dealerMallId={runtime.dealer.dealerMallId}
              dealerName={runtime.dealer.displayName}
              dealerSlug={runtime.dealer.slug}
              nextPath={resolveNextPath(params.next)}
            />
          ) : (
            <MemberSignupForm
              hqMall
              nextPath={resolveNextPath(params.next)}
            />
          )}
        </div>
      </section>
    </StoreShell>
  );
}
