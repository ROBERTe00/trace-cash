import { ReactNode } from 'react';

// Custom colors for Recharts matching MyMoney.ai theme
export const customChartColors = {
  primary: '#7B2FF7',
  primaryLight: '#9E77FF',
  primaryDark: '#5A1FC4',
  accent: '#00F5FF',
  success: '#00FF88',
  warning: '#FFB800',
  error: '#FF3366',
  background: '#0A0A0F',
  surface: '#16161F',
  text: '#FFFFFF',
  textSecondary: '#A0A0B8',
  grid: 'rgba(123, 47, 247, 0.1)',
  border: 'rgba(123, 47, 247, 0.2)',
};

// Custom gradient definitions for Recharts
export const chartGradients = (
  <>
    <defs>
      {/* Primary Purple Gradient */}
      <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={customChartColors.primary} stopOpacity={0.8} />
        <stop offset="100%" stopColor={customChartColors.primary} stopOpacity={0} />
      </linearGradient>

      {/* Accent Cyan Gradient */}
      <linearGradient id="colorAccent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={customChartColors.accent} stopOpacity={0.8} />
        <stop offset="100%" stopColor={customChartColors.accent} stopOpacity={0} />
      </linearGradient>

      {/* Success Green Gradient */}
      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={customChartColors.success} stopOpacity={0.8} />
        <stop offset="100%" stopColor={customChartColors.success} stopOpacity={0} />
      </linearGradient>

      {/* Error Red Gradient */}
      <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={customChartColors.error} stopOpacity={0.8} />
        <stop offset="100%" stopColor={customChartColors.error} stopOpacity={0} />
      </linearGradient>

      {/* Glow filter for premium effect */}
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </>
);

// Custom Tooltip component with glassmorphism
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const defaultFormatter = (value: number) => 
      `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const formatValue = formatter || defaultFormatter;

    return (
      <div className="rounded-2xl backdrop-blur-xl bg-card/95 border border-primary/30 p-4 shadow-2xl">
        {label && (
          <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-semibold text-foreground font-mono">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Default chart configuration
export const defaultChartConfig = {
  margin: { top: 10, right: 10, left: 0, bottom: 0 },
  strokeWidth: 3,
  dot: {
    r: 6,
    strokeWidth: 2,
    fill: customChartColors.surface,
  },
  activeDot: {
    r: 8,
    strokeWidth: 2,
    fill: customChartColors.primary,
  },
  grid: {
    stroke: customChartColors.grid,
    strokeDasharray: '3 3',
  },
  cartesianGrid: {
    stroke: customChartColors.grid,
    strokeDasharray: '3 3',
    opacity: 0.3,
  },
  xAxis: {
    stroke: customChartColors.textSecondary,
    tick: { 
      fill: customChartColors.textSecondary,
      fontSize: 12,
      fontFamily: 'DM Sans, sans-serif'
    },
    axisLine: { stroke: customChartColors.border },
  },
  yAxis: {
    stroke: customChartColors.textSecondary,
    tick: { 
      fill: customChartColors.textSecondary,
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace'
    },
    axisLine: { stroke: customChartColors.border },
  },
};

// Wrapper component that provides default styling
interface ChartWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ChartWrapper({ children, className = '' }: ChartWrapperProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {children}
    </div>
  );
}
