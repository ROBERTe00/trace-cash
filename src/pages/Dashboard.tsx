import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { ExpenseForm } from "@/components/ExpenseForm";
import { InvestmentForm } from "@/components/InvestmentForm";
import { TransactionTable } from "@/components/TransactionTable";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioChart } from "@/components/PortfolioChart";
import { ExpenseChart } from "@/components/ExpenseChart";
import { TrendChart } from "@/components/TrendChart";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RecurringExpenses } from "@/components/RecurringExpenses";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
} from "lucide-react";
import {
  getExpenses,
  saveExpenses,
  getInvestments,
  saveInvestments,
  clearUser,
  exportToCSV,
  Expense,
  Investment,
  calculatePortfolioValue,
} from "@/lib/storage";
import { toast } from "sonner";

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
    setInvestments(getInvestments());
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

  const handleAddInvestment = (investment: Omit<Investment, "id">) => {
    const newInvestment = { ...investment, id: crypto.randomUUID() };
    const updated = [...investments, newInvestment];
    setInvestments(updated);
    saveInvestments(updated);
    toast.success("Investment added successfully!");
  };

  const handleDeleteInvestment = (id: string) => {
    const updated = investments.filter((i) => i.id !== id);
    setInvestments(updated);
    saveInvestments(updated);
    toast.success("Investment deleted");
  };

  const handleLogout = () => {
    clearUser();
    window.location.reload();
  };

  const handleExport = () => {
    exportToCSV();
    toast.success("Data exported successfully!");
  };

  // Calculate KPIs
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const portfolioValue = calculatePortfolioValue(investments);

  const averageYield =
    investments.length > 0
      ? investments.reduce((sum, inv) => {
          const initial = inv.quantity * inv.purchasePrice;
          const current = inv.quantity * inv.currentPrice;
          return sum + ((current - initial) / initial) * 100;
        }, 0) / investments.length
      : 0;

  return (
    <Layout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header with Export */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              Track your finances and investments
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Portfolio"
            value={`€${portfolioValue.toFixed(2)}`}
            icon={PiggyBank}
            change={`${averageYield >= 0 ? "+" : ""}${averageYield.toFixed(2)}% avg`}
            changeType={averageYield >= 0 ? "positive" : "negative"}
          />
          <KPICard
            title="Net Balance"
            value={`€${netBalance.toFixed(2)}`}
            icon={Wallet}
            change={`${netBalance >= 0 ? "Positive" : "Negative"} balance`}
            changeType={netBalance >= 0 ? "positive" : "negative"}
          />
          <KPICard
            title="Total Income"
            value={`€${totalIncome.toFixed(2)}`}
            icon={TrendingUp}
            change={`${expenses.filter((e) => e.type === "Income").length} transactions`}
            changeType="positive"
          />
          <KPICard
            title="Total Expenses"
            value={`€${totalExpenses.toFixed(2)}`}
            icon={TrendingDown}
            change={`${expenses.filter((e) => e.type === "Expense").length} transactions`}
            changeType="negative"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioChart investments={investments} />
          <ExpenseChart expenses={expenses} />
          <TrendChart expenses={expenses} />
          <BudgetTracker expenses={expenses} />
        </div>

        {/* Recurring Expenses */}
        <RecurringExpenses expenses={expenses} />

        {/* Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseForm onAdd={handleAddExpense} />
          <InvestmentForm onAdd={handleAddInvestment} />
        </div>

        {/* Tables */}
        <div className="space-y-6">
          <TransactionTable
            transactions={expenses}
            onDelete={handleDeleteExpense}
          />
          <InvestmentTable
            investments={investments}
            onDelete={handleDeleteInvestment}
          />
        </div>
      </div>
    </Layout>
  );
}