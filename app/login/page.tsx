import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { MemberLoginForm } from "../_components/member-login-form";
import { getMemberSession, isMemberSessionForDealer } from "../_lib/member-auth";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export const metadata: Metadata = {
  title: "회원 로그인",
  description: "건강창고 딜러몰 회원 로그인",
};

function resolveNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/mypage";
  }

  return nextPath;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; passwordReset?: string; signup?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getStorefrontRuntime();
  const session = await getMemberSession();
  const safeNextPath = resolveNextPath(params.next);
  const currentDealer = runtime.dealer;

  if (session && isMemberSessionForDealer(session, currentDealer)) {
    redirect(safeNextPath);
  }

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "회원 로그인" },
          ]}
        />

        <div className="member-auth-screen">
          {runtime.dealer?.slug ? (
            <MemberLoginForm
              dealerMallId={runtime.dealer.dealerMallId}
              dealerName={runtime.dealer.displayName}
              dealerSlug={runtime.dealer.slug}
              nextPath={safeNextPath}
              passwordResetSuccess={params.passwordReset === "success"}
              signupSuccess={params.signup === "success"}
            />
          ) : (
            <MemberLoginForm
              host={runtime.host.hostname}
              hqMall
              nextPath={safeNextPath}
              passwordResetSuccess={params.passwordReset === "success"}
              signupSuccess={params.signup === "success"}
            />
          )}
        </div>
      </section>
    </StoreShell>
  );
}
