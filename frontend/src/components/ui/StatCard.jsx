import { motion } from 'framer-motion';
import useCountUp from '../../hooks/useCountUp';
export default function StatCard({ label, value, icon: Icon, tone = 'primary', trend }) {
  const count = useCountUp(value);
  return (
    <motion.div className="stat-card" whileHover={{ y: -4, rotateX: 2, rotateY: 2 }}>
      <div className={`stat-icon tone-${tone}`}>{Icon && <Icon size={20} />}</div>
      <div><p>{label}</p><h3>{count}</h3>{trend && <span className="stat-trend">{trend}</span>}</div>
    </motion.div>
  );
}
