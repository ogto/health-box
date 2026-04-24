import type { CSSProperties, ReactNode } from "react";

import type { AdminMetric, AdminTone } from "../../_lib/admin-data";

const toneClassMap: Record<AdminTone, string> = {
  blue: "tone-blue",
  cyan: "tone-cyan",
  green: "tone-green",
  gold: "tone-gold",
  violet: "tone-violet",
  rose: "tone-rose",
};

export function AdminMetrics({ items }: { items: AdminMetric[] }) {
  return (
    <section className="admin-metric-grid">
      {items.map((item) => (
        <article className={`admin-metric-card ${toneClassMap[item.tone]}`} key={item.label}>
          <span className="admin-metric-label">{item.label}</span>
          <strong className="admin-metric-value">{item.value}</strong>
          {item.hint ? <p className="admin-metric-hint">{item.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}

export function AdminPanel({
  kicker,
  title,
  description,
  action,
  children,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-panel${className ? ` ${className}` : ""}`}>
      <div className="admin-panel-head">
        <div className="admin-panel-copy">
          {kicker ? <p className="admin-panel-kicker">{kicker}</p> : null}
          <h2 className="admin-panel-title">{title}</h2>
          {description ? <p className="admin-panel-description">{description}</p> : null}
        </div>
        {action ? <div className="admin-panel-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminTable({
  headers,
  columns,
  alignments,
  children,
  isEmpty = false,
  emptyTitle = "데이터가 없습니다.",
  emptyDescription,
  emptyAction,
}: {
  headers: string[];
  columns: string;
  alignments?: Array<"left" | "center" | "right">;
  children: ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  const style = {
    "--admin-table-columns": columns,
  } as CSSProperties & { "--admin-table-columns": string };

  return (
    <div className="admin-table" style={style}>
      <div className="admin-table-scroller">
        <div className="admin-table-surface">
          <div className="admin-table-head">
            {headers.map((header, index) => (
              <div
                className={`admin-table-head-cell admin-cell-${alignments?.[index] || "left"}`}
                key={header}
              >
                <span>{header}</span>
              </div>
            ))}
          </div>
          {isEmpty ? (
            <div className="admin-empty-state admin-table-empty">
              <strong>{emptyTitle}</strong>
              {emptyDescription ? <p>{emptyDescription}</p> : null}
              {emptyAction ? <div className="admin-table-empty-action">{emptyAction}</div> : null}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminBadge({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: AdminTone;
  className?: string;
}) {
  return <span className={`admin-badge ${toneClassMap[tone]}${className ? ` ${className}` : ""}`}>{children}</span>;
}
