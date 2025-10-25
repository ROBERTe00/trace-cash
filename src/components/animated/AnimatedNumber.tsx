import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { easeOutExpo } from '@/lib/animations';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
  formatter
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easedProgress = easeOutExpo(progress);
      const currentValue = value * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  const formattedValue = formatter 
    ? formatter(displayValue)
    : displayValue.toLocaleString('it-IT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('font-mono tabular-nums', className)}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
}
