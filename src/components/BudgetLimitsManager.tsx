import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Expense } from "@/lib/storage";

interface BudgetLimitsManagerProps {
  expenses: Expense[];
}

interface CategoryBudget {
  category: string;
  limit: number;
  current: number;
}

export function BudgetLimitsManager({ expenses }: BudgetLimitsManagerProps) {
  const [overallBudget, setOverallBudget] = useState(1500);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);

  const categories = ["Food", "Transport", "Entertainment", "Rent", "Other"];

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           e.type === "Expense";
  });

  useEffect(() => {
    // Carica budget salvati
    const savedBudget = localStorage.getItem('overall_budget');
    if (savedBudget) {
      setOverallBudget(parseFloat(savedBudget));
    }

    const savedCategoryBudgets = localStorage.getItem('category_budgets');
    if (savedCategoryBudgets) {
      setCategoryBudgets(JSON.parse(savedCategoryBudgets));
    } else {
      // Budget default per categoria
      const defaultBudgets = categories.map(cat => ({
        category: cat,
        limit: 300,
        current: 0
      }));
      setCategoryBudgets(defaultBudgets);
    }
  }, []);

  useEffect(() => {
    // Aggiorna spesa corrente per categoria
    const categoryTotals = currentMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    setCategoryBudgets(prev => 
      prev.map(budget => ({
        ...budget,
        current: categoryTotals[budget.category] || 0
      }))
    );
  }, [expenses]);

  const saveBudgets = () => {
    localStorage.setItem('overall_budget', overallBudget.toString());
    localStorage.setItem('category_budgets', JSON.stringify(categoryBudgets));
    toast.success("Budget salvati con successo!");
  };

  const updateCategoryBudget = (category: string, newLimit: number) => {
    setCategoryBudgets(prev =>
      prev.map(budget =>
        budget.category === category
          ? { ...budget, limit: newLimit }
          : budget
      )
    );
  };

  const totalCategoryLimits = categoryBudgets.reduce((sum, b) => sum + b.limit, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Gestione Budget
        </CardTitle>
        <CardDescription>
          Imposta limiti di spesa mensili per tenere sotto controllo le tue finanze
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget complessivo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Budget Mensile Totale</h4>
            <Badge variant="outline" className="text-lg font-bold">
              €{overallBudget.toFixed(0)}
            </Badge>
          </div>
          <Slider
            value={[overallBudget]}
            onValueChange={(value) => setOverallBudget(value[0])}
            min={500}
            max={5000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>€500</span>
            <span>€5000</span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">Budget per Categoria</h4>
          <div className="space-y-4">
            {categoryBudgets.map((budget) => {
              const percentage = (budget.current / budget.limit) * 100;
              const isOverBudget = percentage > 100;

              return (
                <div key={budget.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{budget.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isOverBudget ? 'text-red-500' : 'text-muted-foreground'}`}>
                        €{budget.current.toFixed(0)} / €{budget.limit.toFixed(0)}
                      </span>
                      {isOverBudget && (
                        <Badge variant="destructive" className="text-xs">
                          Superato
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Slider
                    value={[budget.limit]}
                    onValueChange={(value) => updateCategoryBudget(budget.category, value[0])}
                    min={50}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {totalCategoryLimits > overallBudget && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-sm">
            <p className="text-orange-600 dark:text-orange-400">
              ⚠️ La somma dei budget per categoria (€{totalCategoryLimits.toFixed(0)}) supera il budget totale (€{overallBudget.toFixed(0)})
            </p>
          </div>
        )}

        <Button onClick={saveBudgets} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Salva Budget
        </Button>
      </CardContent>
    </Card>
  );
}
