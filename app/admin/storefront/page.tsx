import Image from "next/image";

import { BrandLogo } from "../../_components/brand-logo";
import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminStorefrontActions } from "../../_components/admin/admin-storefront-actions";
import { AdminBadge, AdminMetrics, AdminPanel } from "../../_components/admin/admin-ui";
import type { AdminMetric } from "../../_lib/admin-data";
import { storefrontConfig } from "../../_lib/storefront-config";

const storefrontMetrics: AdminMetric[] = [
  {
    label: "공통 헤더 적용",
    value: "전 페이지",
    hint: "StoreShell 기반 공개 페이지",
    tone: "blue",
  },
  {
    label: "공유 자산",
    value: "4개",
    hint: "로고 · 메인 · 배너 · 공유 썸네일",
    tone: "cyan",
  },
  {
    label: "딜러몰 반영 범위",
    value: "공통",
    hint: "브랜드 · 검색 · 메타",
    tone: "green",
  },
  {
    label: "운영 방식",
    value: "중앙 관리",
    hint: "한 번 수정하면 공통 반영",
    tone: "gold",
  },
];

const sectionToggles = [
  { title: "공통 헤더", enabled: true },
  { title: "메인 비주얼", enabled: true },
  { title: "중간 배너", enabled: true },
  { title: "공지 / 지원 영역", enabled: true },
] as const;

