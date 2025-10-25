import { Card, CardContent } from "@/components/ui/card";
import { Info, TrendingUp, TrendingDown } from "lucide-react";

interface ChartInsightCardProps {
  title: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: 'info' | 'up' | 'down';
}

export function ChartInsightCard({ 
  title, 
  description, 
  trend = 'neutral',
  trendValue,
  icon = 'info'
}: ChartInsightCardProps) {
  const IconComponent = {
    info: Info,
    up: TrendingUp,
    down: TrendingDown,
  }[icon];

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="modern-card mt-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-primary/10 flex-shrink-0`}>
            <IconComponent className={`w-4 h-4 ${getTrendColor()}`} />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{title}</h4>
              {trendValue && (
                <span className={`text-xs font-medium ${getTrendColor()}`}>
                  {trendValue}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

