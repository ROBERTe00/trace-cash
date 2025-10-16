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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6">
        <div className="relative z-10">
          <h1 className="text-section">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your income & expenses
          </p>
        </div>
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl flex-wrap gap-1">
          <TabsTrigger 
            value="overview" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Wallet className="icon-button" />
              Overview
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <PieChart className="icon-button" />
              Details
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="insights" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="icon-button" />
              Insights
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="upload" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <UploadIcon className="icon-button" />
              Import
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Settings className="icon-button" />
              Settings
            </div>
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
