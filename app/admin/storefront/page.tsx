import Image from "next/image";
import Link from "next/link";

import { saveStorefrontConfigAction } from "../../_actions/health-box-admin";
import { BrandLogo } from "../../_components/brand-logo";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminSubmitButton } from "../../_components/admin/admin-submit-button";
import { AdminBadge, AdminMetrics, AdminPanel } from "../../_components/admin/admin-ui";
import type { AdminMetric } from "../../_lib/admin-data";
import {
  fetchAdminNotices,
  fetchAdminProducts,
  fetchAdminPublicSiteConfig,
  hasHealthBoxApi,
} from "../../_lib/health-box-api";
import { mapNoticeRows, mapProductRows } from "../../_lib/health-box-presenters";
import { storefrontConfig } from "../../_lib/storefront-config";

const previewTabs = ["베스트", "균형있는", "건강하게", "체중조절"] as const;
const previewNav = ["식품/간식", "영양제/보조제", "드링크", "기타", "공지사항"] as const;

export default async function AdminStorefrontPage() {
  const [remoteConfig, remoteProductPage, remoteNotices] = hasHealthBoxApi()
    ? await Promise.all([
        fetchAdminPublicSiteConfig(),
        fetchAdminProducts({ page: 1, size: 4 }),
        fetchAdminNotices(),
      ])
    : [null, null, null];
  const previewProducts = mapProductRows(remoteProductPage).items.slice(0, 4);
  const previewNotices = mapNoticeRows(remoteNotices).slice(0, 3);

  const pageConfig = {
    metadata: {
      title: remoteConfig?.metaTitle || storefrontConfig.metadata.title,
      description: remoteConfig?.metaDescription || storefrontConfig.metadata.description,
    },
    brand: {
      ...storefrontConfig.brand,
      searchPlaceholder: remoteConfig?.searchPlaceholder || storefrontConfig.brand.searchPlaceholder,
      policyMessage: remoteConfig?.policyText || storefrontConfig.brand.policyMessage,
    },
    assets: {
      ...storefrontConfig.assets,
      logoUrl: remoteConfig?.logoUrl || "",
      heroImage: remoteConfig?.mainVisualUrl || storefrontConfig.assets.heroImage,
      bannerImage: remoteConfig?.middleBannerUrl || storefrontConfig.assets.bannerImage,
      shareImage: remoteConfig?.shareThumbnailUrl || storefrontConfig.assets.shareImage,
      faviconPath: remoteConfig?.faviconUrl || storefrontConfig.assets.faviconPath,
    },
    supportText: remoteConfig?.customerCenterText || storefrontConfig.home.supportItems[0]?.value || "",
    syncTargets: storefrontConfig.syncTargets,
  };

  const storefrontMetrics: AdminMetric[] = [
    {
      label: "공통 헤더 적용",
      value: "전 페이지",
      hint: "StoreShell 기반 공개 페이지",
      tone: "blue",
    },
    {
      label: "공유 자산",
      value: "5개",
      hint: "로고 · 비주얼 · 배너 · 썸네일 · 파비콘",
      tone: "cyan",
    },
    {
      label: "저장 대상",
      value: "공통 설정",
      hint: "공개몰 전체 반영",
      tone: "green",
    },
    {
      label: "연동 상태",
      value: hasHealthBoxApi() ? "API 연결" : "API 미연결",
      hint: hasHealthBoxApi() ? "cloud-api 저장 가능" : "환경변수 필요",
      tone: hasHealthBoxApi() ? "gold" : "rose",
    },
  ];

  return (
    <div className="admin-page">
      <AdminHeader
        title="홈페이지관리"
        actions={
          <Link className="admin-button secondary" href="/">
            미리보기
          </Link>
        }
      />

      <AdminMetrics items={storefrontMetrics} />

      <div className="admin-form-layout admin-storefront-layout">
        <form action={saveStorefrontConfigAction} className="admin-form-main">
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
                  defaultValue={remoteConfig?.policyText || ""}
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
              <label className="admin-field">
                <span>메인 비주얼</span>
                <input className="admin-input" defaultValue={remoteConfig?.mainVisualUrl || ""} name="mainVisualUrl" type="url" />
              </label>
              <label className="admin-field">
                <span>중간 배너</span>
                <input className="admin-input" defaultValue={remoteConfig?.middleBannerUrl || ""} name="middleBannerUrl" type="url" />
              </label>
            </div>
          </AdminPanel>

          <div className="admin-action-stack">
            {hasHealthBoxApi() ? (
              <AdminSubmitButton className="admin-button" pendingLabel="저장중...">
                공통 설정 저장
              </AdminSubmitButton>
            ) : (
              <button className="admin-button" disabled type="button">
                API 연결 필요
              </button>
            )}
          </div>
        </form>

        <div className="admin-form-side">
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
                    {previewNav.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className="admin-storefront-mini-body">
                  <div className="admin-storefront-mini-hero-grid">
                    <div className="admin-storefront-mini-lead-card">
                      <Image
                        alt={storefrontConfig.assets.heroAlt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 260px"
                        src={pageConfig.assets.heroImage}
                      />
                      <div className="admin-storefront-mini-overlay">
                        <span>MAIN VISUAL</span>
                        <strong>{storefrontConfig.home.hero.titleLines.join(" ")}</strong>
                        <p>{storefrontConfig.home.hero.description}</p>
                      </div>
                    </div>

                    <div className="admin-storefront-mini-side-list">
                      <article className="admin-storefront-mini-side-card">
                        <Image
                          alt={storefrontConfig.home.banner.title}
                          className="object-cover"
                          fill
                          sizes="(max-width: 1024px) 100vw, 180px"
                          src={pageConfig.assets.bannerImage}
                        />
                        <div className="admin-storefront-mini-side-copy">
                          <strong>{storefrontConfig.home.banner.title}</strong>
                          <p>{storefrontConfig.home.banner.description}</p>
                        </div>
                      </article>
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

          <AdminPanel title="적용 범위">
            <div className="admin-list">
              {pageConfig.syncTargets.map((target) => (
                <div className="admin-list-row" key={target}>
                  <div className="admin-row-stack">
                    <strong>{target}</strong>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone="blue">공통 반영</AdminBadge>
                  </div>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
