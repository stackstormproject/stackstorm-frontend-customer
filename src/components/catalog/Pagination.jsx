export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pages">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span aria-current="page">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}
