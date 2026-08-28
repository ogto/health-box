import Image from "next/image";

import { saveStorefrontConfigAction } from "../../_actions/health-box-admin";
import { BrandLogo } from "../../_components/brand-logo";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminStorefrontMenuEditor } from "../../_components/admin/admin-storefront-menu-editor";
import { AdminStorefrontWorkspace } from "../../_components/admin/admin-storefront-workspace";
import { AdminStorefrontVisualUpload } from "../../_components/admin/admin-storefront-visual-upload";
import { AdminReadOnlyNotice } from "../../_components/admin/admin-read-only-notice";
import { AdminSubmitButton } from "../../_components/admin/admin-submit-button";
import { AdminMetrics, AdminPanel } from "../../_components/admin/admin-ui";
import type { AdminMetric } from "../../_lib/admin-data";
import {
  fetchAdminNotices,
  fetchAdminDealerMalls,
  fetchAdminProducts,
  fetchAdminPublicSiteConfig,
  hasHealthBoxApi,
} from "../../_lib/health-box-api";
import { getAdminSession } from "../../_lib/admin-auth";
import { mapNoticeRows, mapProductRows } from "../../_lib/health-box-presenters";
import { resolveStorefrontNavigationItems, storefrontConfig } from "../../_lib/storefront-config";
import { formatZipRangeLines, parseStorefrontPolicyBundle } from "../../_lib/storefront-policy";

const previewTabs = ["베스트", "균형있는", "건강하게", "체중조절"] as const;

