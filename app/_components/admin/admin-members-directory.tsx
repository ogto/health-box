"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AdminTone } from "../../_lib/admin-data";
import { AdminMemberApprovalActions } from "./admin-member-approval-actions";
import { AdminBadge, AdminPanel } from "./admin-ui";

export type AdminMemberApplicationListItem = {
  applicationId: number;
  approvedAt: string;
  birthDate: string;
  consentVersion: string;
  dealerMallId: number;
  dealerName: string;
  email: string;
  marketingConsent: string;
  memberName: string;
  phone: string;
  rejectReason: string;
  status: string;
  statusLabel: string;
  statusTone: AdminTone;
  submittedAt: string;
};

export type AdminMemberListItem = {
  birthDate: string;
  consentVersion: string;
  dealer: string;
  dealerId: number;
  email: string;
  id: number | null;
  joinedAt: string;
  marketingConsent: string;
  name: string;
  orders: string;
  organization: string;
  phone: string;
  privacyAgreedAt: string;
  purchases: string;
  status: string;
  statusKey: "ACTIVE" | "INACTIVE";
  statusTone: AdminTone;
  termsAgreedAt: string;
  thirdPartyAgreedAt: string;
};

export type AdminMemberDealerOption = {
  id: number;
  name: string;
};

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
type MemberFilter = "ALL" | "ACTIVE" | "INACTIVE";
type DealerFilter = "ALL" | number;

const MEMBER_PAGE_SIZE = 20;

function normalized(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function applicationStatusKey(status: string): ApplicationStatus {
  if (/^APPROVED$/i.test(status)) {
    return "APPROVED";
  }
  if (/^REJECTED$/i.test(status)) {
    return "REJECTED";
  }
  return "PENDING";
}

function formatAdminDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return matched ? `${matched[1]}.${matched[2]}.${matched[3]} ${matched[4]}:${matched[5]}` : value;
}

