import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';

export default function Button({ children, variant = 'primary', size = 'md', loading, className = '', icon: Icon, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      className={`btn btn-${variant} btn-${size} ${className}`} disabled={loading || props.disabled} {...props}
    >
      {loading ? <LoaderCircle className="spin" size={17} /> : Icon ? <Icon size={17} /> : null}
      {children}
    </motion.button>
  );
}
