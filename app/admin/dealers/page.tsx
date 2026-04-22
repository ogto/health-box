import Link from "next/link";

import { AdminHeader } from "../../_components/admin/admin-header";
import { AdminBadge, AdminMetrics, AdminPanel, AdminTable } from "../../_components/admin/admin-ui";
import { dealerMetrics, dealerRows } from "../../_lib/admin-data";

const organizationFlow = [
  {
    title: "노타이틀 본사",
    description: "상위 운영 주체로 전체 쇼핑몰/딜러몰 구조를 통합 관리",
  },
  {
    title: "건강창고 본몰",
    description: "현재 운영중인 기본 쇼핑몰, 회원 승인과 상품 운영의 중심",
  },
  {
    title: "딜러몰",
    description: "하위 몰 단위로 회원/주문을 조회하는 확장 구조",
  },
] as const;

export default function AdminDealersPage() {
  return (
    <div className="admin-page">
      <AdminHeader
        title="딜러 / 조직관리"
        description="본사-건강창고-딜러몰 구조를 염두에 둔 중앙 통제형 운영 보드입니다."
        actions={
          <>
            <Link className="admin-button secondary" href="/admin/members">
              회원 권한 보기
            </Link>
            <Link className="admin-button" href="/admin/settlements">
              정산 구조 보기
            </Link>
          </>
        }
      />

      <AdminMetrics items={dealerMetrics} />

      <div className="admin-grid-side">
        <AdminPanel
          kicker="Organization"
          title="조직 목록"
          description="현재 운영중이거나 준비중인 조직 구조를 한눈에 보는 리스트입니다."
        >
          <AdminTable
            columns="minmax(0, 1.4fr) 110px minmax(120px, 1fr) 110px"
            headers={["조직명", "구분", "관리자 / 회원", "상태"]}
          >
            {dealerRows.map((dealer) => (
              <div className="admin-table-row" key={dealer.name}>
                <div className="admin-row-stack">
                  <strong>{dealer.name}</strong>
                  <p>{dealer.manager}</p>
                </div>
                <span className="admin-row-muted">{dealer.type}</span>
                <span className="admin-row-muted">{dealer.members}</span>
                <AdminBadge tone={dealer.tone}>{dealer.status}</AdminBadge>
              </div>
            ))}
          </AdminTable>
        </AdminPanel>

        <div className="admin-stack">
          <AdminPanel
            kicker="Expansion Notes"
            title="확장 메모"
            description="현재 설계 단계에서 유지해야 할 원칙입니다."
          >
            <ul className="admin-bullet-list">
              <li>상위 조직이 하위 몰을 관리하는 중앙 통제 구조를 유지합니다.</li>
              <li>딜러 관리자는 자신의 회원 목록과 주문 내역 위주로 먼저 제한합니다.</li>
              <li>물류/반품의 중앙 처리 구조는 추후 정책 확정 후 분리합니다.</li>
            </ul>
          </AdminPanel>

          <AdminPanel
            kicker="Permission Scope"
            title="현재 권한 범위"
            description="도입 초기에 필요한 최소 기능만 먼저 정의합니다."
          >
            <div className="admin-list">
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>본사 운영자</strong>
                  <p>전 조직, 전 회원, 전 주문, 전 공지 관리</p>
                </div>
                <AdminBadge tone="blue">전체 권한</AdminBadge>
              </div>
              <div className="admin-list-row">
                <div className="admin-row-stack">
                  <strong>딜러 관리자</strong>
                  <p>소속 몰 회원/주문 조회, 공지 확인, 정산 열람</p>
                </div>
                <AdminBadge tone="cyan">제한 권한</AdminBadge>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>

      <div className="admin-grid-halves">
        {organizationFlow.map((item) => (
          <AdminPanel
            className="admin-org-card"
            description={item.description}
            key={item.title}
            title={item.title}
          >
            <div className="admin-pill-row">
              <AdminBadge tone={item.title === "노타이틀 본사" ? "blue" : "green"}>
                {item.title === "딜러몰" ? "후속 확장" : "운영 축"}
              </AdminBadge>
            </div>
          </AdminPanel>
        ))}
      </div>
    </div>
  );
}
