import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel } from "../../_components/admin/admin-ui";
import type { AdminMetric } from "../../_lib/admin-data";
import { settingsSections } from "../../_lib/admin-data";

const settingsMetrics: AdminMetric[] = [
  { label: "회원가 정책", value: "활성", hint: "비회원 가격 비노출 유지", tone: "blue" },
  { label: "상품 노출 기준", value: "운영중", hint: "메인/기획전 수동 관리", tone: "cyan" },
  { label: "조직 확장 설계", value: "준비", hint: "딜러 구조 후속 반영", tone: "green" },
  { label: "정산 단계", value: "1차", hint: "고정비율 시뮬레이션 우선", tone: "gold" },
];

export default function AdminSettingsPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="운영설정"
        description="건강창고 운영 정책과 확장 방향을 관리자 기준으로 정리한 설정 보드입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/admin/dashboard">
              대시보드로
            </Link>
            <Link className="admin-button" href="/admin/notices">
              공지 반영 보기
            </Link>
          </>
        }
      />

      <AdminMetrics items={settingsMetrics} />

      <div className="admin-grid-halves">
        {settingsSections.map((section, index) => (
          <AdminPanel
            description={section.description}
            key={section.title}
            kicker={`Setting 0${index + 1}`}
            title={section.title}
          >
            <div className="admin-pill-row">
              <AdminBadge tone={index === 0 ? "blue" : index === 1 ? "cyan" : index === 2 ? "green" : "gold"}>
                운영중
              </AdminBadge>
            </div>
            <ul className="admin-bullet-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AdminPanel>
        ))}
      </div>
    </div>
  );
}
