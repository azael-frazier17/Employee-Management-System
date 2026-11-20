import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

/** Builds the list of page buttons, e.g. [1, '…', 4, 5, 6, '…', 12] */
const pageList = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
};

/** "Showing 1-10 of N" + page buttons. Uses the API's pagination object. */
export default function Pagination({ pagination, onChange }) {
  if (!pagination || !pagination.total) return null;
  const { total, page, limit, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="pagination no-print">
      <span className="pagination-info num">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong>
      </span>
      {totalPages > 1 && (
        <nav className="pagination-pages" aria-label="Pagination">
          <button
            type="button"
            className="page-btn"
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {pageList(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="page-gap">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`page-btn num ${p === page ? 'active' : ''}`}
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className="page-btn"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
