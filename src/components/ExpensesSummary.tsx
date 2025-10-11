import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertTriangle, Settings } from "lucide-react";
import { Expense } from "@/lib/storage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ExpensesSummaryProps {
  expenses: Expense[];
}

export function ExpensesSummary({ expenses }: ExpensesSummaryProps) {
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(() => {
    const saved = localStorage.getItem('monthlyBudgetLimit');
    return saved ? parseFloat(saved) : 1500;
  });
  const [tempBudget, setTempBudget] = useState(monthlyBudgetLimit.toString());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSaveBudget = () => {
    const newBudget = parseFloat(tempBudget);
    if (!isNaN(newBudget) && newBudget > 0) {
      setMonthlyBudgetLimit(newBudget);
      localStorage.setItem('monthlyBudgetLimit', newBudget.toString());
      setIsDialogOpen(false);
    }
  };

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

  const budgetUsed = (totalCurrent / monthlyBudgetLimit) * 100;
  const isOverBudget = budgetUsed > 100;

  return (
    <div className="space-y-6">
      {/* Alert se supera il budget */}
      {isOverBudget && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Budget superato! Hai speso €{totalCurrent.toFixed(2)} su €{monthlyBudgetLimit.toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Metriche principali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Spese Totali</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold truncate">€{totalCurrent.toFixed(2)}</div>
            <div className={`flex items-center gap-1 text-sm mt-2 ${percentageChange > 0 ? 'text-destructive' : 'text-success'}`}>
              {percentageChange > 0 ? (
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{Math.abs(percentageChange).toFixed(1)}% vs mese scorso</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Budget Utilizzato</span>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Imposta Budget Mensile</DialogTitle>
                  <DialogDescription>
                    Definisci il tuo limite di spesa mensile per monitorare meglio le tue finanze.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    type="number"
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                    placeholder="Budget mensile"
                    min="0"
                    step="100"
                    className="h-11"
                  />
                  <Button onClick={handleSaveBudget} className="w-full">
                    Salva Budget
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold truncate">{Math.min(budgetUsed, 100).toFixed(0)}%</div>
            <Progress value={Math.min(budgetUsed, 100)} className="mt-3" />
            <div className="text-sm text-muted-foreground mt-2 truncate">
              €{Math.max(0, monthlyBudgetLimit - totalCurrent).toFixed(2)} rimanenti
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categoria Principale
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <>
                <div className="text-2xl font-bold truncate">{topCategories[0][0]}</div>
                <div className="text-sm text-muted-foreground mt-2 truncate">
                  €{topCategories[0][1].toFixed(2)}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Nessuna spesa</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top categorie */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Categorie di Spesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(([category, amount]) => {
                const percentage = (amount / totalCurrent) * 100;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{category}</span>
                      <span className="text-muted-foreground">€{amount.toFixed(2)}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
