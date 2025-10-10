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
import { FinancialGoals } from "@/components/FinancialGoals";
import { NetWorthTracker } from "@/components/NetWorthTracker";
import { FinancialHealthScore } from "@/components/FinancialHealthScore";
import { EmergencyFundTracker } from "@/components/EmergencyFundTracker";
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
  getGoals,
  saveGoals,
  clearUser,
  exportToCSV,
  Expense,
  Investment,
  FinancialGoal,
  calculatePortfolioValue,
} from "@/lib/storage";
import { toast } from "sonner";

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
    setInvestments(getInvestments());
    setGoals(getGoals());
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

  const handleAddGoal = (goal: Omit<FinancialGoal, "id">) => {
    const newGoal = { ...goal, id: crypto.randomUUID() };
    const updated = [...goals, newGoal];
    setGoals(updated);
    saveGoals(updated);
    toast.success("Goal created successfully!");
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
    toast.success("Goal deleted");
  };

  const handleUpdateGoal = (id: string, currentAmount: number) => {
    const updated = goals.map((g) =>
      g.id === id ? { ...g, currentAmount } : g
    );
    setGoals(updated);
    saveGoals(updated);
    toast.success("Goal updated!");
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
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MyFinance Pro
            </h2>
            <p className="text-muted-foreground mt-1">
              Professional Financial Planning & Investment Tracking
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Financial Goals Section */}
        <FinancialGoals
          goals={goals}
          onAdd={handleAddGoal}
          onDelete={handleDeleteGoal}
          onUpdate={handleUpdateGoal}
        />

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

        {/* Financial Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NetWorthTracker expenses={expenses} investments={investments} />
          </div>
          <div className="space-y-6">
            <EmergencyFundTracker expenses={expenses} />
          </div>
        </div>

        {/* Financial Health */}
        <FinancialHealthScore expenses={expenses} investments={investments} />

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