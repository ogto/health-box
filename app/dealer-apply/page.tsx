import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DealerApplicationForm } from "../_components/dealer-application-form";
import { Breadcrumbs, StoreShell } from "../_components/store-ui";
import { getStorefrontRuntime } from "../_lib/storefront-runtime";

export const metadata: Metadata = {
  title: "딜러 신청",
  description: "건강창고 딜러몰 운영 신청",
};

export default async function DealerApplyPage() {
  const runtime = await getStorefrontRuntime();

  if (runtime.dealer) {
    redirect(`https://${runtime.host.rootDomain}/dealer-apply`);
  }

  return (
    <StoreShell>
      <section className="subpage-block dealer-application-page">
        <Breadcrumbs
          items={[
            { label: "홈", href: "/" },
            { label: "딜러 신청" },
          ]}
        />
        <div className="dealer-application-screen">
          <DealerApplicationForm />
        </div>
      </section>
    </StoreShell>
  );
}
