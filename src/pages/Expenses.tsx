import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExpenseTimeSelector } from "@/components/ExpenseTimeSelector";
import { TransactionTable } from "@/components/TransactionTable";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseChart } from "@/components/ExpenseChart";
import { TrendChart } from "@/components/TrendChart";
import { BudgetTracker } from "@/components/BudgetTracker";
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
    toast.success("Transaction added successfully!");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Transaction deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your spending</p>
        </div>
      </div>

      <ExpenseTimeSelector expenses={expenses} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart expenses={expenses} />
        <TrendChart expenses={expenses} />
      </div>

      <BudgetTracker expenses={expenses} />

      <ExpenseForm onAdd={handleAddExpense} />

      <TransactionTable transactions={expenses} onDelete={handleDeleteExpense} />
    </div>
  );
}
