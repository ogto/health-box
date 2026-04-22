import Image from "next/image";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminStorefrontActions } from "../../_components/admin/admin-storefront-actions";
import { AdminBadge, AdminMetrics, AdminPanel } from "../../_components/admin/admin-ui";
import type { AdminMetric } from "../../_lib/admin-data";
import { storefrontConfig } from "../../_lib/storefront-config";

const storefrontMetrics: AdminMetric[] = [
  {
    label: "공통 헤더 적용",
    value: "전 페이지",
    hint: "StoreShell 기반 공개 페이지에 공통 반영",
    tone: "blue",
  },
  {
    label: "공유 자산",
    value: "4개",
    hint: "로고, 히어로, 배너, 공유 썸네일 기준",
    tone: "cyan",
  },
  {
    label: "딜러몰 반영 범위",
    value: "공통",
    hint: "브랜드/검색/정책 문구를 함께 사용",
    tone: "green",
  },
  {
    label: "운영 방식",
    value: "중앙 관리",
    hint: "한 번 설정하면 전체 공개 화면 기준으로 사용",
    tone: "gold",
  },
];

const sectionToggles = [
  {
    title: "공통 헤더",
    detail: "로고, 검색창, 회원 정책 문구를 전 페이지에서 공통 사용",
    enabled: true,
  },
  {
    title: "메인 비주얼",
    detail: "홈 첫 화면 히어로 카피와 메인 이미지 노출",
    enabled: true,
  },
  {
    title: "중간 배너",
    detail: "기획전 또는 시즌 배너를 홈 중단에 배치",
    enabled: true,
  },
  {
    title: "공지/지원 영역",
    detail: "공지 목록과 고객센터 운영 정보를 함께 노출",
    enabled: true,
  },
] as const;

const syncRows = [
  {
    label: "헤더/브랜드",
    detail: "쇼핑몰 로고, 쇼핑몰명, 검색 문구, 회원 정책 문구",
    tone: "blue" as const,
  },
  {
    label: "메인 비주얼",
    detail: "히어로 카피, 메인 이미지, 프로모션 배너 이미지",
    tone: "cyan" as const,
  },
  {
    label: "공유 메타",
    detail: "기본 타이틀, 설명, 링크 공유용 썸네일",
    tone: "green" as const,
  },
] as const;

const operationNotes = [
  "이 화면에서 관리하는 값은 브랜드 공통값으로 보고, 쇼핑몰 메인과 StoreShell 기반 딜러몰 공개 페이지에 함께 연결합니다.",
  "딜러별 개별 로고/개별 메인 화면이 필요해지면, 이후에는 회원사 또는 딜러몰 단위 설정 테이블로 확장하는 방식이 자연스럽습니다.",
  "현재는 전역 설정 구조를 먼저 잡아둔 상태라서, 추후 저장 API와 DB만 붙이면 중앙 수정 방식으로 확장할 수 있습니다.",
] as const;

