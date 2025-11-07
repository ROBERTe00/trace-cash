// Chart skeleton component to prevent Cumulative Layout Shift (CLS)
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  height?: number;
  width?: string;
  className?: string;
}

export const ChartSkeleton = ({ 
  height = 300, 
  width = "100%",
  className 
}: ChartSkeletonProps) => (
  <div 
    className={cn(
      "animate-pulse bg-muted rounded-lg flex items-center justify-center",
      className
    )}
    style={{ 
      height: `${height}px`,
      width,
      minHeight: `${height}px`
    }}
    aria-label="Chart loading"
    role="status"
  >
    <div className="text-muted-foreground text-sm">Loading chart...</div>
  </div>
);

export const PieChartSkeleton = ({ className }: { className?: string }) => (
  <ChartSkeleton height={300} className={className} />
);

export const LineChartSkeleton = ({ className }: { className?: string }) => (
  <ChartSkeleton height={300} className={className} />
);

export const BarChartSkeleton = ({ className }: { className?: string }) => (
  <ChartSkeleton height={300} className={className} />
);
