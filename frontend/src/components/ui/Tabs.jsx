import { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * Segmented tabs. The white "pill" glides to the active tab (framer-motion layoutId).
 *   tabs: [{ value, label, icon?, count? }]
 */
export default function Tabs({ tabs, value, onChange, label = 'Tabs' }) {
  const layoutId = useId();
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`tab ${active ? 'active' : ''}`}
            onClick={() => onChange(tab.value)}
          >
            {active && (
              <motion.span
                layoutId={`tab-${layoutId}`}
                className="tab-bg"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span>
              {Icon && <Icon size={15} />}
              {tab.label}
              {tab.count !== undefined && tab.count !== null && <span className="tab-count">{tab.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
