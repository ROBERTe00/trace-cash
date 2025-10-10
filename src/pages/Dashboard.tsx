import { useState, useEffect } from "react";
import { LoadingDashboard } from "@/components/LoadingDashboard";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { ExpenseForm } from "@/components/ExpenseForm";
import { InvestmentForm } from "@/components/InvestmentForm";
import { TransactionTable } from "@/components/TransactionTable";
import { InvestmentTable } from "@/components/InvestmentTable";
import { BankStatementUpload } from "@/components/BankStatementUpload";
import { ExpenseTimeSelector } from "@/components/ExpenseTimeSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PortfolioChart } from "@/components/PortfolioChart";
import { ExpenseChart } from "@/components/ExpenseChart";
import { TrendChart } from "@/components/TrendChart";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RecurringExpenses } from "@/components/RecurringExpenses";
import { FinancialGoals } from "@/components/FinancialGoals";
import { NetWorthTracker } from "@/components/NetWorthTracker";
import { FinancialHealthScore } from "@/components/FinancialHealthScore";
import { EmergencyFundTracker } from "@/components/EmergencyFundTracker";
import { IncomeTracker } from "@/components/IncomeTracker";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { InsightsPanel } from "@/components/InsightsPanel";
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
import { useApp } from "@/contexts/AppContext";

export default function Dashboard() {
  const { formatCurrency } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth experience
    setTimeout(() => {
      setExpenses(getExpenses());
      setInvestments(getInvestments());
      setGoals(getGoals());
      setLoading(false);
    }, 800);
  }, []);

  const handleAddExpense = (expense: Omit<Expense, "id">) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success("Transaction added successfully!");
  };

  const handleBulkAddExpenses = (newExpenses: Omit<Expense, "id">[]) => {
    const withIds = newExpenses.map(e => ({ ...e, id: crypto.randomUUID() }));
    const updated = [...expenses, ...withIds];
    setExpenses(updated);
    saveExpenses(updated);
    toast.success(`${newExpenses.length} transactions added!`);
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

  const handleUpdateInvestmentPrice = (id: string, newPrice: number) => {
    const updated = investments.map((i) =>
      i.id === id ? { ...i, currentPrice: newPrice } : i
    );
    setInvestments(updated);
    saveInvestments(updated);
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

  if (loading) {
    return (
      <Layout onLogout={handleLogout}>
        <LoadingDashboard />
      </Layout>
    );
  }

  return (
    <TooltipProvider>
      <Layout onLogout={handleLogout}>
        <div className="space-y-8">
        {/* Header with Export */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="gradient-text animate-float">MyFinance</span>
              <span className="text-foreground/80"> Pro</span>
            </h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Professional Financial Planning & Investment Tracking
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            size="lg"
            className="hover-lift group border-2"
          >
            <Download className="h-5 w-5 mr-2 group-hover:animate-bounce" />
            Export Data
          </Button>
        </div>

        {/* Financial Goals Section */}
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <FinancialGoals
            goals={goals}
            onAdd={handleAddGoal}
            onDelete={handleDeleteGoal}
            onUpdate={handleUpdateGoal}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <KPICard
            title="Total Portfolio"
            value={formatCurrency(portfolioValue)}
            icon={PiggyBank}
            change={`${averageYield >= 0 ? "+" : ""}${averageYield.toFixed(2)}% avg`}
            changeType={averageYield >= 0 ? "positive" : "negative"}
          />
          <KPICard
            title="Net Balance"
            value={formatCurrency(netBalance)}
            icon={Wallet}
            change={`${netBalance >= 0 ? "Positive" : "Negative"} balance`}
            changeType={netBalance >= 0 ? "positive" : "negative"}
          />
          <KPICard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            icon={TrendingUp}
            change={`${expenses.filter((e) => e.type === "Income").length} transactions`}
            changeType="positive"
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            change={`${expenses.filter((e) => e.type === "Expense").length} transactions`}
            changeType="negative"
          />
        </div>

        {/* Income Tracker Section */}
        <IncomeTracker expenses={expenses} />

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

        {/* Portfolio Analysis */}
        <PortfolioAnalysis investments={investments} />

        {/* Smart Insights */}
        <InsightsPanel investments={investments} expenses={expenses} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioChart investments={investments} />
          <ExpenseChart expenses={expenses} />
          <TrendChart expenses={expenses} />
          <BudgetTracker expenses={expenses} />
        </div>

        {/* Bank Statement Upload */}
        <BankStatementUpload onTransactionsExtracted={handleBulkAddExpenses} />

        {/* Expense Time Analysis */}
        <ExpenseTimeSelector expenses={expenses} />

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
            onUpdatePrice={handleUpdateInvestmentPrice}
          />
        </div>
        </div>
      </Layout>
    </TooltipProvider>
  );
}