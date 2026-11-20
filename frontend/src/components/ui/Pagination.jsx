import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ pagination, page, onPageChange }) {
  if (!pagination) return null;
  const totalPages = pagination.totalPages || 1;
  return (
    <div className="pagination">
      <span>Showing {pagination.total ? (page - 1) * pagination.limit + 1 : 0}-{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}</span>
      <div>
        <button className="icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={18} /></button>
        <span>{page} / {totalPages}</span>
        <button className="icon-button" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight size={18} /></button>
      </div>
    </div>
  );
}
