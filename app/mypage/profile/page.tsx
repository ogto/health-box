import { redirect } from "next/navigation";

import { MemberAccountLayout } from "../../_components/member-account-layout";
import { MemberProfileForm } from "../../_components/member-profile-form";
import { Breadcrumbs, StoreShell } from "../../_components/store-ui";
import { getMemberSession, isMemberSessionForDealer } from "../../_lib/member-auth";
import { getStorefrontRuntime } from "../../_lib/storefront-runtime";

export default async function MemberProfilePage() {
  const [runtime, session] = await Promise.all([getStorefrontRuntime(), getMemberSession()]);

  if (!session) {
    redirect("/login?next=/mypage/profile");
  }

  if (!isMemberSessionForDealer(session, runtime.dealer)) {
    redirect("/login?next=/mypage/profile");
  }

  return (
    <StoreShell activeKey="mypage">
      <section className="subpage-block">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "마이페이지", href: "/mypage" },
            { label: "회원 정보" },
          ]}
        />

        <MemberAccountLayout activeKey="profile" runtime={runtime} session={session}>
          <section className="content-panel account-address-panel">
            <div className="panel-head">
              <h1 className="section-panel-title">회원 정보</h1>
            </div>
            <MemberProfileForm email={session.email} name={session.name} phone={session.phone} />
            <div className="info-panel compact account-affiliation-panel">
              <div className="info-row">
                <strong>소속</strong>
                <span>{runtime.dealer?.mallName || runtime.brand.memberLabel}</span>
              </div>
            </div>
          </section>
        </MemberAccountLayout>
      </section>
    </StoreShell>
  );
}
