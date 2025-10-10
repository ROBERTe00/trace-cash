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
  const [budgets, setBudgets] = useState<Record<string, number>>({
    Food: 500,
    Transport: 200,
    Entertainment: 150,
    Rent: 1000,
    Other: 300,
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

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Monthly Budget Control</h3>
        </div>
      </div>
      
      <div className="mb-4 p-3 rounded-lg bg-info/10 border border-info/20 flex items-start gap-2">
        <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Set monthly spending limits for each category. Track your actual expenses versus your budget targets. Click edit to adjust limits.
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
