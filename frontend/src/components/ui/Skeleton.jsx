import './Skeleton.css';

/** Shimmer placeholder block (used instead of spinners while loading). */
export function Skeleton({ width = '100%', height = 14, radius = 8, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

/** Skeleton rows for a table while it loads. */
export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-row" key={r}>
          <Skeleton width={34} height={34} radius={999} />
          {Array.from({ length: cols - 1 }).map((__, c) => (
            <Skeleton key={c} height={12} width={`${60 + ((r + c) % 3) * 12}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a list of small items (dashboard lists). */
export function SkeletonList({ rows = 4 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-list-item" key={i}>
          <Skeleton width={36} height={36} radius={999} />
          <div className="skeleton-lines">
            <Skeleton height={12} width="55%" />
            <Skeleton height={10} width="35%" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Grid of skeleton cards. */
export function SkeletonCards({ count = 6, height = 150 }) {
  return (
    <div className="grid grid-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card card-pad" key={i}>
          <Skeleton height={16} width="50%" />
          <Skeleton height={12} width="80%" style={{ marginTop: 14 }} />
          <Skeleton height={height - 80} style={{ marginTop: 18 }} radius={12} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
