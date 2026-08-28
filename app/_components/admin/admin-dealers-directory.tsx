"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminTone } from "../../_lib/admin-data";
import { AdminDealerApplicationActions } from "./admin-dealer-application-actions";
import { AdminBadge, AdminPanel } from "./admin-ui";

export type AdminDealerApplicationListItem = {
  applicationId: number;
  applicantName: string;
  appliedAt: string;
  businessInfo: string;
  businessSummary: string;
  contact: string;
  dealerMallId: number | null;
  mallName: string;
  rejectReason: string;
  slug: string;
  status: string;
  statusLabel: string;
  statusTone: AdminTone;
};

export type AdminDealerListItem = {
  id: number;
  slug: string;
  domain: string;
  name: string;
  displayName: string;
  dealerCode: string;
  joinedAt: string;
  orderCount: string;
  memberCount: string;
  totalSales: string;
  status: string;
  tone: AdminTone;
  supportEmail: string;
  supportPhone: string;
};

type ApplicationFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type DealerFilter = "ALL" | "ACTIVE" | "INACTIVE";

const DEALER_PAGE_SIZE = 20;

function normalized(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function applicationStatusKey(status: string): Exclude<ApplicationFilter, "ALL"> {
  if (/^APPROVED$/i.test(status)) {
    return "APPROVED";
  }
  if (/^REJECTED$/i.test(status)) {
    return "REJECTED";
  }
  return "PENDING";
}

function isActiveDealer(status: string) {
  return /운영중|승인완료|ACTIVE|APPROVED/i.test(status);
}

function formatAdminDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return matched ? `${matched[1]}.${matched[2]}.${matched[3]} ${matched[4]}:${matched[5]}` : value;
}

