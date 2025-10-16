import { useState, useEffect } from "react";
import { InsightsHero } from "@/components/InsightsHero";
import { AlertsPrioritized, InsightAlert } from "@/components/AlertsPrioritized";
import { NetWorthTracker } from "@/components/NetWorthTracker";
import { EmergencyFundTracker } from "@/components/EmergencyFundTracker";
import { RecurringExpenses } from "@/components/RecurringExpenses";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useExpenses } from "@/hooks/useExpenses";
import { useInvestments } from "@/hooks/useInvestments";
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Target,
  Flame,
  CheckCircle2 
} from "lucide-react";

export default function Insights() {
  const { expenses } = useExpenses();
  const { investments, totalValue, totalCost } = useInvestments();
  const [insights, setInsights] = useState<InsightAlert[]>([]);

  useEffect(() => {
    generateInsights();
  }, [expenses, investments]);

  const generateInsights = () => {
    const newInsights: InsightAlert[] = [];

    // Calculate metrics
    const totalExpenses = expenses
      .filter((e) => e.type === "Expense")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalIncome = expenses
      .filter((e) => e.type === "Income")
      .reduce((sum, e) => sum + e.amount, 0);

    const netCashflow = totalIncome - totalExpenses;
    const portfolioReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    // Crypto exposure check
    const cryptoInvestments = investments.filter(
      (inv) => inv.type === "Cryptocurrency"
    );
    const cryptoValue = cryptoInvestments.reduce(
      (sum, inv) => sum + inv.quantity * inv.current_price,
      0
    );
    const cryptoPercentage = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0;

    // Critical Alerts
    if (cryptoPercentage > 30) {
      newInsights.push({
        id: "high_crypto",
        type: "critical",
        icon: AlertTriangle,
        title: "High Crypto Exposure",
        description: `Your portfolio has ${cryptoPercentage.toFixed(1)}% in cryptocurrency. Consider rebalancing for better diversification.`,
        priority: 10,
      });
    }

    if (netCashflow < 0) {
      newInsights.push({
        id: "negative_cashflow",
        type: "critical",
        icon: AlertTriangle,
        title: "Negative Cash Flow",
        description: `You're spending more than you earn. Review your expenses to improve your financial health.`,
        priority: 9,
      });
    }

    if (investments.length < 3 && investments.length > 0) {
      newInsights.push({
        id: "low_diversification",
        type: "critical",
        icon: AlertTriangle,
        title: "Low Diversification",
        description: `You only have ${investments.length} investment(s). Consider diversifying across different asset types.`,
        priority: 8,
      });
    }

    // Opportunities
    if (netCashflow > 1000 && investments.length === 0) {
      newInsights.push({
        id: "start_investing",
        type: "opportunity",
        icon: TrendingUp,
        title: "Start Investing",
        description: `You have positive cash flow. Consider starting your investment journey with index funds or ETFs.`,
        priority: 7,
      });
    }

    if (portfolioReturn < 5 && totalValue > 5000) {
      newInsights.push({
        id: "optimize_portfolio",
        type: "opportunity",
        icon: PieChart,
        title: "Optimize Portfolio",
        description: `Your portfolio return is ${portfolioReturn.toFixed(1)}%. Review underperforming assets and consider rebalancing.`,
        priority: 6,
      });
    }

    const highSpendingCategories = Object.entries(
      expenses
        .filter((e) => e.type === "Expense")
        .reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 1);

    if (highSpendingCategories.length > 0 && highSpendingCategories[0][1] > totalExpenses * 0.3) {
      newInsights.push({
        id: "reduce_category",
        type: "opportunity",
        icon: DollarSign,
        title: "Reduce Category Spending",
        description: `${highSpendingCategories[0][0]} accounts for ${((highSpendingCategories[0][1] / totalExpenses) * 100).toFixed(1)}% of your expenses. Look for ways to optimize this category.`,
        priority: 5,
      });
    }

    // Success Items
    if (netCashflow > 0) {
      newInsights.push({
        id: "positive_cashflow",
        type: "success",
        icon: CheckCircle2,
        title: "Positive Cash Flow",
        description: `Great job! You're earning more than you spend. Your net cash flow is positive.`,
        priority: 4,
      });
    }

    if (investments.length >= 5) {
      newInsights.push({
        id: "well_diversified",
        type: "success",
        icon: PieChart,
        title: "Well Diversified",
        description: `Excellent! You have ${investments.length} different investments, showing good diversification.`,
        priority: 3,
      });
    }

    if (portfolioReturn > 10) {
      newInsights.push({
        id: "strong_returns",
        type: "success",
        icon: TrendingUp,
        title: "Strong Returns",
        description: `Your portfolio is performing well with a ${portfolioReturn.toFixed(1)}% return. Keep up the good work!`,
        priority: 2,
      });
    }

    setInsights(newInsights);
  };

  // Calculate overall health score
  const calculateHealthScore = () => {
    const criticalCount = insights.filter((i) => i.type === "critical").length;
    const opportunityCount = insights.filter((i) => i.type === "opportunity").length;
    const successCount = insights.filter((i) => i.type === "success").length;

    let score = 70; // Base score
    score -= criticalCount * 15; // -15 per critical
    score -= opportunityCount * 5; // -5 per opportunity
    score += successCount * 10; // +10 per success

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  
  const getTrend = (): "improving" | "stable" | "declining" => {
    const criticalCount = insights.filter((i) => i.type === "critical").length;
    if (criticalCount === 0) return "improving";
    if (criticalCount >= 2) return "declining";
    return "stable";
  };

  const getSummary = () => {
    const criticalCount = insights.filter((i) => i.type === "critical").length;
    const successCount = insights.filter((i) => i.type === "success").length;

    if (criticalCount === 0 && successCount > 0) {
      return "Your financial health is strong! You're managing your money well with positive trends across the board.";
    }
    if (criticalCount > 0) {
      return `You have ${criticalCount} critical area${criticalCount > 1 ? 's' : ''} that need attention. Focus on addressing these to improve your financial health.`;
    }
    return "You're on the right track! Keep monitoring your finances and look for opportunities to optimize.";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <InsightsHero
        score={healthScore}
        trend={getTrend()}
        summary={getSummary()}
      />

      {/* Prioritized Alerts & Insights */}
      <AlertsPrioritized insights={insights} />

      {/* Progress Tracking */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Financial Progress</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NetWorthTracker expenses={expenses as any} investments={investments as any} />
          </div>
          <EmergencyFundTracker expenses={expenses as any} />
        </div>
      </div>

      {/* Recurring Expenses */}
      <RecurringExpenses expenses={expenses as any} />
    </div>
  );
}