export default function AdminStorefrontPage() {
  const { assets, brand, home, metadata, syncTargets } = storefrontConfig;

  return (
    <div className="admin-page">
      <AdminHeader title="홈페이지관리" actions={<AdminStorefrontActions />} />

      <AdminMetrics items={storefrontMetrics} />

      <div className="admin-form-layout admin-storefront-layout">
        <div className="admin-form-main">
          <AdminPanel title="기본 설정">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>쇼핑몰명</span>
                <input className="admin-input" defaultValue={brand.name} type="text" />
              </label>
              <label className="admin-field">
                <span>보조 문구</span>
                <input className="admin-input" defaultValue={brand.kicker} type="text" />
              </label>
              <label className="admin-field">
                <span>검색 범위</span>
                <input className="admin-input" defaultValue={brand.searchScopeLabel} type="text" />
              </label>
              <label className="admin-field">
                <span>검색 문구</span>
                <input className="admin-input" defaultValue={brand.searchPlaceholder} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>정책 문구</span>
                <input className="admin-input" defaultValue={brand.policyMessage} type="text" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="메인 문구">
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>메인 라벨</span>
                <input className="admin-input" defaultValue={home.hero.kicker} type="text" />
              </label>
              <label className="admin-field">
                <span>배너 라벨</span>
                <input className="admin-input" defaultValue={home.banner.kicker} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>메인 제목</span>
                <input
                  className="admin-input"
                  defaultValue={home.hero.titleLines.join(" / ")}
                  type="text"
                />
              </label>
              <label className="admin-field span-two">
                <span>메인 설명</span>
                <textarea className="admin-textarea" defaultValue={home.hero.description} />
              </label>
              <label className="admin-field span-two">
                <span>중간 배너 제목</span>
                <input className="admin-input" defaultValue={home.banner.title} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>중간 배너 설명</span>
                <textarea className="admin-textarea" defaultValue={home.banner.description} />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="메타 / 공유 설정">
            <div className="admin-field-grid two">
              <label className="admin-field span-two">
                <span>메타 타이틀</span>
                <input className="admin-input" defaultValue={metadata.title} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>메타 설명</span>
                <textarea className="admin-textarea" defaultValue={metadata.description} />
              </label>
              <label className="admin-field">
                <span>공유 썸네일</span>
                <input className="admin-input" defaultValue={assets.shareImage} type="text" />
              </label>
              <label className="admin-field">
                <span>파비콘</span>
                <input className="admin-input" defaultValue={assets.faviconPath} type="text" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="이미지 자산">
            <div className="admin-storefront-asset-grid">
              <article className="admin-storefront-asset-card">
                <div className="admin-storefront-logo-preview">
                  <BrandLogo alt="건강창고 헤더 로고" className="brand-mark" variant="circle" />
                  <div className="admin-storefront-logo-copy">
                    <strong>{brand.name}</strong>
                    <p>{brand.kicker}</p>
                  </div>
                </div>
                <div className="admin-storefront-asset-copy">
                  <strong>헤더 로고</strong>
                  <span>{assets.logoType}</span>
                </div>
              </article>

              <article className="admin-storefront-asset-card">
                <div className="admin-storefront-asset-thumb">
                  <Image
                    alt={assets.heroAlt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 280px"
                    src={assets.heroImage}
                  />
                </div>
                <div className="admin-storefront-asset-copy">
                  <strong>메인 비주얼</strong>
                  <span>{assets.heroImage}</span>
                </div>
              </article>

              <article className="admin-storefront-asset-card">
                <div className="admin-storefront-asset-thumb">
                  <Image
                    alt={assets.bannerAlt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 280px"
                    src={assets.bannerImage}
                  />
                </div>
                <div className="admin-storefront-asset-copy">
                  <strong>중간 배너</strong>
                  <span>{assets.bannerImage}</span>
                </div>
              </article>

              <article className="admin-storefront-asset-card">
                <div className="admin-storefront-asset-thumb">
                  <Image
                    alt="공유 썸네일"
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 280px"
                    src={assets.shareImage}
                  />
                </div>
                <div className="admin-storefront-asset-copy">
                  <strong>공유 썸네일</strong>
                  <span>{assets.shareImage}</span>
                </div>
              </article>
            </div>

            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>로고 타입</span>
                <input className="admin-input" defaultValue={assets.logoType} type="text" />
              </label>
              <label className="admin-field">
                <span>메인 비주얼</span>
                <input className="admin-input" defaultValue={assets.heroImage} type="text" />
              </label>
              <label className="admin-field">
                <span>중간 배너</span>
                <input className="admin-input" defaultValue={assets.bannerImage} type="text" />
              </label>
              <label className="admin-field">
                <span>공유 썸네일</span>
                <input className="admin-input" defaultValue={assets.shareImage} type="text" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel title="메인 구성">
            <div className="admin-toggle-grid">
              {sectionToggles.map((item) => (
                <div className="admin-toggle-card" key={item.title}>
                  <div className="admin-row-stack">
                    <strong>{item.title}</strong>
                    <span>{item.enabled ? "사용" : "중지"}</span>
                  </div>
                  <button
                    aria-pressed={item.enabled}
                    className={`admin-switch${item.enabled ? " is-on" : ""}`}
                    type="button"
                  >
                    <span />
                  </button>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>

        <div className="admin-form-side">
          <AdminPanel title="미리보기">
            <div className="admin-storefront-preview-card">
              <div className="admin-storefront-mini-shell">
                <div className="admin-storefront-mini-header">
                  <div className="admin-storefront-mini-brand">
                    <BrandLogo alt="건강창고 미리보기 로고" className="brand-mark" variant="circle" />
                    <div className="admin-storefront-mini-brand-copy">
                      <p>{brand.kicker}</p>
                      <strong>{brand.name}</strong>
                    </div>
                  </div>

                  <div className="admin-storefront-mini-search">
                    <span>{brand.searchScopeLabel}</span>
                    <p>{brand.searchPlaceholder}</p>
                    <strong>검색</strong>
                  </div>
                </div>

                <div className="admin-storefront-mini-body">
                  <div className="admin-storefront-mini-hero">
                    <div className="admin-storefront-mini-copy">
                      <span>{home.hero.kicker}</span>
                      <strong>{home.hero.titleLines.join(" ")}</strong>
                      <p>{home.hero.description}</p>
                    </div>

                    <div className="admin-storefront-mini-media">
                      <Image
                        alt={assets.heroAlt}
                        className="object-cover"
                        fill
                        sizes="(max-width: 1024px) 100vw, 260px"
                        src={assets.heroImage}
                      />
                    </div>
                  </div>

                  <div className="admin-storefront-mini-banner">
                    <Image
                      alt={assets.bannerAlt}
                      className="object-cover"
                      fill
                      sizes="(max-width: 1024px) 100vw, 520px"
                      src={assets.bannerImage}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-field read-only">
                <span>정책 문구</span>
                <strong>{brand.policyMessage}</strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="적용 범위">
            <div className="admin-list">
              {syncTargets.map((target) => (
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