export default function AdminStorefrontPage() {
  const { assets, brand, home, metadata, syncTargets } = storefrontConfig;

  return (
    <div className="admin-page">
      <AdminHeader
        title="홈페이지관리"
        description="로고, 메인 썸네일, 메인 비주얼, 공통 배너, 메타 정보를 한 곳에서 관리하는 전역 홈페이지 보드입니다."
        actions={<AdminStorefrontActions />}
      />

      <AdminMetrics items={storefrontMetrics} />

      <div className="admin-form-layout admin-storefront-layout">
        <div className="admin-form-main">
          <AdminPanel
            kicker="Brand Settings"
            title="브랜드 기본 설정"
            description="여기서 잡은 브랜드 공통값은 헤더와 메타 영역에서 함께 사용되는 기준값입니다."
          >
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>쇼핑몰명</span>
                <input className="admin-input" defaultValue={brand.name} type="text" />
              </label>
              <label className="admin-field">
                <span>보조 문구</span>
                <input className="admin-input" defaultValue={brand.kicker} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>검색 placeholder</span>
                <input className="admin-input" defaultValue={brand.searchPlaceholder} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>회원 정책 문구</span>
                <input className="admin-input" defaultValue={brand.policyMessage} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>메타 타이틀</span>
                <input className="admin-input" defaultValue={metadata.title} type="text" />
              </label>
              <label className="admin-field span-two">
                <span>메타 설명</span>
                <textarea className="admin-textarea" defaultValue={metadata.description} />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Shared Assets"
            title="공통 자산 및 썸네일"
            description="홈페이지 썸네일과 로고, 메인 비주얼, 중간 배너처럼 자주 바꾸는 자산을 한 화면에서 정리합니다."
          >
            <div className="admin-storefront-asset-grid">
              <article className="admin-storefront-asset-card">
                <div className="admin-storefront-logo-preview">
                  <div className="brand-mark" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="admin-storefront-logo-copy">
                    <strong>{brand.name}</strong>
                    <p>{brand.kicker}</p>
                  </div>
                </div>
                <div className="admin-storefront-asset-copy">
                  <strong>헤더 로고</strong>
                  <p>현재는 심볼 마크 + 텍스트 조합으로 전 페이지에 공통 사용됩니다.</p>
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
                  <strong>메인 히어로 이미지</strong>
                  <p>홈 첫 화면과 공유용 대표 썸네일의 기준 이미지로도 사용 가능합니다.</p>
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
                  <strong>중간 프로모션 배너</strong>
                  <p>메인 중간 배너와 기획전 연결 화면에서 함께 보는 공용 자산입니다.</p>
                  <span>{assets.bannerImage}</span>
                </div>
              </article>

              <article className="admin-storefront-asset-card">
                <div className="admin-storefront-asset-thumb">
                  <Image
                    alt="공유용 메타 썸네일 미리보기"
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 280px"
                    src={assets.shareImage}
                  />
                </div>
                <div className="admin-storefront-asset-copy">
                  <strong>공유용 썸네일 / OG 이미지</strong>
                  <p>메신저, 링크 공유, 대표 썸네일 미리보기에 사용되는 전역 이미지입니다.</p>
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
                <span>파비콘 경로</span>
                <input className="admin-input" defaultValue={assets.faviconPath} type="text" />
              </label>
              <label className="admin-field">
                <span>메인 비주얼 이미지 경로</span>
                <input className="admin-input" defaultValue={assets.heroImage} type="text" />
              </label>
              <label className="admin-field">
                <span>중간 배너 이미지 경로</span>
                <input className="admin-input" defaultValue={assets.bannerImage} type="text" />
              </label>
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Homepage Sections"
            title="메인 노출 구성"
            description="메인 화면에서 공통으로 운영할 섹션 구성과 노출 여부를 한 번에 확인합니다."
          >
            <div className="admin-toggle-grid">
              {sectionToggles.map((item) => (
                <div className="admin-toggle-card" key={item.title}>
                  <div className="admin-row-stack">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
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
          <AdminPanel
            kicker="Preview"
            title="현재 홈페이지 미리보기"
            description="실제 딜러몰 메인 무드를 축소해서 보는 프리뷰입니다."
          >
            <div className="admin-storefront-preview-card">
              <div className="admin-storefront-mini-shell">
                <div className="admin-storefront-mini-header">
                  <div className="admin-storefront-mini-brand">
                    <div className="brand-mark" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
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
                <span>공통 정책 문구</span>
                <strong>{brand.policyMessage}</strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Sync Scope"
            title="딜러몰 반영 범위"
            description="이 설정을 저장했을 때 함께 영향을 받는 공개 화면 범위입니다."
          >
            <div className="admin-list">
              {syncRows.map((item) => (
                <div className="admin-list-row" key={item.label}>
                  <div className="admin-row-stack">
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <div className="admin-list-meta">
                    <AdminBadge tone={item.tone}>공통 반영</AdminBadge>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-pill-row">
              {syncTargets.map((target) => (
                <span className="detail-chip" key={target}>
                  {target}
                </span>
              ))}
            </div>
          </AdminPanel>

          <AdminPanel
            kicker="Operation Note"
            title="운영 메모"
            description="향후 저장 기능과 딜러별 개별화까지 이어질 때 기준이 되는 메모입니다."
          >
            <ul className="admin-bullet-list">
              {operationNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
