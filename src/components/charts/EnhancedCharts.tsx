/**
 * Enhanced Chart Components with Mobile Optimization
 * Fixes rendering issues, overlapping labels, and mobile usability
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  Sector,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

// Chart color palette optimized for accessibility
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
];

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface EnhancedPieChartProps {
  data: ChartData[];
  title?: string;
  centerLabel?: {
    title: string;
    value: string;
  };
  showPercentages?: boolean;
  height?: number;
  className?: string;
  onSegmentClick?: (data: ChartData) => void;
}

const RADIAN = Math.PI / 180;

// Custom label component with better positioning
const CustomPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  data,
  showPercentages
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  data: ChartData[];
  showPercentages: boolean;
}) => {
  if (!showPercentages || percent < 0.03) return null; // Hide labels for segments < 3%
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Ensure label stays within chart bounds
  const labelRadius = 20;
  const clampedX = Math.max(labelRadius, Math.min(cx * 2 - labelRadius, x));
  const clampedY = Math.max(labelRadius, Math.min(cy * 2 - labelRadius, y));
  
  return (
    <g>
      <circle 
        cx={clampedX} 
        cy={clampedY} 
        r={18} 
        fill="hsl(var(--card))" 
        opacity={0.95} 
        stroke="hsl(var(--border))" 
        strokeWidth={1}
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
      />
      <text 
        x={clampedX} 
        y={clampedY} 
        fill="hsl(var(--foreground))" 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="font-semibold text-xs"
        style={{ pointerEvents: 'none' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

export const EnhancedPieChart: React.FC<EnhancedPieChartProps> = ({
  data,
  title,
  centerLabel,
  showPercentages = true,
  height = 300,
  className,
  onSegmentClick
}) => {
  const { formatCurrency } = useApp();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Process data to ensure valid values
  const processedData = useMemo(() => {
    return data
      .filter(item => item.value > 0)
      .map((item, index) => ({
        ...item,
        color: item.color || CHART_COLORS[index % CHART_COLORS.length]
      }));
  }, [data]);

  const handleSegmentClick = useCallback((data: ChartData, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
    onSegmentClick?.(data);
  }, [activeIndex, onSegmentClick]);

  const renderActiveShape = (props: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
    payload: ChartData;
    percent: number;
    value: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          textAnchor={textAnchor} 
          fill="hsl(var(--foreground))"
          className="text-sm font-medium"
        >
          {formatCurrency(value)}
        </text>
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          dy={18} 
          textAnchor={textAnchor} 
          fill="hsl(var(--muted-foreground))"
          className="text-xs"
        >
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const chartContent = (
    <div className={cn("relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <defs>
            {processedData.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) => <CustomPieLabel {...props} data={processedData} showPercentages={showPercentages} />}
            outerRadius={Math.min(height * 0.35, 120)}
            innerRadius={Math.min(height * 0.25, 80)}
            fill="#8884d8"
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            paddingAngle={1}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${index})`}
                className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                onClick={() => handleSegmentClick(entry, index)}
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            ))}
          </Pie>
          
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              color: "hsl(var(--foreground))"
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            labelStyle={{ 
              fontWeight: 600, 
              color: "hsl(var(--foreground))" 
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      {centerLabel && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <div className="text-center bg-background/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/50">
            <p className="text-xs text-muted-foreground font-medium">{centerLabel.title}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{centerLabel.value}</p>
          </div>
        </motion.div>
      )}

      {/* Chart Controls */}
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-card rounded-xl p-6 shadow-2xl border max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{title || 'Chart Details'}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <div style={{ height: '60vh' }}>
              {chartContent}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return chartContent;
};

interface EnhancedBarChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  className?: string;
  xAxisKey?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
}

export const EnhancedBarChart: React.FC<EnhancedBarChartProps> = ({
  data,
  title,
  height = 300,
  className,
  xAxisKey = 'name',
  yAxisLabel = 'Value',
  showGrid = true
}) => {
  const { formatCurrency } = useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartContent = (
    <div className={cn("relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />}
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), yAxisLabel]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              color: "hsl(var(--foreground))"
            }}
          />
          <Bar 
            dataKey="value" 
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            className="transition-all duration-200 hover:opacity-80"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return chartContent;
};

interface MobileOptimizedChartProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const MobileOptimizedChart: React.FC<MobileOptimizedChartProps> = ({
  children,
  title,
  className
}) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {title}
            <Badge variant="outline" className="text-xs">
              {deviceType === 'mobile' && <Smartphone className="h-3 w-3 mr-1" />}
              {deviceType === 'tablet' && <Tablet className="h-3 w-3 mr-1" />}
              {deviceType === 'desktop' && <Monitor className="h-3 w-3 mr-1" />}
              {deviceType}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(
        "p-4",
        deviceType === 'mobile' && "p-2",
        deviceType === 'tablet' && "p-3"
      )}>
        <div className={cn(
          "transition-all duration-300",
          deviceType === 'mobile' && "text-sm",
          deviceType === 'tablet' && "text-sm"
        )}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPieChart;
