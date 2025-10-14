import { Card } from "@/components/ui/card";
import { Expense } from "@/lib/storage";
import { TrendingUp, DollarSign, Calendar, ArrowUpRight } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface IncomeTrackerProps {
  expenses: Expense[];
}

export const IncomeTracker = ({ expenses }: IncomeTrackerProps) => {
  const { formatCurrency } = useApp();
  
  const incomeTransactions = expenses.filter((e) => e.type === "Income");
  const totalIncome = incomeTransactions.reduce((sum, e) => sum + e.amount, 0);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyIncome = incomeTransactions
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const recurringIncome = incomeTransactions
    .filter((e) => e.recurring && e.recurrenceType)
    .reduce((sum, e) => {
      if (e.recurrenceType === "monthly") return sum + e.amount;
      if (e.recurrenceType === "weekly") return sum + e.amount * 4.33;
      return sum;
    }, 0);

  const incomeByCategory = incomeTransactions.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(incomeByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-success" />
        <h2 className="text-2xl font-bold">Income Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-muted-foreground">Total Income</span>
          </div>
          <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div>
          <div className="text-xs text-muted-foreground mt-1">All time</div>
        </div>

        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">This Month</span>
          </div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(monthlyIncome)}</div>
          <div className="text-xs text-muted-foreground mt-1">Current period</div>
        </div>

        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">Recurring/Month</span>
          </div>
          <div className="text-2xl font-bold text-accent">{formatCurrency(recurringIncome)}</div>
          <div className="text-xs text-muted-foreground mt-1">Predictable income</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Top Income Sources</h3>
        {sortedCategories.length > 0 ? (
          sortedCategories.map(([category, amount]) => {
            const percentage = (amount / totalIncome) * 100;
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category}</span>
                  <span className="text-sm text-success font-semibold">
                    {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-success transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No income recorded yet. Start tracking your income sources!
          </p>
        )}
      </div>
    </Card>
  );
};