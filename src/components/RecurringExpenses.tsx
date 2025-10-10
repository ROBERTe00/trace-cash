import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/lib/storage";
import { Calendar, Repeat } from "lucide-react";

interface RecurringExpensesProps {
  expenses: Expense[];
}

export const RecurringExpenses = ({ expenses }: RecurringExpensesProps) => {
  const recurringExpenses = expenses.filter(
    (e) => e.recurrence && e.recurrence !== "None"
  );

  const monthlyRecurring = recurringExpenses
    .filter((e) => e.recurrence === "Monthly")
    .reduce((sum, e) => sum + (e.type === "Expense" ? e.amount : -e.amount), 0);

  const weeklyRecurring = recurringExpenses
    .filter((e) => e.recurrence === "Weekly")
    .reduce((sum, e) => sum + (e.type === "Expense" ? e.amount : -e.amount), 0);

  const monthlyFromWeekly = weeklyRecurring * 4.33; // Average weeks per month
  const totalMonthlyRecurring = monthlyRecurring + monthlyFromWeekly;

  if (recurringExpenses.length === 0) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recurring Expenses</h3>
        </div>
        <div className="text-center text-muted-foreground py-8">
          No recurring expenses yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Repeat className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Recurring Expenses</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">Monthly Impact</div>
          <div className="text-2xl font-bold">€{totalMonthlyRecurring.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            ~€{(totalMonthlyRecurring * 12).toFixed(0)}/year
          </div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="text-sm text-muted-foreground mb-1">Active Recurring</div>
          <div className="text-2xl font-bold">{recurringExpenses.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {recurringExpenses.filter((e) => e.recurrence === "Weekly").length} weekly,{" "}
            {recurringExpenses.filter((e) => e.recurrence === "Monthly").length} monthly
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {recurringExpenses.slice(0, 5).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="font-medium">{expense.description}</div>
              <div className="text-sm text-muted-foreground">{expense.category}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">
                {expense.recurrence}
              </Badge>
              <div className="text-right">
                <div className="font-semibold">€{expense.amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  {expense.recurrence === "Weekly"
                    ? `~€${(expense.amount * 4.33).toFixed(0)}/mo`
                    : "per month"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recurringExpenses.length > 5 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          +{recurringExpenses.length - 5} more recurring expenses
        </div>
      )}
    </Card>
  );
};
