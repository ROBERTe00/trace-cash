import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpensesSummary } from "@/components/ExpensesSummary";
import { ExpenseInsights } from "@/components/ExpenseInsights";
import { ExpenseBadges } from "@/components/ExpenseBadges";
import { BudgetLimitsManager } from "@/components/BudgetLimitsManager";
import { TransactionTable } from "@/components/TransactionTable";
import { ExpenseForm } from "@/components/ExpenseForm";
import { CategoryManager } from "@/components/CategoryManager";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { CSVExcelUpload } from "@/components/CSVExcelUpload";
import { VoiceExpenseInput } from "@/components/VoiceExpenseInput";
import { getExpenses, saveExpenses, Expense } from "@/lib/storage";
import { toast } from "sonner";
import { Wallet, PieChart, Lightbulb, Upload as UploadIcon, Settings } from "lucide-react";

export default function Transactions() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  const handleAddExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Transaction added!");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Transaction deleted");
  };

  const handleBulkAddExpenses = (newExpenses: Omit<Expense, "id">[]) => {
    const withIds = newExpenses.map((e) => ({ ...e, id: crypto.randomUUID() }));
    const updated = [...expenses, ...withIds];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success(`${newExpenses.length} transactions imported!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div>
        <h1 className="text-4xl font-bold gradient-text">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your income & expenses
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Wallet className="icon-button" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <PieChart className="icon-button" />
            Details
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="icon-button" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <UploadIcon className="icon-button" />
            Import
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="icon-button" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ExpensesSummary expenses={expenses} />
          <ExpenseBadges expenses={expenses} />
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <ExpenseForm onAdd={handleAddExpense} />
          <TransactionTable transactions={expenses} onDelete={handleDeleteExpense} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <ExpenseInsights expenses={expenses} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Quick Voice Input</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceExpenseInput onExpenseDetected={handleAddExpense} />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Import CSV / Excel</CardTitle>
              </CardHeader>
              <CardContent>
                <CSVExcelUpload
                  onTransactionsParsed={(result) => {
                    const transactions = result.transactions.map((t) => ({
                      date: t.date,
                      description: t.description,
                      amount: t.amount,
                      type: (t.amount > 0 ? "Income" : "Expense") as "Income" | "Expense",
                      category: (t.category || "Other") as any,
                      recurring: false,
                    }));
                    handleBulkAddExpenses(transactions);
                  }}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Import Bank Statement (PDF)</CardTitle>
              </CardHeader>
              <CardContent>
                <BankStatementUpload onTransactionsExtracted={handleBulkAddExpenses} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <BudgetLimitsManager expenses={expenses} />
          <CategoryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
