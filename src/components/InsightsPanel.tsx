import { Card } from "@/components/ui/card";
import { Investment, Expense } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { Lightbulb, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InsightsPanelProps {
  investments: Investment[];
  expenses: Expense[];
}

export const InsightsPanel = ({ investments, expenses }: InsightsPanelProps) => {
  const { formatCurrency } = useApp();

  const generateInsights = () => {
    const insights: Array<{
      type: "tip" | "warning" | "success";
      icon: any;
      title: string;
      description: string;
    }> = [];

    const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
    const categoryData = investments.reduce((acc, inv) => {
      const value = inv.quantity * inv.currentPrice;
      acc[inv.category] = (acc[inv.category] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    // Crypto exposure check
    const cryptoPercentage = ((categoryData["Crypto"] || 0) / totalValue) * 100;
    if (cryptoPercentage > 30) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        title: "High Crypto Exposure",
        description: `Your portfolio is ${cryptoPercentage.toFixed(1)}% crypto. Consider rebalancing to reduce risk. Recommended: keep crypto under 30%.`,
      });
    }

    // Diversification check
    const categories = Object.keys(categoryData).length;
    if (categories < 2 && investments.length > 0) {
      insights.push({
        type: "tip",
        icon: Shield,
        title: "Diversify Your Portfolio",
        description: "Your portfolio is concentrated in one category. Add ETFs or stocks to reduce risk and improve stability.",
      });
    }

    // Cash check
    const totalIncome = expenses.filter((e) => e.type === "Income").reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.filter((e) => e.type === "Expense").reduce((sum, e) => sum + e.amount, 0);
    const cashBalance = totalIncome - totalExpenses;

    if (cashBalance < 0) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        title: "Negative Cash Flow",
        description: `Your expenses exceed income by ${formatCurrency(Math.abs(cashBalance))}. Review your budget and cut non-essential spending.`,
      });
    }

    // Positive yield check
    const totalYield = investments.reduce((sum, inv) => {
      const initial = inv.quantity * inv.purchasePrice;
      const current = inv.quantity * inv.currentPrice;
      return sum + ((current - initial) / initial) * 100;
    }, 0) / Math.max(investments.length, 1);

    if (totalYield > 10 && investments.length > 0) {
      insights.push({
        type: "success",
        icon: TrendingUp,
        title: "Strong Performance",
        description: `Your portfolio is up ${totalYield.toFixed(1)}% on average. Great work! Consider taking some profits or rebalancing.`,
      });
    }

    // No ETF check
    const hasETF = investments.some((inv) => inv.category === "ETF");
    if (!hasETF && investments.length > 0) {
      insights.push({
        type: "tip",
        icon: Lightbulb,
        title: "Consider Adding ETFs",
        description: "ETFs provide broad market exposure with lower risk. Consider adding an S&P 500 or world index ETF for stability.",
      });
    }

    // Budget check
    const monthlyExpenses = expenses
      .filter((e) => e.type === "Expense" && e.recurrence === "Monthly")
      .reduce((sum, e) => sum + e.amount, 0);

    if (monthlyExpenses > totalIncome * 0.5 && totalIncome > 0) {
      insights.push({
        type: "tip",
        icon: Lightbulb,
        title: "Follow the 50/30/20 Rule",
        description: "Aim for 50% needs, 30% wants, 20% savings. Your current spending is high relative to income.",
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Smart Insights
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Add more data to receive personalized insights and recommendations
        </p>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        Smart Insights
      </h3>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const variant =
            insight.type === "warning" ? "destructive" : insight.type === "success" ? "default" : "default";

          return (
            <Alert key={index} variant={variant} className="border-l-4">
              <Icon className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="font-semibold mb-1">{insight.title}</div>
                <div className="text-sm opacity-90">{insight.description}</div>
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </Card>
  );
};
