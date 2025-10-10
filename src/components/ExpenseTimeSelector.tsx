import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Expense } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface ExpenseTimeSelectorProps {
  expenses: Expense[];
}

type TimeRange = "week" | "month" | "custom";

export const ExpenseTimeSelector = ({ expenses }: ExpenseTimeSelectorProps) => {
  const { formatCurrency } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const getFilteredExpenses = () => {
    const now = new Date();
    let start: Date, end: Date;

    switch (timeRange) {
      case "week":
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "custom":
        start = customRange.from;
        end = customRange.to;
        break;
    }

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  const totalIncome = filteredExpenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = filteredExpenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const categoryBreakdown = filteredExpenses
    .filter((e) => e.type === "Expense")
    .reduce((acc, expense) => {
      const category = expense.category || "Other";
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <Card className="glass-card p-6 space-y-6 animate-fade-in">
      <div>
        <h3 className="text-2xl font-bold mb-2 gradient-text">Expense Analysis</h3>
        <p className="text-muted-foreground">Track your spending over time</p>
      </div>

      {/* Time Range Toggle */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={timeRange === "week" ? "default" : "outline"}
          onClick={() => setTimeRange("week")}
          className="flex-1 min-w-[100px]"
        >
          Current Week
        </Button>
        <Button
          variant={timeRange === "month" ? "default" : "outline"}
          onClick={() => setTimeRange("month")}
          className="flex-1 min-w-[100px]"
        >
          Current Month
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={timeRange === "custom" ? "default" : "outline"}
              className="flex-1 min-w-[100px]"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Custom Range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">From</p>
                <Calendar
                  mode="single"
                  selected={customRange.from}
                  onSelect={(date) => {
                    if (date) {
                      setCustomRange((prev) => ({ ...prev, from: date }));
                      setTimeRange("custom");
                    }
                  }}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">To</p>
                <Calendar
                  mode="single"
                  selected={customRange.to}
                  onSelect={(date) => {
                    if (date) {
                      setCustomRange((prev) => ({ ...prev, to: date }));
                      setTimeRange("custom");
                    }
                  }}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className={`p-4 bg-gradient-to-br ${
          netBalance >= 0 
            ? "from-blue-500/10 to-blue-600/5 border-blue-500/20" 
            : "from-orange-500/10 to-orange-600/5 border-orange-500/20"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold ${
                netBalance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      {topCategories.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4">Top Spending Categories</h4>
          <div className="space-y-3">
            {topCategories.map(([category, amount]) => {
              const percentage = (amount / totalExpenses) * 100;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredExpenses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No transactions in this time period
        </div>
      )}
    </Card>
  );
};
