import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Lightbulb } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";

interface CorrelationData {
  correlation_score: number;
  impact_analysis: Array<{
    category: string;
    monthly_average: number;
    potential_reduction: number;
    impact_on_portfolio: string;
    suggestion: string;
  }>;
  projected_growth: {
    current_trajectory: number;
    optimized_trajectory: number;
    additional_gain: number;
  };
}

interface ImpactOnInvestmentsWidgetProps {
  correlationData: CorrelationData | null;
  loading?: boolean;
  onViewRecommendations?: () => void;
}

export const ImpactOnInvestmentsWidget = ({
  correlationData,
  loading,
  onViewRecommendations
}: ImpactOnInvestmentsWidgetProps) => {
  const { formatCurrency } = useApp();

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-64 bg-muted rounded"></div>
      </Card>
    );
  }

  if (!correlationData) {
    return null;
  }

  const chartData = [
    {
      name: 'Current',
      value: correlationData.projected_growth.current_trajectory,
      fill: 'hsl(var(--primary))'
    },
    {
      name: 'Optimized',
      value: correlationData.projected_growth.optimized_trajectory,
      fill: 'hsl(142, 76%, 36%)'
    }
  ];

  const topImpact = correlationData.impact_analysis[0];

  return (
    <Card className="p-6 hover-lift">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Impact on Investments</h3>
              <p className="text-sm text-muted-foreground">
                How expenses affect portfolio growth
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Correlation</p>
            <p className="text-2xl font-bold text-primary">
              {(correlationData.correlation_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="value" name="Portfolio Value (12 months)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Tip */}
        {topImpact && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                  AI Insight: {topImpact.category}
                </p>
                <p className="text-sm text-muted-foreground">
                  {topImpact.suggestion}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Potential gain: <span className="text-green-600 dark:text-green-400 font-bold">
                    {formatCurrency(correlationData.projected_growth.additional_gain)}
                  </span> over 12 months
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        {onViewRecommendations && (
          <Button 
            onClick={onViewRecommendations}
            variant="outline"
            className="w-full"
          >
            View All Recommendations
          </Button>
        )}
      </div>
    </Card>
  );
};