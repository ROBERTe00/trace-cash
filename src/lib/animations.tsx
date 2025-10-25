// ============================================
// MYMONEY.AI - FRAMER MOTION ANIMATION LIBRARY
// Reusable animation variants and utilities
// ============================================

import { Variants } from 'framer-motion';

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

// ============================================
// SCALE ANIMATIONS
// ============================================

export const scaleIn: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 0.4, 
      ease: [0.4, 0, 0.2, 1] // Custom easing
    }
  }
};

export const scaleInBounce: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 200,
      damping: 15
    }
  }
};

// ============================================
// STAGGER ANIMATIONS (for lists)
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// ============================================
// HOVER ANIMATIONS
// ============================================

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { 
    y: -4, 
    scale: 1.02,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export const hoverGlow = {
  rest: { 
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)' 
  },
  hover: { 
    boxShadow: '0 8px 32px rgba(123, 47, 247, 0.4)',
    transition: { duration: 0.3 }
  }
};

export const hoverScale = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.3 }
  }
};

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

// ============================================
// CARD ANIMATIONS
// ============================================

export const cardHover: Variants = {
  rest: { 
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
  },
  hover: { 
    y: -6,
    boxShadow: '0 8px 32px rgba(123, 47, 247, 0.4), 0 0 40px rgba(123, 47, 247, 0.2)'
  }
};

export const cardTap = {
  scale: 0.98,
  transition: { duration: 0.1 }
};

// ============================================
// NUMBER ANIMATION UTILITIES
// ============================================

export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

// ============================================
// SPRING CONFIGURATIONS
// ============================================

export const springConfigs = {
  default: { type: 'spring', stiffness: 300, damping: 30 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
  bouncy: { type: 'spring', stiffness: 400, damping: 15 },
  slow: { type: 'spring', stiffness: 100, damping: 20 }
} as const;
