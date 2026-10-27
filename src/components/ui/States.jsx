/** Shared loading, error and empty states so every page fails and waits the same way. */

export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'This could not be loaded' }) {
  return (
    <div className="state state--error" role="alert">
      <h2 className="state__title">{title}</h2>
      <p>{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="state state--empty">
      <h2 className="state__title">{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
