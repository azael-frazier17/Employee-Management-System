/*
 * Theme-aware settings for recharts (SVG needs real color values,
 * so we pick them from the current theme instead of CSS variables).
 */
export const chartTheme = (isDark) => ({
  grid: isDark ? '#232C45' : '#E2E8F0',
  axis: isDark ? '#94A3B8' : '#64748B',
  cursor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(99, 102, 241, 0.06)',
  tooltip: {
    contentStyle: {
      background: isDark ? '#182038' : '#FFFFFF',
      border: `1px solid ${isDark ? '#334063' : '#E2E8F0'}`,
      borderRadius: 12,
      boxShadow: '0 12px 30px -10px rgba(15, 23, 42, 0.3)',
      fontSize: 12.5,
      color: isDark ? '#E5E7EB' : '#0F172A',
    },
    itemStyle: { color: isDark ? '#E5E7EB' : '#0F172A' },
    labelStyle: { color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, marginBottom: 4 },
  },
});