function numericValue(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function SearchBox({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
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

function MemberScopePicker({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: AdminMemberDealerOption[];
  value: DealerFilter;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedName =
    value === "ALL" ? "전체 회원" : options.find((option) => option.id === value)?.name || "조회 범위 선택";
  const filteredOptions = useMemo(() => {
    const keyword = normalized(query);
    const items = [{ id: "ALL" as const, name: "전체 회원" }, ...options];
    return items.filter((option) => !keyword || normalized(option.name).includes(keyword));
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function selectScope(nextValue: "ALL" | number) {
    onChange(String(nextValue));
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="admin-member-scope-picker" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="admin-member-scope-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedName}</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <div className="admin-member-scope-popover">
          <label className="admin-member-scope-search">
            <span className="sr-only">조회 범위 검색</span>
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
            <input
              aria-label="조회 범위 검색"
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              placeholder="본사몰 또는 딜러몰 검색"
              type="search"
              value={query}
            />
          </label>
          <div aria-label="회원 조회 범위" className="admin-member-scope-options" role="listbox">
            {filteredOptions.map((option) => {
              const selected = option.id === value;
              return (
                <button
                  aria-selected={selected}
                  className={selected ? "is-selected" : ""}
                  key={option.id}
                  onClick={() => selectScope(option.id)}
                  role="option"
                  type="button"
                >
                  <span>{option.name}</span>
                  {selected ? <b>선택됨</b> : null}
                </button>
              );
            })}
            {!filteredOptions.length ? <p>검색 결과가 없습니다.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyResult({ children }: { children: string }) {
  return (
    <div className="admin-dealer-directory-empty">
      <strong>조건에 맞는 회원이 없습니다.</strong>
      <p>{children}</p>
    </div>
  );
}

function ResultSummary({ page, total }: { page: number; total: number }) {
  const start = total ? (page - 1) * MEMBER_PAGE_SIZE + 1 : 0;
  const end = Math.min(page * MEMBER_PAGE_SIZE, total);

  return (
    <div className="admin-member-result-summary">
      <div>
        <span>검색 결과</span>
        <strong>{total}명</strong>
        <small>{total ? `${start}-${end}명 표시` : "표시할 회원 없음"}</small>
      </div>
      <span>페이지당 {MEMBER_PAGE_SIZE}명</span>
    </div>
  );
}

function Pagination({
  onChange,
  page,
  pageCount,
}: {
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
    <nav aria-label="회원 목록 페이지 이동" className="admin-member-pagination">
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

function AdminMemberDetailsButton({ member }: { member: AdminMemberListItem }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button className="admin-button secondary small" onClick={() => setOpen(true)} type="button">
        상세 보기
      </button>

      {typeof document !== "undefined" && open
        ? createPortal(
            <div className="admin-info-dialog-layer" role="presentation">
              <button
                aria-label="회원 상세 닫기"
                className="admin-info-dialog-backdrop"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div
                aria-labelledby={titleId}
                aria-modal="true"
                className="admin-info-dialog admin-member-detail-dialog"
                role="dialog"
              >
                <div className="admin-info-dialog-head">
                  <div className="admin-info-dialog-copy">
                    <div className="admin-member-dialog-title">
                      <strong id={titleId}>{member.name} 회원 정보</strong>
                      <AdminBadge tone={member.statusTone}>{member.status}</AdminBadge>
                    </div>
                    <p>회원의 가입 경로와 연락처, 이용 현황을 한 번에 확인할 수 있습니다.</p>
                  </div>
                  <button
                    aria-label="회원 상세 닫기"
                    className="admin-info-dialog-close"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <svg fill="none" viewBox="0 0 24 24">
                      <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
                    </svg>
                  </button>
                </div>

                <div className="admin-info-dialog-body admin-member-detail-body">
                  <div className="admin-member-detail-summary">
                    <div>
                      <span>가입 경로</span>
                      <strong>{member.dealer}</strong>
                    </div>
                    <div>
                      <span>가입일</span>
                      <strong>{formatAdminDate(member.joinedAt)}</strong>
                    </div>
                    <div>
                      <span>주문</span>
                      <strong>{member.orders}</strong>
                    </div>
                    <div>
                      <span>누적 구매</span>
                      <strong>{member.purchases}</strong>
                    </div>
                  </div>

                  <section className="admin-member-detail-section">
                    <h3>기본 정보</h3>
                    <dl className="admin-member-detail-grid">
                      <div><dt>회원 번호</dt><dd>{member.id ?? "-"}</dd></div>
                      <div><dt>휴대폰 번호</dt><dd>{member.phone}</dd></div>
                      <div><dt>이메일</dt><dd>{member.email}</dd></div>
                      <div><dt>생년월일</dt><dd>{member.birthDate}</dd></div>
                      <div><dt>소속</dt><dd>{member.organization}</dd></div>
                      <div><dt>마케팅 수신</dt><dd>{member.marketingConsent}</dd></div>
                    </dl>
                  </section>

                  <section className="admin-member-detail-section">
                    <h3>약관 동의 기록</h3>
                    <dl className="admin-member-detail-grid">
                      <div><dt>이용약관</dt><dd>{formatAdminDate(member.termsAgreedAt)}</dd></div>
                      <div><dt>개인정보 수집·이용</dt><dd>{formatAdminDate(member.privacyAgreedAt)}</dd></div>
                      <div><dt>개인정보 제3자 제공</dt><dd>{formatAdminDate(member.thirdPartyAgreedAt)}</dd></div>
                      <div><dt>동의 문서 버전</dt><dd>{member.consentVersion}</dd></div>
                    </dl>
                  </section>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MemberApplicationAction({
  actionsEnabled,
  application,
  returnPath,
}: {
  actionsEnabled: boolean;
  application: AdminMemberApplicationListItem;
  returnPath: string;
}) {
  if (!actionsEnabled) {
    return <span className="admin-row-muted">{application.statusLabel}</span>;
  }

  return (
    <AdminMemberApprovalActions
      applicationId={application.applicationId}
      approvedAt={formatAdminDate(application.approvedAt)}
      birthDate={application.birthDate}
      consentVersion={application.consentVersion}
      dealerName={application.dealerName}
      email={application.email}
      marketingConsent={application.marketingConsent}
      memberName={application.memberName}
      phone={application.phone}
      rejectReason={application.rejectReason}
      returnPath={returnPath}
      status={application.status}
      statusLabel={application.statusLabel}
      statusTone={application.statusTone}
      submittedAt={formatAdminDate(application.submittedAt)}
    />
  );
}

function AdminMemberApplicationsBoard({
  actionsEnabled,
  dealerFilter,
  items,
}: {
  actionsEnabled: boolean;
  dealerFilter: DealerFilter;
  items: AdminMemberApplicationListItem[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [page, setPage] = useState(1);

  const scopedItems = useMemo(
    () => items.filter((item) =>
      applicationStatusKey(item.status) === "PENDING"
        && (dealerFilter === "ALL" || item.dealerMallId === dealerFilter)
    ),
    [dealerFilter, items],
  );
  const filteredItems = useMemo(() => {
    const keyword = normalized(query);
    const filtered = scopedItems.filter((item) => {
      const searchTarget = normalized(
        [item.memberName, item.dealerName, item.phone, item.email, item.rejectReason].join(" "),
      );
      return !keyword || searchTarget.includes(keyword);
    });

    return [...filtered].sort((left, right) =>
      sort === "NEWEST"
        ? right.applicationId - left.applicationId
        : left.applicationId - right.applicationId,
    );
  }, [query, scopedItems, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / MEMBER_PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * MEMBER_PAGE_SIZE, page * MEMBER_PAGE_SIZE);
  const returnPath =
    dealerFilter === "ALL"
      ? "/admin/members#member-applications"
      : `/admin/members?dealerMallId=${dealerFilter}#member-applications`;

  return (
    <AdminPanel
      action={<span className="admin-dealer-panel-count">처리 대기 <strong>{scopedItems.length}</strong>건</span>}
      className="admin-dealer-directory-panel"
      description="가입 완료 회원은 아래 목록에서 확인하며, 이곳에는 아직 처리되지 않은 요청만 표시합니다."
      id="member-applications"
      title="회원가입 요청"
    >
      <div className="admin-dealer-directory-toolbar">
        <SearchBox
          label="회원 신청 검색"
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="이름, 가입 경로, 연락처 검색"
          value={query}
        />
        <div aria-label="회원 신청 상태 필터" className="admin-dealer-filter-chips" role="group">
          <FilterChip active count={scopedItems.length} label="처리 대기" onClick={() => setPage(1)} />
        </div>
        <select
          aria-label="회원 신청 정렬"
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

      <ResultSummary page={page} total={filteredItems.length} />

      {filteredItems.length ? (
        <>
          <div className="admin-member-table-wrap">
            <table className="admin-member-table">
              <thead>
                <tr>
                  <th>회원·상태</th>
                  <th>가입 경로</th>
                  <th>휴대폰 번호</th>
                  <th>이메일</th>
                  <th>요청일</th>
                  <th className="is-action">상태</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((application) => (
                  <tr
                    className={`is-${applicationStatusKey(application.status).toLocaleLowerCase()}`}
                    key={application.applicationId}
                  >
                    <td>
                      <div className="admin-member-table-identity">
                        <strong>{application.memberName}</strong>
                        <AdminBadge tone={application.statusTone}>{application.statusLabel}</AdminBadge>
                      </div>
                    </td>
                    <td><strong className="admin-member-table-route">{application.dealerName}</strong></td>
                    <td>{application.phone}</td>
                    <td title={application.email}>{application.email}</td>
                    <td>{formatAdminDate(application.submittedAt)}</td>
                    <td className="is-action">
                      <MemberApplicationAction
                        actionsEnabled={actionsEnabled}
                        application={application}
                        returnPath={returnPath}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-member-mobile-list" role="list">
            {pagedItems.map((application) => (
              <article
                className={`admin-member-application-card is-${applicationStatusKey(application.status).toLocaleLowerCase()}`}
                key={application.applicationId}
                role="listitem"
              >
                <div className="admin-member-card-main">
                  <div className="admin-dealer-card-title-row">
                    <strong>{application.memberName}</strong>
                    <AdminBadge tone={application.statusTone}>{application.statusLabel}</AdminBadge>
                  </div>
                  <span className="admin-member-card-route">{application.dealerName}</span>
                  {application.rejectReason ? <p className="admin-member-reject-summary">반려 사유: {application.rejectReason}</p> : null}
                </div>

                <dl className="admin-member-card-contact">
                  <div><dt>휴대폰 번호</dt><dd title={application.phone}>{application.phone}</dd></div>
                  <div><dt>이메일</dt><dd title={application.email}>{application.email}</dd></div>
                  <div><dt>요청일</dt><dd>{formatAdminDate(application.submittedAt)}</dd></div>
                </dl>

                <div className="admin-member-card-actions">
                  <MemberApplicationAction
                    actionsEnabled={actionsEnabled}
                    application={application}
                    returnPath={returnPath}
                  />
                </div>
              </article>
            ))}
          </div>

          <Pagination onChange={setPage} page={page} pageCount={pageCount} />
        </>
      ) : <EmptyResult>조건에 맞는 처리 대기 회원가입 요청이 없습니다.</EmptyResult>}
    </AdminPanel>
  );
}

function AdminMembersBoard({ dealerFilter, items }: { dealerFilter: DealerFilter; items: AdminMemberListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberFilter>("ALL");
  const [sort, setSort] = useState<"RECENT" | "NAME" | "PURCHASES">("RECENT");
  const [page, setPage] = useState(1);

  const scopedItems = useMemo(
    () => items.filter((item) => dealerFilter === "ALL" || item.dealerId === dealerFilter),
    [dealerFilter, items],
  );
  const activeCount = useMemo(() => scopedItems.filter((item) => item.statusKey === "ACTIVE").length, [scopedItems]);
  const counts = { ALL: scopedItems.length, ACTIVE: activeCount, INACTIVE: scopedItems.length - activeCount };
  const filteredItems = useMemo(() => {
    const keyword = normalized(query);
    const filtered = scopedItems.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.statusKey === statusFilter;
      const searchTarget = normalized([item.name, item.phone, item.email, item.dealer, item.organization].join(" "));
      return matchesStatus && (!keyword || searchTarget.includes(keyword));
    });

    return [...filtered].sort((left, right) => {
      if (sort === "NAME") {
        return left.name.localeCompare(right.name, "ko-KR");
      }
      if (sort === "PURCHASES") {
        return numericValue(right.purchases) - numericValue(left.purchases);
      }
      return (right.id ?? 0) - (left.id ?? 0);
    });
  }, [query, scopedItems, sort, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / MEMBER_PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * MEMBER_PAGE_SIZE, page * MEMBER_PAGE_SIZE);

  return (
    <AdminPanel
      action={<span className="admin-dealer-panel-count">활성 회원 <strong>{activeCount}</strong>명</span>}
      className="admin-dealer-directory-panel"
      description="회원과 연락처, 가입 경로, 구매 현황을 빠르게 찾고 상세 정보까지 확인할 수 있습니다."
      id="member-directory"
      title="가입 회원 목록"
    >
      <div className="admin-dealer-directory-toolbar">
        <SearchBox
          label="가입 회원 검색"
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="이름, 연락처, 가입 경로 검색"
          value={query}
        />
        <div aria-label="회원 상태 필터" className="admin-dealer-filter-chips" role="group">
          <FilterChip active={statusFilter === "ALL"} count={counts.ALL} label="전체" onClick={() => { setStatusFilter("ALL"); setPage(1); }} />
          <FilterChip active={statusFilter === "ACTIVE"} count={counts.ACTIVE} label="활성" onClick={() => { setStatusFilter("ACTIVE"); setPage(1); }} />
          <FilterChip active={statusFilter === "INACTIVE"} count={counts.INACTIVE} label="비활성·기타" onClick={() => { setStatusFilter("INACTIVE"); setPage(1); }} />
        </div>
        <select
          aria-label="가입 회원 정렬"
          className="admin-dealer-directory-sort"
          onChange={(event) => {
            setSort(event.target.value as "RECENT" | "NAME" | "PURCHASES");
            setPage(1);
          }}
          value={sort}
        >
          <option value="RECENT">최근 가입순</option>
          <option value="NAME">이름순</option>
          <option value="PURCHASES">누적 구매순</option>
        </select>
      </div>

      <ResultSummary page={page} total={filteredItems.length} />

      {filteredItems.length ? (
        <>
          <div className="admin-member-table-wrap">
            <table className="admin-member-table is-members">
              <thead>
                <tr>
                  <th>회원·상태</th>
                  <th>가입 경로</th>
                  <th>휴대폰 번호</th>
                  <th>이메일</th>
                  <th>가입일</th>
                  <th className="is-number">주문</th>
                  <th className="is-number">누적 구매</th>
                  <th className="is-action">상세</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((member, index) => (
                  <tr key={member.id ?? `${member.name}-${index}`}>
                    <td>
                      <div className="admin-member-table-identity">
                        <strong>{member.name}</strong>
                        <AdminBadge tone={member.statusTone}>{member.status}</AdminBadge>
                      </div>
                    </td>
                    <td><strong className="admin-member-table-route">{member.dealer}</strong></td>
                    <td>{member.phone}</td>
                    <td title={member.email}>{member.email}</td>
                    <td>{formatAdminDate(member.joinedAt)}</td>
                    <td className="is-number">{member.orders}</td>
                    <td className="is-number"><strong>{member.purchases}</strong></td>
                    <td className="is-action"><AdminMemberDetailsButton member={member} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-member-mobile-list" role="list">
            {pagedItems.map((member, index) => (
              <article className="admin-member-card" key={member.id ?? `${member.name}-${index}`} role="listitem">
                <div aria-hidden="true" className="admin-member-card-mark">{member.name.slice(0, 1)}</div>
                <div className="admin-member-card-main">
                  <div className="admin-dealer-card-title-row">
                    <strong>{member.name}</strong>
                    <AdminBadge tone={member.statusTone}>{member.status}</AdminBadge>
                  </div>
                  <span className="admin-member-card-route">{member.dealer}</span>
                  {member.organization !== "-" ? <p>{member.organization}</p> : null}
                </div>

                <dl className="admin-member-card-contact">
                  <div><dt>휴대폰 번호</dt><dd title={member.phone}>{member.phone}</dd></div>
                  <div><dt>이메일</dt><dd title={member.email}>{member.email}</dd></div>
                  <div><dt>가입일</dt><dd>{formatAdminDate(member.joinedAt)}</dd></div>
                </dl>

                <div className="admin-member-card-metrics" aria-label="회원 구매 현황">
                  <span>주문 <strong>{member.orders}</strong></span>
                  <span>누적 구매 <strong>{member.purchases}</strong></span>
                </div>
                <div className="admin-member-card-actions"><AdminMemberDetailsButton member={member} /></div>
              </article>
            ))}
          </div>

          <Pagination onChange={setPage} page={page} pageCount={pageCount} />
        </>
      ) : <EmptyResult>검색어, 조회 범위 또는 회원 상태를 변경해보세요.</EmptyResult>}
    </AdminPanel>
  );
}

export function AdminMembersDirectory({
  actionsEnabled,
  applications,
  dealerOptions,
  initialDealerId,
  members,
}: {
  actionsEnabled: boolean;
  applications: AdminMemberApplicationListItem[];
  dealerOptions: AdminMemberDealerOption[];
  initialDealerId: number | null;
  members: AdminMemberListItem[];
}) {
  const [dealerFilter, setDealerFilter] = useState<DealerFilter>(initialDealerId ?? "ALL");
  const selectedDealerName =
    dealerFilter === "ALL"
      ? "전체 회원"
      : dealerOptions.find((dealer) => dealer.id === dealerFilter)?.name || "선택한 가입 경로";

  function changeDealerFilter(value: string) {
    const nextFilter: DealerFilter = value === "ALL" ? "ALL" : Number(value);
    setDealerFilter(nextFilter);

    const url = new URL(window.location.href);
    if (nextFilter === "ALL") {
      url.searchParams.delete("dealerMallId");
    } else {
      url.searchParams.set("dealerMallId", String(nextFilter));
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  return (
    <div className="admin-member-directory-stack">
      <div className="admin-member-scope-bar">
        <div>
          <span>조회 범위</span>
          <strong>{selectedDealerName}</strong>
          <p>선택한 범위가 회원가입 요청과 가입 회원 목록에 함께 적용됩니다.</p>
        </div>
        <MemberScopePicker onChange={changeDealerFilter} options={dealerOptions} value={dealerFilter} />
      </div>

      <AdminMemberApplicationsBoard
        actionsEnabled={actionsEnabled}
        dealerFilter={dealerFilter}
        items={applications}
        key={`applications-${dealerFilter}`}
      />
      <AdminMembersBoard dealerFilter={dealerFilter} items={members} key={`members-${dealerFilter}`} />
    </div>
  );
}
