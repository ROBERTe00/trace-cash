import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode[];
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  const getGridClass = (index: number) => {
    // Create varied grid layouts
    if (index === 0) return "col-span-2 row-span-2"; // Large hero card
    if (index === 3) return "col-span-1 row-span-2"; // Tall card
    if (index === 5) return "col-span-2"; // Wide card
    return "col-span-1"; // Regular card
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      className={`grid grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)] ${className}`}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          className={getGridClass(index)}
          variants={item}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

