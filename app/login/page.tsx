import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { MemberLoginForm } from "../_components/member-login-form";
import { getMemberSession } from "../_lib/member-auth";
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
  searchParams: Promise<{ next?: string; signup?: string }>;
}) {
  const params = await searchParams;
  const runtime = await getStorefrontRuntime();
  const session = await getMemberSession();
  const safeNextPath = resolveNextPath(params.next);

  if (session && (!runtime.dealer?.dealerMallId || session.dealerMallId === runtime.dealer.dealerMallId)) {
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
          {runtime.dealer?.dealerMallId ? (
            <MemberLoginForm
              dealerMallId={runtime.dealer.dealerMallId}
              dealerName={runtime.dealer.displayName}
              dealerSlug={runtime.dealer.slug}
              nextPath={safeNextPath}
              signupSuccess={params.signup === "success"}
            />
          ) : (
            <div className="member-auth-card content-panel">
              <div className="member-auth-head">
                <p className="section-kicker">Member Login</p>
                <h1 className="section-panel-title">회원 로그인</h1>
                <p className="member-auth-copy">딜러몰에서 접속한 뒤 로그인해주세요.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </StoreShell>
  );
}
