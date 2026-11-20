export function Skeleton({ rows = 1, type = 'line' }) {
  return <div className={`skeleton-group skeleton-${type}`}>{Array.from({ length: rows }).map((_, index) => <div className="skeleton" key={index} />)}</div>;
}
