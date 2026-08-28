"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { saveAdminStaffAction } from "../../_actions/health-box-admin";
import {
  ADMIN_PERMISSION_GROUPS,
  ALL_ADMIN_PERMISSION_CODES,
  DEALER_ADMIN_PERMISSION_CODES,
} from "../../_lib/admin-staff-permissions";
import { AdminBadge, AdminPanel } from "./admin-ui";

export type AdminStaffDealerOption = {
  id: number;
  name: string;
};

export type AdminStaffListItem = {
  id: number;
  dealerMallId: number | null;
  email: string;
  joinedAt: string;
  lastLoginAt: string;
  loginId: string;
  memo: string;
  name: string;
  permissionCodes: string[];
  phone: string;
  positionName: string;
  roleType: "OWNER" | "STAFF";
  scopeName: string;
  scopeType: "HQ" | "DEALER";
  status: "ACTIVE" | "INACTIVE";
};

export type AdminAuditLogListItem = {
  actionCode: string;
  actionLabel: string;
  actorName: string;
  actorScope: string;
  createdAt: string;
  detailText: string;
  id: number;
  resultStatus: string;
  targetId: string;
  targetLabel: string;
};

const PAGE_SIZE = 20;
const ALL_PERMISSION_CODE_SET = new Set<string>(ALL_ADMIN_PERMISSION_CODES);
const DEALER_PERMISSION_CODE_SET = new Set<string>(DEALER_ADMIN_PERMISSION_CODES);

function normalized(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function formatAdminDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return matched ? `${matched[1]}.${matched[2]}.${matched[3]} ${matched[4]}:${matched[5]}` : value || "-";
}

function ResultSummary({ page, total, unit }: { page: number; total: number; unit: string }) {
  const start = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="admin-staff-result-summary">
      <div>
        <span>검색 결과</span>
        <strong>{total}{unit}</strong>
        <small>{total ? `${start}-${end}${unit} 표시` : "표시할 항목 없음"}</small>
      </div>
      <span>페이지당 {PAGE_SIZE}{unit}</span>
    </div>
  );
}