export default async function AdminStorefrontPage() {
  const session = await getAdminSession();
  const dealerAdmin = session?.scopeType === "DEALER";
  const [remoteConfig, remoteProductPage, remoteNotices, dealerMalls] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminPublicSiteConfig(),
        fetchAdminProducts(
          { page: 1, size: 200 },
          dealerAdmin ? { adminAccess: "public" } : undefined,
        ),
        fetchAdminNotices(),
        dealerAdmin ? fetchAdminDealerMalls() : Promise.resolve([]),
      ])
    : [null, null, null, null];
  const productOptions = mapProductRows(remoteProductPage).items;
  const previewProducts = productOptions.slice(0, 4);
  const latestProductImage = previewProducts[0]?.image || storefrontConfig.assets.heroImage;
  const previewNotices = mapNoticeRows(remoteNotices).slice(0, 3);
  const policyBundle = parseStorefrontPolicyBundle(remoteConfig?.policyText);
  const rootDomain = process.env.STORE_ROOT_DOMAIN?.trim() || "everybuy.co.kr";
  const dealerSlug = dealerAdmin && dealerMalls?.[0]
    ? String(dealerMalls[0].slug || "").trim()
    : "";
  const publicStoreUrl = `https://${dealerSlug ? `${dealerSlug}.` : ""}${rootDomain}`;

  const pageConfig = {
    metadata: {
      title: remoteConfig?.metaTitle || storefrontConfig.metadata.title,
      description: remoteConfig?.metaDescription || storefrontConfig.metadata.description,
    },
    brand: {
      ...storefrontConfig.brand,
      searchPlaceholder: remoteConfig?.searchPlaceholder || storefrontConfig.brand.searchPlaceholder,
      policyMessage: policyBundle.message || storefrontConfig.brand.policyMessage,
    },
    assets: {
      ...storefrontConfig.assets,
      logoUrl: remoteConfig?.logoUrl || "",
      heroImage: remoteConfig?.mainVisualUrl || latestProductImage,
      heroHref: remoteConfig?.mainVisualLinkUrl || "",
      bannerImage: remoteConfig?.middleBannerUrl || storefrontConfig.assets.bannerImage,
      bannerHref: remoteConfig?.middleBannerLinkUrl || "",
      shareImage:
        remoteConfig?.shareThumbnailUrl ||
        remoteConfig?.mainVisualUrl ||
        storefrontConfig.assets.shareImage,
      faviconPath: remoteConfig?.faviconUrl || storefrontConfig.assets.faviconPath,
    },
    navigation: resolveStorefrontNavigationItems(
      remoteConfig?.mainNavigationJson || remoteConfig?.navigationJson || remoteConfig?.menuJson,
    ),
    supportText: remoteConfig?.customerCenterText || storefrontConfig.home.supportItems[0]?.value || "",
  };

  const storefrontMetrics: AdminMetric[] = [
    {
      label: "공통 헤더 적용",
      value: "전 페이지",
      hint: "StoreShell 기반 공개 페이지",
      tone: "blue",
    },
    {
      label: "메인 비주얼",
      value: remoteConfig?.mainVisualUrl ? "직접 등록" : "최신 상품 자동",
      hint: "권장 1920 × 720px",
      tone: "cyan",
    },
    {
      label: dealerAdmin ? "관리 모드" : "저장 대상",
      value: dealerAdmin ? "조회 전용" : "공통 설정",
      hint: dealerAdmin ? "변경은 본사 관리자에게 요청" : "공개몰 전체 반영",
      tone: "green",
    },
    {
      label: "연동 상태",
      value: hasHealthBoxApi() ? "API 연결" : "API 미연결",
      hint: hasHealthBoxApi() ? "건강창고 전용 API 저장 가능" : "환경변수 필요",
      tone: hasHealthBoxApi() ? "gold" : "rose",
    },
  ];

  return (
    <div className="admin-page">
      <AdminHeader
        title={dealerAdmin ? "홈페이지조회" : "홈페이지관리"}
        actions={
          <a className="admin-button secondary" href={publicStoreUrl} rel="noreferrer" target="_blank">
            공개몰 열기
          </a>
        }
      />

      <AdminMetrics items={storefrontMetrics} />

      {dealerAdmin ? <AdminReadOnlyNotice scopeName={session?.scopeName} /> : null}

      <AdminStorefrontWorkspace
        publicStoreUrl={publicStoreUrl}
        readOnly={dealerAdmin}
        settings={
          <form action={saveStorefrontConfigAction} className="admin-form-main">
            <input name="id" type="hidden" value={String(remoteConfig?.id || "")} />
            <input name="redirectTo" type="hidden" value="/admin/storefront" />
            <AdminPanel title="검색 / 정책 문구">
            <div className="admin-field-grid two">
              <label className="admin-field span-two">
                <span>검색 문구</span>
                <input
                  className="admin-input"
                  defaultValue={remoteConfig?.searchPlaceholder || ""}
                  name="searchPlaceholder"
                  type="text"
                />
              </label>
              <label className="admin-field span-two">
                <span>운영 정책 문구</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={policyBundle.message}
                  name="policyText"
                />
              </label>
              <label className="admin-field span-two">
                <span>고객센터 문구</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={remoteConfig?.customerCenterText || ""}
                  name="customerCenterText"
                />
              </label>
            </div>
            </AdminPanel>

          <AdminPanel
            title="배송비 정책"
            description="장바구니, 결제 승인, 주문 생성에서 동일한 서버 계산 규칙을 사용합니다."
          >
            <div className="admin-field-grid three">
              <label className="admin-field">
                <span>기본 배송비</span>
                <input
                  className="admin-input"
                  defaultValue={policyBundle.commerce.baseShippingFee}
                  min="0"
                  name="baseShippingFee"
                  required
                  step="100"
                  type="number"
                />
              </label>
              <label className="admin-field">
                <span>무료배송 기준금액</span>
                <input
                  className="admin-input"
                  defaultValue={policyBundle.commerce.freeShippingThreshold}
                  min="0"
                  name="freeShippingThreshold"
                  required
                  step="1000"
                  type="number"
                />
              </label>
              <label className="admin-field">
                <span>도서산간 추가비</span>
                <input
                  className="admin-input"
                  defaultValue={policyBundle.commerce.remoteAreaFee}
                  min="0"
                  name="remoteAreaFee"
                  step="100"
                  type="number"
                />
              </label>
              <label className="admin-field span-two">
                <span>도서산간 우편번호 범위</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={formatZipRangeLines(policyBundle.commerce.remoteAreaZipRanges)}
                  name="remoteAreaZipRanges"
                  placeholder={"63000-63644\n40200-40240"}
                  rows={4}
                />
                <small className="admin-field-hint">
                  한 줄에 하나씩 5자리 우편번호 범위를 입력하세요. 기본값은 제주(63000-63644)와 울릉도(40200-40240)이며,
                  배송지 우편번호가 범위에 포함되면 무료배송 조건을 충족해도 추가비가 부과됩니다.
                </small>
              </label>
              <label className="admin-field span-two">
                <span>기본 배송 안내</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={policyBundle.commerce.deliveryGuide}
                  name="defaultDeliveryGuide"
                  required
                />
              </label>
              <label className="admin-field span-two">
                <span>기본 교환·반품 안내</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={policyBundle.commerce.exchangeReturnGuide}
                  name="defaultExchangeReturnGuide"
                  required
                />
              </label>
              <label className="admin-field span-two">
                <span>쇼핑안전거래 TIP</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={policyBundle.commerce.safetyTip}
                  name="defaultSafetyTip"
                />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel
            title="판매자정보"
            description="공개몰 푸터와 상품 상세에 공통으로 표시됩니다. 실제 계약·결제 주체의 정보를 입력하세요."
          >
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>쇼핑몰명</span>
                <input className="admin-input" defaultValue={policyBundle.seller.shopName} name="sellerShopName" required type="text" />
              </label>
              <label className="admin-field">
                <span>상호명</span>
                <input className="admin-input" defaultValue={policyBundle.seller.companyName} name="sellerCompanyName" required type="text" />
              </label>
              <label className="admin-field">
                <span>대표자명</span>
                <input className="admin-input" defaultValue={policyBundle.seller.representativeName} name="sellerRepresentativeName" required type="text" />
              </label>
              <label className="admin-field">
                <span>사업자등록번호</span>
                <input
                  className="admin-input"
                  defaultValue={policyBundle.seller.businessRegistrationNumber}
                  name="sellerBusinessRegistrationNumber"
                  required
                  type="text"
                />
              </label>
              <label className="admin-field">
                <span>통신판매업 신고번호</span>
                <input
                  className="admin-input"
                  defaultValue={policyBundle.seller.mailOrderRegistrationNumber}
                  name="sellerMailOrderRegistrationNumber"
                  type="text"
                />
              </label>
              <label className="admin-field">
                <span>고객센터 전화</span>
                <input className="admin-input" defaultValue={policyBundle.seller.supportPhone} name="sellerSupportPhone" required type="tel" />
              </label>
              <label className="admin-field span-two">
                <span>사업장 주소</span>
                <input className="admin-input" defaultValue={policyBundle.seller.businessAddress} name="sellerBusinessAddress" required type="text" />
              </label>
              <label className="admin-field span-two">
                <span>고객센터 이메일</span>
                <input className="admin-input" defaultValue={policyBundle.seller.supportEmail} name="sellerSupportEmail" required type="email" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="상단 메뉴">
            <AdminStorefrontMenuEditor items={pageConfig.navigation} products={productOptions} />
          </AdminPanel>

          <AdminPanel title="메타 / 공유 설정">
            <div className="admin-field-grid two">
              <label className="admin-field span-two">
                <span>메타 타이틀</span>
                <input className="admin-input" defaultValue={remoteConfig?.metaTitle || ""} name="metaTitle" type="text" />
              </label>
              <label className="admin-field span-two">
                <span>메타 설명</span>
                <textarea
                  className="admin-textarea"
                  defaultValue={remoteConfig?.metaDescription || ""}
                  name="metaDescription"
                />
              </label>
              <label className="admin-field">
                <span>공유 썸네일</span>
                <input className="admin-input" defaultValue={remoteConfig?.shareThumbnailUrl || ""} name="shareThumbnailUrl" type="url" />
              </label>
              <label className="admin-field">
                <span>파비콘</span>
                <input className="admin-input" defaultValue={remoteConfig?.faviconUrl || ""} name="faviconUrl" type="text" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="이미지 자산">
            <div className="admin-field-grid two">
              <label className="admin-field span-two">
                <span>로고 이미지 URL</span>
                <input className="admin-input" defaultValue={remoteConfig?.logoUrl || ""} name="logoUrl" type="url" />
              </label>
              <div className="admin-field span-two">
                <span>메인 비주얼</span>
                <AdminStorefrontVisualUpload
                  assetLabel="메인 비주얼"
                  defaultValue={remoteConfig?.mainVisualUrl || ""}
                  fallbackAlt="최신 상품 자동 노출 미리보기"
                  fallbackImageUrl={latestProductImage}
                  fallbackStatusLabel="최신 상품 이미지 자동 노출"
                  fieldName="mainVisualUrl"
                  recommendedSize="1920 × 720px"
                />
                <label className="admin-field">
                  <span>클릭 링크</span>
                  <input
                    className="admin-input"
                    defaultValue={remoteConfig?.mainVisualLinkUrl || ""}
                    name="mainVisualLinkUrl"
                    placeholder="/products/best 또는 https://..."
                    type="text"
                  />
                  <small className="admin-field-hint">비워두면 이미지가 클릭되지 않습니다.</small>
                </label>
              </div>
              <div className="admin-field span-two">
                <span>중간 배너</span>
                <AdminStorefrontVisualUpload
                  assetLabel="중간 배너"
                  defaultValue={remoteConfig?.middleBannerUrl || ""}
                  fallbackAlt="기본 중간 배너 미리보기"
                  fallbackImageUrl={storefrontConfig.assets.bannerImage}
                  fallbackStatusLabel="기본 중간 배너"
                  fieldName="middleBannerUrl"
                  recommendedSize="1920 × 384px"
                />
                <label className="admin-field">
                  <span>클릭 링크</span>
                  <input
                    className="admin-input"
                    defaultValue={remoteConfig?.middleBannerLinkUrl || ""}
                    name="middleBannerLinkUrl"
                    placeholder="/promotion 또는 https://..."
                    type="text"
                  />
                  <small className="admin-field-hint">비워두면 이미지가 클릭되지 않습니다.</small>
                </label>
              </div>
            </div>
          </AdminPanel>

          <div className="admin-action-stack">
            {hasHealthBoxApi() ? (
              <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
                {dealerAdmin ? "딜러몰 설정 저장" : "공통 설정 저장"}
              </AdminSubmitButton>
            ) : (
              <button className="admin-button" disabled type="button">
                API 연결 필요
              </button>
            )}
          </div>
          </form>
        }
        preview={
          <AdminPanel title="미리보기">
            <div className="admin-storefront-preview-card">
              <div className="admin-storefront-mini-shell">
                <div className="admin-storefront-mini-promo">
                  <span>첫 쇼핑을 지원하는 3,000원 할인 회원가입 쿠폰</span>
                  <strong>오늘 하루 보지 않기</strong>
                </div>

                <div className="admin-storefront-mini-header">
                  <div className="admin-storefront-mini-toolbar">
                    <div className="admin-storefront-mini-toolbar-spacer" />
                    <div className="admin-storefront-mini-icons">
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="admin-storefront-mini-brand">
                    <BrandLogo
                      alt="건강창고 미리보기 로고"
                      className="brand-mark"
                      src={pageConfig.assets.logoUrl || undefined}
                      variant="circle"
                    />
                  </div>

                  <div className="admin-storefront-mini-search">
                    <p>{pageConfig.brand.searchPlaceholder}</p>
                    <strong>검색</strong>
                  </div>

                  <div className="admin-storefront-mini-nav">
                    {pageConfig.navigation.filter((item) => item.visible !== false).map((item) => (
                      <span
                        className={item.style === "category" ? "is-category" : undefined}
                        key={item.key}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="admin-storefront-mini-body">
                  <div className="admin-storefront-mini-hero-grid is-single">
                    <div className="admin-storefront-mini-lead-card">
                      <Image
                        alt={storefrontConfig.assets.heroAlt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 260px"
                        src={pageConfig.assets.heroImage}
                      />
                    </div>
                  </div>

                  <div className="admin-storefront-mini-section-head">
                    <p>{storefrontConfig.home.hero.kicker}</p>
                    <strong>건강한 삶을 위한 다양한 셀렉션</strong>
                  </div>

                  <div className="admin-storefront-mini-banner">
                    <Image
                      alt={storefrontConfig.assets.bannerAlt}
                      className="object-cover"
                      fill
                      sizes="(max-width: 1024px) 100vw, 520px"
                      src={pageConfig.assets.bannerImage}
                    />
                    <div className="admin-storefront-mini-banner-copy">
                      <span>{storefrontConfig.home.banner.kicker}</span>
                      <strong>{storefrontConfig.home.banner.title}</strong>
                    </div>
                  </div>

                  <div className="admin-storefront-mini-section-head">
                    <p>건강식품 추천</p>
                    <strong>엄선된 건강식품으로 활력 넘치는 하루를 시작하세요</strong>
                  </div>

                  <div className="admin-storefront-mini-tabs">
                    {previewTabs.map((item, index) => (
                      <span
                        className={index === 0 ? "is-active" : undefined}
                        key={item}
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="admin-storefront-mini-products">
                    {previewProducts.map((product) => (
                      <article className="admin-storefront-mini-product-card" key={product.slug}>
                        <div className="admin-storefront-mini-product-image">
                          {product.image ? (
                            <Image
                              alt={product.title}
                              className="object-cover"
                              fill
                              sizes="(max-width: 1024px) 100vw, 140px"
                              src={product.image}
                            />
                          ) : (
                            <div className="admin-empty-state compact">
                              <strong>이미지 없음</strong>
                            </div>
                          )}
                        </div>
                        <div className="admin-storefront-mini-product-copy">
                          <span>{product.brand}</span>
                          <strong>{product.title}</strong>
                        </div>
                      </article>
                    ))}
                    {!previewProducts.length ? (
                      <div className="admin-empty-state compact">
                        <strong>상품 데이터 없음</strong>
                        <p>관리자 상품 API에 등록된 상품이 아직 없습니다.</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="admin-storefront-mini-notice">
                    <div className="admin-storefront-mini-notice-list">
                      <div className="admin-storefront-mini-section-head is-inline">
                        <p>공지사항</p>
                        <strong>운영 안내</strong>
                      </div>
                      {previewNotices.map((notice) => (
                        <div className="admin-storefront-mini-notice-row" key={notice.slug}>
                          <strong>{notice.title}</strong>
                          <span>{notice.date}</span>
                        </div>
                      ))}
                      {!previewNotices.length ? (
                        <div className="admin-empty-state compact">
                          <strong>공지 데이터 없음</strong>
                          <p>관리자 공지 API에 등록된 공지가 아직 없습니다.</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="admin-storefront-mini-support">
                      <div className="admin-storefront-mini-support-item">
                        <strong>고객센터</strong>
                        <span>{pageConfig.supportText}</span>
                      </div>
                      <div className="admin-storefront-mini-support-item">
                        <strong>운영 정책</strong>
                        <span>{pageConfig.brand.policyMessage}</span>
                      </div>
                      <div className="admin-storefront-mini-support-item">
                        <strong>메타 타이틀</strong>
                        <span>{pageConfig.metadata.title}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AdminPanel>
        }
      />
    </div>
  );
}
