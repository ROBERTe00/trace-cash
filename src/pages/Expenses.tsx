import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpensesSummary } from "@/components/ExpensesSummary";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { ExpenseBadges } from "@/components/ExpenseBadges";
import { BudgetLimitsManager } from "@/components/BudgetLimitsManager";
import { TransactionTable } from "@/components/TransactionTable";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CategoryManager } from "@/components/CategoryManager";
import { LanguageCurrencySettings } from "@/components/LanguageCurrencySettings";
import { getExpenses, saveExpenses, Expense } from "@/lib/storage";
import { toast } from "sonner";

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  const handleAddExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Transazione aggiunta con successo!");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Transazione eliminata");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Spese</h1>
          <p className="text-muted-foreground">
            Gestisci e analizza le tue spese in modo intelligente
          </p>
        </div>
      </div>

      <Tabs defaultValue="riepilogo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="riepilogo">Riepilogo</TabsTrigger>
          <TabsTrigger value="dettagli">Dettagli</TabsTrigger>
          <TabsTrigger value="insight">Insight</TabsTrigger>
          <TabsTrigger value="impostazioni">Impostazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="riepilogo" className="space-y-6">
          <ExpensesSummary expenses={expenses} />
          <ExpenseBadges expenses={expenses} />
        </TabsContent>

        <TabsContent value="dettagli" className="space-y-6">
          <ExpenseForm onAdd={handleAddExpense} />
          <TransactionTable transactions={expenses} onDelete={handleDeleteExpense} />
        </TabsContent>

        <TabsContent value="insight" className="space-y-6">
          <ExpenseInsights expenses={expenses} />
        </TabsContent>

        <TabsContent value="impostazioni" className="space-y-6">
          <LanguageCurrencySettings />
          <BudgetLimitsManager expenses={expenses} />
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
