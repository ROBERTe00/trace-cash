import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Expense } from "@/lib/storage";
import { Target, Edit2, Check, X, Info } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface BudgetTrackerProps {
  expenses: Expense[];
}

export const BudgetTracker = ({ expenses }: BudgetTrackerProps) => {
  const { formatCurrency } = useApp();
  
  // Calculate monthly income for 50/30/20 rule
  const monthlyIncome = expenses
    .filter((e) => e.type === "Income" && e.recurrence === "Monthly")
    .reduce((sum, e) => sum + e.amount, 0);

  const recommended5030020 = {
    needs: monthlyIncome * 0.5,
    wants: monthlyIncome * 0.3,
    savings: monthlyIncome * 0.2,
  };

  const [budgets, setBudgets] = useState<Record<string, number>>({
    Food: recommended5030020.needs * 0.4,
    Transport: recommended5030020.needs * 0.2,
    Entertainment: recommended5030020.wants * 0.5,
    Rent: recommended5030020.needs * 0.4,
    Other: recommended5030020.wants * 0.5,
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startEdit = (category: string) => {
    setEditing(category);
    setTempValue(budgets[category]?.toString() || "0");
  };

  const saveEdit = (category: string) => {
    const value = parseFloat(tempValue);
    if (!isNaN(value) && value >= 0) {
      setBudgets({ ...budgets, [category]: value });
    }
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setTempValue("");
  };

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = expenses.filter(
    (e) => e.type === "Expense" && e.date.startsWith(currentMonth)
  );

  const categorySpent = monthlyExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(budgets);

  const totalBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0);
  const totalSpent = Object.values(categorySpent).reduce((sum, s) => sum + s, 0);
  const budgetUsagePercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Monthly Budget Tracker
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set spending limits for each category and track your progress
          </p>
        </div>
      </div>

      {monthlyIncome > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">50/30/20 Budget Rule</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Needs (50%)</div>
              <div className="font-semibold">{formatCurrency(recommended5030020.needs)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Wants (30%)</div>
              <div className="font-semibold">{formatCurrency(recommended5030020.wants)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Savings (20%)</div>
              <div className="font-semibold">{formatCurrency(recommended5030020.savings)}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on your monthly income of {formatCurrency(monthlyIncome)}
          </p>
        </div>
      )}

      <div className="mb-6 p-4 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Total Budget Usage</span>
          <span className="text-lg font-bold">
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              budgetUsagePercentage > 90 ? "bg-red-500" : budgetUsagePercentage > 70 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {budgetUsagePercentage.toFixed(1)}% of total budget used
        </p>
      </div>
      
      <div className="mb-4 p-3 rounded-lg bg-info/10 border border-info/20 flex items-start gap-2">
        <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Set monthly spending limits for each category. Click edit to adjust limits.
        </p>
      </div>
      <div className="space-y-4">
        {categories.map((category) => {
          const budget = budgets[category];
          const spent = categorySpent[category] || 0;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isOverBudget = spent > budget;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{category}</span>
                <div className="flex items-center gap-2">
                  {editing === category ? (
                    <>
                      <Input
                        type="number"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-20 h-8"
                        step="10"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveEdit(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-sm font-semibold ${
                          isOverBudget ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(spent)} / {formatCurrency(budget)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Progress
                value={Math.min(percentage, 100)}
                className="h-2"
                indicatorClassName={
                  isOverBudget ? "bg-destructive" : "bg-primary"
                }
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};
