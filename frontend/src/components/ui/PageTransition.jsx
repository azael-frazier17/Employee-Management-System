import { motion } from 'framer-motion';
import { pageVariants } from '../../utils/motion';

/** Wraps each page so route changes fade + slide up 10px (used with AnimatePresence). */
export default function PageTransition({ children }) {
  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
