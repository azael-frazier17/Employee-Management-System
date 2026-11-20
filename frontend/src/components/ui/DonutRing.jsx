import { motion } from 'framer-motion';
import './DonutRing.css';

const R = 50;
const C = 2 * Math.PI * R; // circumference

/**
 * Animated donut / ring: every segment draws itself on load.
 *   segments: [{ label, value, color }]
 *   centerValue / centerLabel: text in the middle (e.g. "92%" / "attendance rate")
 */
export default function DonutRing({ segments, centerValue, centerLabel, size = 166, thickness = 13 }) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  let offset = 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={centerLabel}>
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="var(--border)"
          strokeWidth={thickness}
          opacity="0.55"
        />
        <g transform="rotate(-90 60 60)">
          {segments.map((s, i) => {
            const len = total ? ((Number(s.value) || 0) / total) * C : 0;
            const gap = len > 6 ? 3 : 0; // clean gap between segments
            const circle = (
              <motion.circle
                key={s.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDashoffset={-offset}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${Math.max(len - gap, 0)} ${C}` }}
                transition={{ duration: 0.9, delay: 0.12 + i * 0.14, ease: [0.4, 0, 0.2, 1] }}
              />
            );
            offset += len;
            return circle;
          })}
        </g>
      </svg>
      <div className="donut-center">
        <strong className="num">{centerValue}</strong>
        {centerLabel && <span>{centerLabel}</span>}
      </div>
    </div>
  );
}

/** Legend rows: colored dot + label + animated horizontal progress bar + count & percentage. */
export function DonutLegend({ segments }) {
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  return (
    <div className="donut-legend">
      {segments.map((s, i) => {
        const pct = total ? Math.round(((Number(s.value) || 0) / total) * 100) : 0;
        return (
          <div className="donut-legend-item" key={s.label}>
            <div className="donut-legend-top">
              <span className="legend-dot" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}66` }} />
              <span className="legend-label">{s.label}</span>
              <strong className="num">{s.value}</strong>
              <span className="legend-pct num">{pct}%</span>
            </div>
            <div className="legend-track" aria-hidden="true">
              <motion.span
                className="legend-fill"
                style={{ background: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.75, delay: 0.18 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