function Pagination({ label, onChange, page, pageCount }: { label: string; onChange: (page: number) => void; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const startPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const endPage = Math.min(pageCount, startPage + 4);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  return (
    <nav aria-label={label} className="admin-staff-pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} type="button">이전</button>
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
      <button disabled={page === pageCount} onClick={() => onChange(page + 1)} type="button">다음</button>
    </nav>
  );
}

function SearchBox({ label, onChange, placeholder, value }: { label: string; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <label className="admin-dealer-search-box">
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
      <input aria-label={label} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" value={value} />
    </label>
  );
}

function StaffEditorDialog({
  dealers,
  lockedScope,
  onClose,
  staff,
}: {
  dealers: AdminStaffDealerOption[];
  lockedScope?: { dealerMallId: number; name: string };
  onClose: () => void;
  staff: AdminStaffListItem | null;
}) {
  const titleId = useId();
  const [scopeType, setScopeType] = useState<"HQ" | "DEALER">(lockedScope ? "DEALER" : staff?.scopeType || "HQ");
  const [roleType, setRoleType] = useState<"OWNER" | "STAFF">(staff?.roleType || "STAFF");
  const [permissions, setPermissions] = useState<string[]>(staff?.permissionCodes || ["DASHBOARD_VIEW"]);
  const owner = roleType === "OWNER";
  const allowedPermissionCodes = lockedScope ? DEALER_ADMIN_PERMISSION_CODES : ALL_ADMIN_PERMISSION_CODES;
  const allowedPermissionCodeSet = lockedScope ? DEALER_PERMISSION_CODE_SET : ALL_PERMISSION_CODE_SET;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function togglePermission(code: string) {
    setPermissions((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  return createPortal(
    <div className="admin-info-dialog-layer" role="presentation">
      <button aria-label="직원 정보 닫기" className="admin-info-dialog-backdrop" onClick={onClose} type="button" />
      <div aria-labelledby={titleId} aria-modal="true" className="admin-info-dialog admin-staff-dialog" role="dialog">
        <div className="admin-info-dialog-head">
          <div className="admin-info-dialog-copy">
            <strong id={titleId}>{staff ? `${staff.name} 직원 정보` : "직원 추가"}</strong>
            <p>로그인 계정과 소속, 업무 권한을 함께 설정합니다.</p>
          </div>
          <button aria-label="직원 정보 닫기" className="admin-info-dialog-close" onClick={onClose} type="button">
            <svg fill="none" viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" /></svg>
          </button>
        </div>

        <form action={saveAdminStaffAction} className="admin-info-dialog-body admin-staff-form">
          {staff ? <input name="id" type="hidden" value={staff.id} /> : null}

          <section className="admin-staff-form-section">
            <div className="admin-staff-form-section-head">
              <h3>계정 및 소속</h3>
              <p>현재 로그인 화면에는 아직 연결하지 않으며, 전환 시 사용할 계정을 미리 등록합니다.</p>
            </div>
            <div className="admin-field-grid two">
              <label className="admin-field">
                <span>직원 이름 <b>필수</b></span>
                <input className="admin-input" defaultValue={staff?.name || ""} maxLength={100} name="name" required />
              </label>
              <label className="admin-field">
                <span>로그인 아이디 <b>필수</b></span>
                <input autoCapitalize="none" className="admin-input" defaultValue={staff?.loginId || ""} maxLength={40} minLength={4} name="loginId" pattern="[A-Za-z0-9._-]{4,40}" required />
              </label>
              <label className="admin-field">
                <span>{staff ? "새 비밀번호" : "초기 비밀번호"} {!staff ? <b>필수</b> : null}</span>
                <input autoComplete="new-password" className="admin-input" maxLength={64} minLength={8} name="password" placeholder={staff ? "변경할 때만 입력" : "8자 이상 입력"} required={!staff} type="password" />
              </label>
              <label className="admin-field">
                <span>휴대폰 번호 <b>필수</b></span>
                <input className="admin-input" defaultValue={staff?.phone || ""} inputMode="tel" maxLength={20} name="phone" required />
              </label>
              <label className="admin-field">
                <span>이메일</span>
                <input className="admin-input" defaultValue={staff?.email || ""} maxLength={150} name="email" type="email" />
              </label>
              <label className="admin-field">
                <span>직책</span>
                <input className="admin-input" defaultValue={staff?.positionName || ""} maxLength={80} name="positionName" placeholder="예: 운영팀장, 배송담당" />
              </label>
              {lockedScope ? (
                <div className="admin-field">
                  <span>소속 유형</span>
                  <div className="admin-input">{lockedScope.name}</div>
                  <input name="scopeType" type="hidden" value="DEALER" />
                  <input name="dealerMallId" type="hidden" value={lockedScope.dealerMallId} />
                </div>
              ) : <label className="admin-field">
                <span>소속 유형 <b>필수</b></span>
                <select className="admin-select" name="scopeType" onChange={(event) => setScopeType(event.target.value as "HQ" | "DEALER")} value={scopeType}>
                  <option value="HQ">본사몰</option>
                  <option value="DEALER">딜러몰</option>
                </select>
              </label>}
              {!lockedScope && scopeType === "DEALER" ? (
                <label className="admin-field">
                  <span>소속 딜러몰 <b>필수</b></span>
                  <select className="admin-select" defaultValue={staff?.dealerMallId || ""} name="dealerMallId" required>
                    <option disabled value="">딜러몰 선택</option>
                    {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.name}</option>)}
                  </select>
                </label>
              ) : null}
              {!lockedScope ? <label className="admin-field">
                <span>역할 <b>필수</b></span>
                <select className="admin-select" name="roleType" onChange={(event) => setRoleType(event.target.value as "OWNER" | "STAFF")} value={roleType}>
                  <option value="STAFF">직원</option>
                  <option value="OWNER">대표자</option>
                </select>
              </label> : <input name="roleType" type="hidden" value="STAFF" />}
              <label className="admin-field">
                <span>계정 상태</span>
                <select className="admin-select" defaultValue={staff?.status || "ACTIVE"} name="status">
                  <option value="ACTIVE">사용 중</option>
                  <option value="INACTIVE">사용 중지</option>
                </select>
              </label>
            </div>
          </section>

          <section className="admin-staff-form-section">
            <div className="admin-staff-form-section-head is-permission">
              <div>
                <h3>업무 권한</h3>
                <p>{owner ? "대표자는 소속 범위의 모든 권한을 자동으로 가집니다." : "이 직원에게 맡길 업무만 선택해주세요."}</p>
              </div>
              <span>{owner ? allowedPermissionCodes.length : permissions.filter((code) => allowedPermissionCodeSet.has(code)).length}개 권한</span>
            </div>
            <div className={`admin-staff-permission-grid${owner ? " is-owner" : ""}`}>
              {ADMIN_PERMISSION_GROUPS.map((group) => {
                const visiblePermissions = group.items.filter((permission) =>
                  allowedPermissionCodeSet.has(permission.code),
                );
                if (!visiblePermissions.length) return null;
                return (
                <fieldset key={group.label}>
                  <legend>{group.label}</legend>
                  <p>{group.description}</p>
                  <div>
                    {visiblePermissions.map((permission) => {
                      const checked = owner || permissions.includes(permission.code);
                      return (
                        <label key={permission.code}>
                          <input
                            checked={checked}
                            disabled={owner}
                            name={owner ? undefined : "permissionCodes"}
                            onChange={() => togglePermission(permission.code)}
                            type="checkbox"
                            value={permission.code}
                          />
                          <span>{permission.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                );
              })}
            </div>
          </section>

          <label className="admin-field">
            <span>관리 메모</span>
            <textarea className="admin-textarea" defaultValue={staff?.memo || ""} maxLength={1000} name="memo" placeholder="담당 업무나 인수인계 사항을 기록할 수 있습니다." />
          </label>

          <div className="admin-staff-form-actions">
            <button className="admin-button secondary" onClick={onClose} type="button">취소</button>
            <button className="admin-button" type="submit">{staff ? "직원 정보 저장" : "직원 계정 추가"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function StaffDirectoryBoard({ dealers, items, lockedScope, onEdit, onNew, readOnly }: { dealers: AdminStaffDealerOption[]; items: AdminStaffListItem[]; lockedScope?: { dealerMallId: number; name: string }; onEdit: (staff: AdminStaffListItem) => void; onNew: () => void; readOnly: boolean }) {
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const filteredItems = useMemo(() => {
    const keyword = normalized(query);
    return items.filter((staff) => {
      const matchesScope = scopeFilter === "ALL" || (scopeFilter === "HQ" ? staff.scopeType === "HQ" : String(staff.dealerMallId) === scopeFilter);
      const matchesStatus = statusFilter === "ALL" || staff.status === statusFilter;
      const searchTarget = normalized([staff.name, staff.scopeName, staff.loginId, staff.phone, staff.email, staff.positionName].join(" "));
      return matchesScope && matchesStatus && (!keyword || searchTarget.includes(keyword));
    });
  }, [items, query, scopeFilter, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminPanel
      action={readOnly ? <span className="admin-row-muted">조회 전용</span> : <button className="admin-button" onClick={onNew} type="button">직원 추가</button>}
      className="admin-staff-panel"
      description={readOnly ? "현재 딜러몰 직원의 계정 상태와 업무 권한을 조회합니다." : "본사와 각 딜러몰 직원을 한곳에서 찾고 계정 상태와 업무 권한을 관리합니다."}
      title={readOnly ? "직원 계정 조회" : "직원 계정 관리"}
    >
      <div className="admin-staff-toolbar">
        <SearchBox label="직원 검색" onChange={(value) => { setQuery(value); setPage(1); }} placeholder="이름, 아이디, 소속, 연락처 검색" value={query} />
        <select aria-label="직원 소속 필터" onChange={(event) => { setScopeFilter(event.target.value); setPage(1); }} value={scopeFilter}>
          <option value="ALL">전체 소속</option>
          <option value="HQ">본사몰</option>
          {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.name}</option>)}
        </select>
        <select aria-label="직원 상태 필터" onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} value={statusFilter}>
          <option value="ALL">전체 상태</option>
          <option value="ACTIVE">사용 중</option>
          <option value="INACTIVE">사용 중지</option>
        </select>
      </div>
      <ResultSummary page={page} total={filteredItems.length} unit="명" />

      {filteredItems.length ? (
        <>
          <div className="admin-staff-table-wrap">
            <table className="admin-staff-table">
              <thead><tr><th>직원·상태</th><th>소속</th><th>로그인 아이디</th><th>연락처</th><th>역할</th><th>권한</th><th>등록일</th><th className="is-action">관리</th></tr></thead>
              <tbody>
                {pagedItems.map((staff) => (
                  <tr key={staff.id}>
                    <td><div className="admin-staff-identity"><strong>{staff.name}</strong><AdminBadge tone={staff.status === "ACTIVE" ? "green" : "rose"}>{staff.status === "ACTIVE" ? "사용 중" : "사용 중지"}</AdminBadge></div>{staff.positionName ? <small>{staff.positionName}</small> : null}</td>
                    <td><strong className="admin-staff-scope">{staff.scopeName}</strong></td>
                    <td>{staff.loginId}</td>
                    <td><strong>{staff.phone}</strong><small>{staff.email || "-"}</small></td>
                    <td><AdminBadge tone={staff.roleType === "OWNER" ? "violet" : "cyan"}>{staff.roleType === "OWNER" ? "대표자" : "직원"}</AdminBadge></td>
                    <td>{staff.roleType === "OWNER" ? "전체 권한" : `${staff.permissionCodes.length}개`}</td>
                    <td>{formatAdminDate(staff.joinedAt)}</td>
                    <td className="is-action">{readOnly ? <span className="admin-row-muted">조회 전용</span> : lockedScope && staff.roleType === "OWNER" ? <span className="admin-row-muted">본사 관리</span> : <button className="admin-button secondary small" onClick={() => onEdit(staff)} type="button">상세·수정</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-staff-mobile-list">
            {pagedItems.map((staff) => (
              <article className="admin-staff-card" key={staff.id}>
                <div className="admin-staff-card-head"><div><strong>{staff.name}</strong><span>{staff.positionName || staff.loginId}</span></div><AdminBadge tone={staff.status === "ACTIVE" ? "green" : "rose"}>{staff.status === "ACTIVE" ? "사용 중" : "사용 중지"}</AdminBadge></div>
                <dl><div><dt>소속</dt><dd>{staff.scopeName}</dd></div><div><dt>로그인 아이디</dt><dd>{staff.loginId}</dd></div><div><dt>연락처</dt><dd>{staff.phone}</dd></div><div><dt>권한</dt><dd>{staff.roleType === "OWNER" ? "대표자 · 전체 권한" : `직원 · ${staff.permissionCodes.length}개`}</dd></div></dl>
                {readOnly ? <span className="admin-row-muted">조회 전용 계정입니다.</span> : lockedScope && staff.roleType === "OWNER" ? <span className="admin-row-muted">대표자 계정은 본사에서 관리합니다.</span> : <button className="admin-button secondary small" onClick={() => onEdit(staff)} type="button">상세·수정</button>}
              </article>
            ))}
          </div>
          <Pagination label="직원 목록 페이지 이동" onChange={setPage} page={page} pageCount={pageCount} />
        </>
      ) : <div className="admin-dealer-directory-empty"><strong>조건에 맞는 직원이 없습니다.</strong><p>검색어나 소속, 상태를 변경해보세요.</p></div>}
    </AdminPanel>
  );
}

function AuditLogBoard({ items }: { items: AdminAuditLogListItem[] }) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const actionOptions = useMemo(() => Array.from(new Map(items.map((item) => [item.actionCode, item.actionLabel])).entries()), [items]);
  const filteredItems = useMemo(() => {
    const keyword = normalized(query);
    return items.filter((item) => {
      const matchesAction = actionFilter === "ALL" || item.actionCode === actionFilter;
      const searchTarget = normalized([item.actorName, item.actorScope, item.actionLabel, item.targetLabel, item.targetId, item.detailText].join(" "));
      return matchesAction && (!keyword || searchTarget.includes(keyword));
    });
  }, [actionFilter, items, query]);
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminPanel
      action={<span className="admin-dealer-panel-count">최근 기록 <strong>{items.length}</strong>건</span>}
      className="admin-staff-panel"
      description="기록 기능 적용 이후 누가 어떤 관리자 작업을 했는지 성공·실패 결과까지 확인합니다."
      title="활동 로그"
    >
      <div className="admin-staff-toolbar is-audit">
        <SearchBox label="활동 로그 검색" onChange={(value) => { setQuery(value); setPage(1); }} placeholder="직원, 작업, 대상, 상세 내용 검색" value={query} />
        <select aria-label="활동 종류 필터" onChange={(event) => { setActionFilter(event.target.value); setPage(1); }} value={actionFilter}>
          <option value="ALL">전체 작업</option>
          {actionOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>
      <ResultSummary page={page} total={filteredItems.length} unit="건" />

      {filteredItems.length ? (
        <>
          <div className="admin-staff-table-wrap">
            <table className="admin-staff-table is-audit">
              <thead><tr><th>일시</th><th>직원</th><th>소속</th><th>작업</th><th>대상</th><th>결과</th><th>상세</th></tr></thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr key={item.id}>
                    <td>{formatAdminDate(item.createdAt)}</td>
                    <td><strong>{item.actorName}</strong></td>
                    <td>{item.actorScope || "-"}</td>
                    <td><strong className="admin-staff-action-label">{item.actionLabel}</strong></td>
                    <td title={item.targetLabel}>{item.targetLabel || item.targetId || "-"}</td>
                    <td><AdminBadge tone={item.resultStatus === "SUCCESS" ? "green" : "rose"}>{item.resultStatus === "SUCCESS" ? "성공" : "실패"}</AdminBadge></td>
                    <td title={item.detailText}>{item.detailText || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-staff-mobile-list">
            {pagedItems.map((item) => (
              <article className="admin-staff-card is-audit" key={item.id}>
                <div className="admin-staff-card-head"><div><strong>{item.actionLabel}</strong><span>{formatAdminDate(item.createdAt)}</span></div><AdminBadge tone={item.resultStatus === "SUCCESS" ? "green" : "rose"}>{item.resultStatus === "SUCCESS" ? "성공" : "실패"}</AdminBadge></div>
                <dl><div><dt>작업자</dt><dd>{item.actorName}</dd></div><div><dt>소속</dt><dd>{item.actorScope || "-"}</dd></div><div><dt>대상</dt><dd>{item.targetLabel || item.targetId || "-"}</dd></div><div><dt>상세</dt><dd>{item.detailText || "-"}</dd></div></dl>
              </article>
            ))}
          </div>
          <Pagination label="활동 로그 페이지 이동" onChange={setPage} page={page} pageCount={pageCount} />
        </>
      ) : <div className="admin-dealer-directory-empty"><strong>표시할 활동 로그가 없습니다.</strong><p>관리자 작업을 처리하면 이곳에 자동으로 기록됩니다.</p></div>}
    </AdminPanel>
  );
}

export function AdminAuditLogDirectory({ items }: { items: AdminAuditLogListItem[] }) {
  return <AuditLogBoard items={items} />;
}

export function AdminStaffDirectory({
  dealers,
  items,
  lockedScope,
  readOnly = false,
}: {
  dealers: AdminStaffDealerOption[];
  items: AdminStaffListItem[];
  lockedScope?: { dealerMallId: number; name: string };
  readOnly?: boolean;
}) {
  const [editingStaff, setEditingStaff] = useState<AdminStaffListItem | "NEW" | null>(null);
  return (
    <div className="admin-staff-directory-stack">
      <div className="admin-staff-login-transition-note">
        <strong>{lockedScope ? `${lockedScope.name} 직원 계정` : "직원 계정 로그인"}</strong>
        <p>{readOnly ? "직원 계정은 조회만 가능하며 변경은 본사 관리자에게 요청해주세요." : lockedScope ? "이곳에서 만든 직원은 현재 딜러몰 데이터에만 접근하며 선택한 업무 권한만 사용할 수 있습니다." : "등록한 아이디와 비밀번호로 로그인하면 소속과 업무 권한에 맞는 관리자 화면이 열립니다."}</p>
      </div>
      <StaffDirectoryBoard dealers={dealers} items={items} lockedScope={lockedScope} onEdit={setEditingStaff} onNew={() => setEditingStaff("NEW")} readOnly={readOnly} />
      {!readOnly && editingStaff ? (
        <StaffEditorDialog
          dealers={dealers}
          lockedScope={lockedScope}
          key={editingStaff === "NEW" ? "new" : editingStaff.id}
          onClose={() => setEditingStaff(null)}
          staff={editingStaff === "NEW" ? null : editingStaff}
        />
      ) : null}
    </div>
  );
}
