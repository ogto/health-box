type LoadingStateProps = {
  variant?: "store" | "admin";
};

export function LoadingState({ variant = "store" }: LoadingStateProps) {
  if (variant === "admin") {
    return (
      <div className="admin-loading-shell" aria-busy="true" aria-live="polite">
        <div className="loading-row">
          <span className="loading-pill" />
          <span className="loading-pill short" />
        </div>
        <div className="admin-loading-metrics">
          {Array.from({ length: 4 }).map((_, index) => (
            <span className="loading-card" key={index} />
          ))}
        </div>
        <div className="admin-loading-grid">
          <span className="loading-panel tall" />
          <span className="loading-panel" />
        </div>
      </div>
    );
  }

  return (
    <main className="mall-shell" aria-busy="true" aria-live="polite">
      <div className="page-wrap">
        <div className="store-loading-header">
          <span className="loading-mark" />
          <span className="loading-pill" />
          <span className="loading-pill short" />
        </div>
        <div className="store-loading-hero">
          <span className="loading-panel hero" />
          <span className="loading-panel stack" />
        </div>
        <div className="store-loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <span className="loading-card" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
