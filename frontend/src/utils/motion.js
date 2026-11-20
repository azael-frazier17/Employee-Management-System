/*
 * Reusable framer-motion variants.
 * Only transform + opacity are animated so everything stays smooth.
 */

export const EASE = [0.4, 0, 0.2, 1];

// Page enter/exit: fade + slide up 10px
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE } },
};

// Single item fading up (used inside a stagger parent)
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

// Parent that reveals its children ~50ms apart
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

// Modal panel: springs from scale .96 to 1
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15, ease: EASE } },
};

// Drawer panel: slides in from the right
export const slideInRight = {
  hidden: { x: '100%' },
  show: { x: 0, transition: { type: 'spring', stiffness: 320, damping: 34 } },
  exit: { x: '100%', transition: { duration: 0.22, ease: EASE } },
};

// Blurred backdrop fade
export const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

// Expand / collapse height (departments)
export const collapse = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: 'auto', transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: EASE } },
};

// Quick "pop" when a status badge changes
export const pop = {
  initial: { scale: 0.6, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 500, damping: 22 } },
};
