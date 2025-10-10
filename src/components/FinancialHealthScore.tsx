import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Expense, Investment } from "@/lib/storage";
import { Activity, AlertCircle, CheckCircle2, TrendingUp, Info } from "lucide-react";

interface FinancialHealthScoreProps {
  expenses: Expense[];
  investments: Investment[];
}

export const FinancialHealthScore = ({
  expenses,
  investments,
}: FinancialHealthScoreProps) => {
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const investmentValue = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.currentPrice,
    0
  );

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const investmentRatio = totalIncome > 0 ? (investmentValue / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  // Calculate health score (0-100)
  let healthScore = 0;

  // Savings rate contribution (0-40 points)
  if (savingsRate >= 20) healthScore += 40;
  else if (savingsRate >= 15) healthScore += 30;
  else if (savingsRate >= 10) healthScore += 20;
  else if (savingsRate >= 5) healthScore += 10;

  // Investment ratio contribution (0-30 points)
  if (investmentRatio >= 100) healthScore += 30;
  else if (investmentRatio >= 50) healthScore += 20;
  else if (investmentRatio >= 25) healthScore += 10;

  // Expense control contribution (0-30 points)
  if (expenseRatio <= 50) healthScore += 30;
  else if (expenseRatio <= 70) healthScore += 20;
  else if (expenseRatio <= 85) healthScore += 10;

  const getScoreColor = () => {
    if (healthScore >= 80) return "text-green-600 dark:text-green-400";
    if (healthScore >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = () => {
    if (healthScore >= 80) return "Excellent";
    if (healthScore >= 60) return "Good";
    if (healthScore >= 40) return "Fair";
    return "Needs Improvement";
  };

  const metrics = [
    {
      name: "Savings Rate",
      value: savingsRate,
      target: 20,
      description: "Percentage of income saved",
      icon: CheckCircle2,
    },
    {
      name: "Investment Ratio",
      value: investmentRatio,
      target: 50,
      description: "Investments vs. income",
      icon: TrendingUp,
    },
    {
      name: "Expense Control",
      value: 100 - expenseRatio,
      target: 50,
      description: "Percentage of income not spent",
      icon: AlertCircle,
    },
  ];

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Financial Health Score</h2>
      </div>

      <div className="mb-6 p-3 rounded-lg bg-info/10 border border-info/20 flex items-start gap-2">
        <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Your financial health score is calculated based on three key metrics: how much you save (Savings Rate), 
          how much you invest (Investment Ratio), and how well you control expenses (Expense Control). 
          A score of 80+ is excellent, 60-79 is good, 40-59 is fair.
        </p>
      </div>

      <div className="text-center mb-8">
        <div className={`text-6xl font-bold mb-2 ${getScoreColor()}`}>{healthScore}</div>
        <div className="text-xl font-semibold text-muted-foreground">{getScoreLabel()}</div>
        <Progress value={healthScore} className="h-3 mt-4" />
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isGood = metric.value >= metric.target;

          return (
            <div
              key={metric.name}
              className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-5 w-5 ${
                      isGood ? "text-green-500" : "text-orange-500"
                    }`}
                  />
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-xs text-muted-foreground">{metric.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{metric.value.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Target: {metric.target}%</div>
                </div>
              </div>
              <Progress
                value={Math.min((metric.value / metric.target) * 100, 100)}
                className="h-2"
                indicatorClassName={isGood ? "bg-green-500" : "bg-orange-500"}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <h3 className="font-semibold mb-2 text-sm">Recommendations</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {savingsRate < 20 && (
            <li>• Try to increase your savings rate to at least 20% of income</li>
          )}
          {investmentRatio < 50 && (
            <li>• Consider allocating more funds to investments for long-term growth</li>
          )}
          {expenseRatio > 70 && <li>• Review your expenses to identify areas to cut back</li>}
          {healthScore >= 80 && <li>• You're doing great! Keep up the excellent work!</li>}
        </ul>
      </div>
    </Card>
  );
};