function SearchBox({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-dealer-search-box">
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
      <input
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

function FilterChip({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`admin-dealer-filter-chip${active ? " is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <b>{count}</b>
    </button>
  );
}

function EmptyResult({ children }: { children: string }) {
  return (
    <div className="admin-dealer-directory-empty">
      <strong>조건에 맞는 항목이 없습니다.</strong>
      <p>{children}</p>
    </div>
  );
}

function ResultSummary({ page, total, unit }: { page: number; total: number; unit: "건" | "개" }) {
  const start = total ? (page - 1) * DEALER_PAGE_SIZE + 1 : 0;
  const end = Math.min(page * DEALER_PAGE_SIZE, total);

  return (
    <div className="admin-dealer-result-summary">
      <div>
        <span>검색 결과</span>
        <strong>{total}{unit}</strong>
        <small>{total ? `${start}-${end}${unit} 표시` : "표시할 항목 없음"}</small>
      </div>
      <span>페이지당 {DEALER_PAGE_SIZE}{unit}</span>
    </div>
  );
}

function Pagination({
  label,
  onChange,
  page,
  pageCount,
}: {
  label: string;
  onChange: (page: number) => void;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) {
    return null;
  }

  const startPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const endPage = Math.min(pageCount, startPage + 4);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <nav aria-label={label} className="admin-dealer-pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} type="button">
        이전
      </button>
      <div>
        {pages.map((pageNumber) => (
          <button
            aria-current={pageNumber === page ? "page" : undefined}
            className={pageNumber === page ? "is-active" : ""}
            key={pageNumber}
            onClick={() => onChange(pageNumber)}
            type="button"
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button disabled={page === pageCount} onClick={() => onChange(page + 1)} type="button">
        다음
      </button>
    </nav>
  );
}

function DealerApplicationAction({ application }: { application: AdminDealerApplicationListItem }) {
  return (
    <AdminDealerApplicationActions
      applicationId={application.applicationId}
      applicantName={application.applicantName}
      appliedAt={formatAdminDate(application.appliedAt)}
      businessInfo={application.businessInfo}
      contact={application.contact}
      dealerMallId={application.dealerMallId}
      mallName={application.mallName}
      rejectReason={application.rejectReason}
      slug={application.slug}
      status={application.status}
      statusLabel={application.statusLabel}
      statusTone={application.statusTone}
    />
  );
}

export function AdminDealerApplicationsBoard({
  items,
}: {
  items: AdminDealerApplicationListItem[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationFilter>("ALL");
  const [sort, setSort] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      ALL: items.length,
      PENDING: items.filter((item) => applicationStatusKey(item.status) === "PENDING").length,
      APPROVED: items.filter((item) => applicationStatusKey(item.status) === "APPROVED").length,
      REJECTED: items.filter((item) => applicationStatusKey(item.status) === "REJECTED").length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const keyword = normalized(query);
    const filtered = items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || applicationStatusKey(item.status) === statusFilter;
      const searchTarget = normalized(
        [item.applicantName, item.mallName, item.slug, item.contact, item.businessSummary, item.rejectReason].join(" "),
      );
      return matchesStatus && (!keyword || searchTarget.includes(keyword));
    });

    return [...filtered].sort((left, right) =>
      sort === "NEWEST"
        ? right.applicationId - left.applicationId
        : left.applicationId - right.applicationId,
    );
  }, [items, query, sort, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / DEALER_PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * DEALER_PAGE_SIZE, page * DEALER_PAGE_SIZE);

  return (
    <AdminPanel
      action={
        <span className="admin-dealer-panel-count">
          승인 대기 <strong>{counts.PENDING}</strong>건
        </span>
      }
      className="admin-dealer-directory-panel"
      description="접수된 신청을 검색하고 상태별로 모아본 뒤 상세 화면에서 승인 또는 반려할 수 있습니다."
      id="dealer-applications"
      title="딜러 신청 관리"
    >
      <div className="admin-dealer-directory-toolbar">
        <SearchBox
          label="딜러 신청 검색"
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="신청자, 딜러몰, 연락처 검색"
          value={query}
        />
        <div aria-label="신청 상태 필터" className="admin-dealer-filter-chips" role="group">
          <FilterChip active={statusFilter === "ALL"} count={counts.ALL} label="전체" onClick={() => { setStatusFilter("ALL"); setPage(1); }} />
          <FilterChip active={statusFilter === "PENDING"} count={counts.PENDING} label="승인 대기" onClick={() => { setStatusFilter("PENDING"); setPage(1); }} />
          <FilterChip active={statusFilter === "APPROVED"} count={counts.APPROVED} label="승인 완료" onClick={() => { setStatusFilter("APPROVED"); setPage(1); }} />
          <FilterChip active={statusFilter === "REJECTED"} count={counts.REJECTED} label="반려" onClick={() => { setStatusFilter("REJECTED"); setPage(1); }} />
        </div>
        <select
          aria-label="딜러 신청 정렬"
          className="admin-dealer-directory-sort"
          onChange={(event) => {
            setSort(event.target.value as "NEWEST" | "OLDEST");
            setPage(1);
          }}
          value={sort}
        >
          <option value="NEWEST">최근 신청순</option>
          <option value="OLDEST">오래된 신청순</option>
        </select>
      </div>

      <ResultSummary page={page} total={filteredItems.length} unit="건" />

      {filteredItems.length ? (
        <>
          <div className="admin-dealer-table-wrap">
            <table className="admin-dealer-table is-applications">
              <thead>
                <tr>
                  <th>딜러몰·상태</th>
                  <th>희망 주소</th>
                  <th>신청자</th>
                  <th>연락처</th>
                  <th>신청일</th>
                  <th className="is-action">처리</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((application) => (
                  <tr
                    className={`is-${applicationStatusKey(application.status).toLocaleLowerCase()}`}
                    key={application.applicationId}
                  >
                    <td>
                      <div className="admin-dealer-table-identity">
                        <strong>{application.mallName}</strong>
                        <AdminBadge tone={application.statusTone}>{application.statusLabel}</AdminBadge>
                      </div>
                    </td>
                    <td title={`${application.slug}.everybuy.co.kr`}>
                      <strong className="admin-dealer-table-domain">{application.slug}.everybuy.co.kr</strong>
                    </td>
                    <td>{application.applicantName}</td>
                    <td title={application.contact}>{application.contact}</td>
                    <td>{formatAdminDate(application.appliedAt)}</td>
                    <td className="is-action"><DealerApplicationAction application={application} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-dealer-mobile-list admin-dealer-application-list" role="list">
          {pagedItems.map((application) => (
            <article
              className={`admin-dealer-application-card is-${applicationStatusKey(application.status).toLocaleLowerCase()}`}
              key={application.applicationId}
              role="listitem"
            >
              <div className="admin-dealer-application-main">
                <div className="admin-dealer-card-title-row">
                  <strong>{application.mallName}</strong>
                  <AdminBadge tone={application.statusTone}>{application.statusLabel}</AdminBadge>
                </div>
                <span className="admin-dealer-domain-text">{application.slug}.everybuy.co.kr</span>
                <p title={application.businessSummary}>{application.businessSummary}</p>
                {application.rejectReason ? (
                  <div className="admin-dealer-reject-summary">반려 사유: {application.rejectReason}</div>
                ) : null}
              </div>

              <dl className="admin-dealer-application-meta">
                <div>
                  <dt>신청자</dt>
                  <dd>{application.applicantName}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd title={application.contact}>{application.contact}</dd>
                </div>
                <div>
                  <dt>신청일</dt>
                  <dd>{formatAdminDate(application.appliedAt)}</dd>
                </div>
              </dl>

              <div className="admin-dealer-card-actions">
                <DealerApplicationAction application={application} />
              </div>
            </article>
          ))}
          </div>

          <Pagination
            label="딜러 신청 목록 페이지 이동"
            onChange={setPage}
            page={page}
            pageCount={pageCount}
          />
        </>
      ) : (
        <EmptyResult>검색어 또는 신청 상태를 변경해보세요.</EmptyResult>
      )}
    </AdminPanel>
  );
}

export function AdminDealerMallsBoard({ items }: { items: AdminDealerListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DealerFilter>("ALL");
  const [sort, setSort] = useState<"RECENT" | "NAME">("RECENT");
  const [page, setPage] = useState(1);

  const activeCount = useMemo(() => items.filter((item) => isActiveDealer(item.status)).length, [items]);
  const counts = {
    ALL: items.length,
    ACTIVE: activeCount,
    INACTIVE: items.length - activeCount,
  };

  const filteredItems = useMemo(() => {
    const keyword = normalized(query);
    const filtered = items.filter((item) => {
      const active = isActiveDealer(item.status);
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? active : !active);
      const searchTarget = normalized(
        [item.name, item.displayName, item.domain, item.supportEmail, item.supportPhone, item.dealerCode].join(" "),
      );
      return matchesStatus && (!keyword || searchTarget.includes(keyword));
    });

    return [...filtered].sort((left, right) =>
      sort === "NAME" ? left.name.localeCompare(right.name, "ko-KR") : right.id - left.id,
    );
  }, [items, query, sort, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / DEALER_PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * DEALER_PAGE_SIZE, page * DEALER_PAGE_SIZE);

  return (
    <AdminPanel
      action={<span className="admin-dealer-panel-count">운영 중 <strong>{activeCount}</strong>개</span>}
      className="admin-dealer-directory-panel"
      description="딜러몰을 검색해 운영 상태와 주요 지표를 확인하고, 필요한 몰만 상세 관리 화면으로 여세요."
      id="dealer-malls"
      title="운영 딜러몰"
    >
      <div className="admin-dealer-directory-toolbar">
        <SearchBox
          label="운영 딜러몰 검색"
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="딜러몰, 도메인, 계정, 연락처 검색"
          value={query}
        />
        <div aria-label="딜러몰 상태 필터" className="admin-dealer-filter-chips" role="group">
          <FilterChip active={statusFilter === "ALL"} count={counts.ALL} label="전체" onClick={() => { setStatusFilter("ALL"); setPage(1); }} />
          <FilterChip active={statusFilter === "ACTIVE"} count={counts.ACTIVE} label="운영 중" onClick={() => { setStatusFilter("ACTIVE"); setPage(1); }} />
          <FilterChip active={statusFilter === "INACTIVE"} count={counts.INACTIVE} label="운영 중지" onClick={() => { setStatusFilter("INACTIVE"); setPage(1); }} />
        </div>
        <select
          aria-label="딜러몰 정렬"
          className="admin-dealer-directory-sort"
          onChange={(event) => {
            setSort(event.target.value as "RECENT" | "NAME");
            setPage(1);
          }}
          value={sort}
        >
          <option value="RECENT">최근 개설순</option>
          <option value="NAME">이름순</option>
        </select>
      </div>

      <ResultSummary page={page} total={filteredItems.length} unit="개" />

      {filteredItems.length ? (
        <>
          <div className="admin-dealer-table-wrap">
            <table className="admin-dealer-table is-malls">
              <thead>
                <tr>
                  <th>딜러몰·상태</th>
                  <th>도메인</th>
                  <th>관리 계정</th>
                  <th>연락처</th>
                  <th>개설일</th>
                  <th className="is-number">회원</th>
                  <th className="is-number">주문</th>
                  <th className="is-number">판매</th>
                  <th className="is-action">관리</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((dealer) => (
                  <tr key={dealer.id}>
                    <td>
                      <div className="admin-dealer-table-identity">
                        <strong>{dealer.name}</strong>
                        <AdminBadge tone={dealer.tone}>{dealer.status}</AdminBadge>
                      </div>
                    </td>
                    <td title={dealer.domain}>
                      <a className="admin-dealer-table-domain" href={`https://${dealer.domain}`} rel="noreferrer" target="_blank">
                        {dealer.domain}
                      </a>
                    </td>
                    <td title={dealer.supportEmail || "-"}>{dealer.supportEmail || "-"}</td>
                    <td>{dealer.supportPhone || "-"}</td>
                    <td>{formatAdminDate(dealer.joinedAt)}</td>
                    <td className="is-number">{dealer.memberCount}</td>
                    <td className="is-number">{dealer.orderCount}</td>
                    <td className="is-number"><strong>{dealer.totalSales}</strong></td>
                    <td className="is-action">
                      <Link className="admin-button small" href={`/admin/dealers?dealerMallId=${dealer.id}#dealer-detail`}>
                        상세 관리
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-dealer-mobile-list admin-dealer-mall-list" role="list">
          {pagedItems.map((dealer) => (
            <article className="admin-dealer-mall-card" key={dealer.id} role="listitem">
              <div aria-hidden="true" className="admin-dealer-mall-mark">
                {dealer.name.slice(0, 1)}
              </div>
              <div className="admin-dealer-mall-main">
                <div className="admin-dealer-card-title-row">
                  <strong>{dealer.name}</strong>
                  <AdminBadge tone={dealer.tone}>{dealer.status}</AdminBadge>
                </div>
                <a href={`https://${dealer.domain}`} rel="noreferrer" target="_blank">
                  {dealer.domain}
                </a>
                <p>{dealer.displayName || dealer.name} · {dealer.dealerCode}</p>
              </div>

              <dl className="admin-dealer-mall-contact">
                <div>
                  <dt>관리 계정</dt>
                  <dd title={dealer.supportEmail || "-"}>{dealer.supportEmail || "-"}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd>{dealer.supportPhone || "-"}</dd>
                </div>
                <div>
                  <dt>개설일</dt>
                  <dd>{formatAdminDate(dealer.joinedAt)}</dd>
                </div>
              </dl>

              <div className="admin-dealer-mall-metrics" aria-label="딜러몰 운영 지표">
                <span>회원 <strong>{dealer.memberCount}</strong></span>
                <span>주문 <strong>{dealer.orderCount}</strong></span>
                <span>판매 <strong>{dealer.totalSales}</strong></span>
              </div>

              <div className="admin-dealer-card-actions is-mall">
                <a className="admin-button secondary small" href={`https://${dealer.domain}`} rel="noreferrer" target="_blank">
                  사이트 열기
                </a>
                <Link className="admin-button small" href={`/admin/dealers?dealerMallId=${dealer.id}#dealer-detail`}>
                  상세 관리
                </Link>
              </div>
            </article>
          ))}
          </div>

          <Pagination
            label="운영 딜러몰 목록 페이지 이동"
            onChange={setPage}
            page={page}
            pageCount={pageCount}
          />
        </>
      ) : (
        <EmptyResult>검색어 또는 운영 상태를 변경해보세요.</EmptyResult>
      )}
    </AdminPanel>
  );
}
