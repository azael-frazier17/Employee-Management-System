import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import useCountUp from '../../hooks/useCountUp';
import { fadeUp } from '../../utils/motion';
import { Skeleton } from './Skeleton';
import './StatCard.css';

/**
 * Dashboard stat card: count-up number + light 3D tilt that follows the cursor (max 4deg).
 *   tone: primary | success | warning | danger | info | accent
 */
export default function StatCard({ icon: Icon, label, value, hint, tone = 'primary', loading = false, suffix = '' }) {
  const count = useCountUp(loading ? 0 : value);

  // Mouse position inside the card (-0.5 .. 0.5) -> rotation (-4deg .. 4deg)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 250, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), { stiffness: 250, damping: 20 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div variants={fadeUp} className="stat-wrap">
      <motion.div
        className={`card stat-card stat-${tone}`}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <div className="stat-glow" aria-hidden="true" />
        <div className="stat-top">
          <span className="stat-label">{label}</span>
          {Icon && (
            <span className={`stat-icon tone-${tone}`}>
              <Icon size={18} />
            </span>
          )}
        </div>
        {loading ? (
          <Skeleton width={80} height={32} />
        ) : (
          <div className="stat-value num">
            {count.toLocaleString('en-US')}
            {suffix && <small>{suffix}</small>}
          </div>
        )}
        {hint && <div className="stat-hint">{hint}</div>}
      </motion.div>
    </motion.div>
  );
}
