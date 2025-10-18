/**
 * Futuristic Card Component
 * Advanced glass morphism with neon effects and animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface FuturisticCardProps {
  title?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
  glow?: boolean;
  animated?: boolean;
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: {
    card: 'futuristic-card',
    glow: 'neon-glow',
    icon: 'text-primary'
  },
  primary: {
    card: 'futuristic-card border-primary/30',
    glow: 'neon-glow-primary',
    icon: 'text-primary'
  },
  success: {
    card: 'futuristic-card border-green-500/30',
    glow: 'neon-glow-green',
    icon: 'text-green-500'
  },
  warning: {
    card: 'futuristic-card border-yellow-500/30',
    glow: 'neon-glow-purple',
    icon: 'text-yellow-500'
  },
  info: {
    card: 'futuristic-card border-blue-500/30',
    glow: 'neon-glow',
    icon: 'text-blue-500'
  }
};

export const FuturisticCard: React.FC<FuturisticCardProps> = ({
  title,
  children,
  icon: Icon,
  variant = 'default',
  glow = false,
  animated = true,
  className = '',
  delay = 0
}) => {
  const styles = variantStyles[variant];

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay,
        ease: "easeOut"
      }
    },
    hover: animated ? {
      y: -5,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    } : {}
  };

  const iconVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0,
      rotate: -180
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        delay: delay + 0.2,
        ease: "easeOut"
      }
    },
    hover: animated ? {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    } : {}
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={`relative ${className}`}
    >
      <Card className={`
        ${styles.card}
        ${glow ? styles.glow : ''}
        ${animated ? 'hover-lift' : ''}
        transition-all duration-300
        group
      `}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
             style={{
               background: 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
               backgroundSize: '200% 200%',
               animation: animated ? 'gradient-shift 3s ease infinite' : 'none'
             }} />

        {title && (
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              {Icon && (
                <motion.div
                  variants={iconVariants}
                  className={`p-2 rounded-lg bg-primary/10 ${styles.icon}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
              )}
              <span className="gradient-text-neon">{title}</span>
            </CardTitle>
          </CardHeader>
        )}

        <CardContent className="relative">
          {children}
        </CardContent>

        {/* Corner Accents */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-2xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-tr-2xl opacity-50" />
      </Card>

      {/* Floating Particles Effect */}
      {animated && (
        <>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/30 rounded-full animate-pulse-slow" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-500/30 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 -right-1 w-2 h-2 bg-cyan-400/30 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </>
      )}
    </motion.div>
  );
};

interface FuturisticStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  glow?: boolean;
  animated?: boolean;
  delay?: number;
}

export const FuturisticStatCard: React.FC<FuturisticStatCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  glow = false,
  animated = true,
  delay = 0
}) => {
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay,
        ease: "easeOut"
      }
    },
    hover: animated ? {
      y: -8,
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    } : {}
  };

  const iconVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0,
      rotate: -90
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        delay: delay + 0.3,
        ease: "easeOut"
      }
    },
    hover: animated ? {
      scale: 1.2,
      rotate: 10,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    } : {}
  };

  const valueVariants = {
    hidden: { 
      opacity: 0, 
      x: 20
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        delay: delay + 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="relative"
    >
      <Card className={`
        futuristic-card
        ${glow ? 'neon-glow-primary' : ''}
        ${animated ? 'hover-lift' : ''}
        transition-all duration-300
        group
        p-6
      `}>
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative space-y-4">
          {/* Icon */}
          <motion.div
            variants={iconVariants}
            className="flex justify-center"
          >
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </motion.div>

          {/* Value */}
          <motion.div
            variants={valueVariants}
            className="text-center"
          >
            <div className="text-3xl font-bold gradient-text-neon mb-1">
              {value}
            </div>
            <div className="text-sm text-muted-foreground">
              {label}
            </div>
          </motion.div>

          {/* Trend */}
          {trend && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.7 }}
              className="flex justify-center"
            >
              <Badge 
                variant="secondary" 
                className={`
                  ${trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                  border ${trend.isPositive ? 'border-green-500/30' : 'border-red-500/30'}
                `}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Badge>
            </motion.div>
          )}
        </div>

        {/* Corner Effects */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-2xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-2xl opacity-30" />
      </Card>

      {/* Floating Elements */}
      {animated && (
        <>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/40 rounded-full animate-bounce-gentle" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500/40 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }} />
        </>
      )}
    </motion.div>
  );
};

export default FuturisticCard;
