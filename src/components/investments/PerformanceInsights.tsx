import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Lightbulb, AlertTriangle } from "lucide-react";
import { Investment } from "@/lib/storage";

interface PerformanceInsightsProps {
  investments: Investment[];
  totalReturn: number;
  returnPercentage: number;
}

export const PerformanceInsights = ({
  investments,
  totalReturn,
  returnPercentage,
}: PerformanceInsightsProps) => {
  const insights = [];

  // Insight 1: Overall performance
  if (returnPercentage > 10) {
    insights.push({
      icon: TrendingUp,
      type: "success" as const,
      text: `📊 Excellent! Your portfolio is up ${returnPercentage.toFixed(1)}% overall.`,
    });
  } else if (returnPercentage > 0) {
    insights.push({
      icon: TrendingUp,
      type: "info" as const,
      text: `📊 Your portfolio is gaining with a ${returnPercentage.toFixed(1)}% return.`,
    });
  } else {
    insights.push({
      icon: AlertTriangle,
      type: "warning" as const,
      text: `⚠️ Your portfolio is down ${Math.abs(returnPercentage).toFixed(1)}%. Consider reviewing your strategy.`,
    });
  }

  // Insight 2: Diversification
  const uniqueTypes = new Set(investments.map((i) => i.type)).size;
  if (uniqueTypes < 3 && investments.length > 5) {
    insights.push({
      icon: Lightbulb,
      type: "tip" as const,
      text: "💡 Consider diversifying across more asset types to reduce risk.",
    });
  }

  // Insight 3: Best performer
  if (investments.length > 0) {
    const bestPerformer = investments.reduce((best, inv) => {
      const gainPercent = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
      const bestGainPercent = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
      return gainPercent > bestGainPercent ? inv : best;
    });
    const bestGain = ((bestPerformer.currentPrice - bestPerformer.purchasePrice) / bestPerformer.purchasePrice) * 100;
    
    if (bestGain > 15) {
      insights.push({
        icon: TrendingUp,
        type: "success" as const,
        text: `🚀 ${bestPerformer.name} is your top performer with +${bestGain.toFixed(1)}%!`,
      });
    }
  }

  const typeColors = {
    success: "border-success/50 bg-success/5",
    info: "border-primary/50 bg-primary/5",
    warning: "border-warning/50 bg-warning/5",
    tip: "border-info/50 bg-info/5",
  };

  return (
    <Card className="premium-card-glow">
      <CardHeader>
        <CardTitle className="text-card-title">Performance Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${typeColors[insight.type]} flex items-start gap-3`}
          >
            <div className="mt-0.5">
              <insight.icon className="w-5 h-5" />
            </div>
            <p className="text-sm leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
