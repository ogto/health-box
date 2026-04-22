import type { ReactNode } from "react";

export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-header-copy">
        <p className="admin-page-kicker">Admin Console</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="admin-header-actions">{actions}</div> : null}
    </header>
  );
}
