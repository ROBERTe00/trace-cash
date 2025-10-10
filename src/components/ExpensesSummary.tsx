import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertTriangle } from "lucide-react";
import { Expense } from "@/lib/storage";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExpensesSummaryProps {
  expenses: Expense[];
}

export function ExpensesSummary({ expenses }: ExpensesSummaryProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           e.type === "Expense";
  });

  const previousMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === prevMonth && 
           date.getFullYear() === prevYear &&
           e.type === "Expense";
  });

  const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPrevious = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentageChange = totalPrevious > 0 
    ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 
    : 0;

  // Calcola spese per categoria
  const categoryTotals = currentMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const budgetLimit = 1500; // Mock budget limit
  const budgetUsed = (totalCurrent / budgetLimit) * 100;
  const isOverBudget = budgetUsed > 100;

  return (
    <div className="space-y-6">
      {/* Alert se supera il budget */}
      {isOverBudget && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Budget superato! Hai speso €{totalCurrent.toFixed(2)} su €{budgetLimit.toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Metriche principali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Spese Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{totalCurrent.toFixed(2)}</div>
            <div className={`flex items-center gap-1 text-sm mt-2 ${percentageChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {percentageChange > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(percentageChange).toFixed(1)}% vs mese scorso
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Budget Utilizzato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.min(budgetUsed, 100).toFixed(0)}%</div>
            <Progress value={Math.min(budgetUsed, 100)} className="mt-3" />
            <div className="text-sm text-muted-foreground mt-2">
              €{(budgetLimit - totalCurrent).toFixed(2)} rimanenti
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMonthExpenses.length}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Media €{currentMonthExpenses.length > 0 ? (totalCurrent / currentMonthExpenses.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top categorie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Categorie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topCategories.map(([category, amount]) => {
            const percentage = (amount / totalCurrent) * 100;
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category}</span>
                  <span className="text-muted-foreground">
                    €{amount.toFixed(2)} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={percentage} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
