import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import { IncomeTracker } from "@/components/IncomeTracker";
import { FinancialGoals } from "@/components/FinancialGoals";
import { AIAdvicePanel } from "@/components/AIAdvicePanel";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getExpenses,
  saveExpenses,
  getInvestments,
  saveInvestments,
  getGoals,
  saveGoals,
  Expense,
  Investment,
  FinancialGoal,
  calculatePortfolioValue,
} from "@/lib/storage";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardHome() {
  const { formatCurrency } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  useEffect(() => {
    setExpenses(getExpenses());
    setInvestments(getInvestments());
    setGoals(getGoals());
  }, []);

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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="gradient-text animate-float">MyFinance</span>
              <span className="text-foreground/80"> Pro</span>
            </h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Professional Financial Dashboard
            </p>
          </div>
        </div>

        {/* Financial Goals */}
        <FinancialGoals
          goals={goals}
          onAdd={handleAddGoal}
          onDelete={handleDeleteGoal}
          onUpdate={handleUpdateGoal}
        />

        {/* AI Advice Panel */}
        <AIAdvicePanel 
          expenses={expenses}
          investments={investments}
          goals={goals}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Portfolio"
            value={formatCurrency(portfolioValue)}
            icon={PiggyBank}
            change={`${averageYield >= 0 ? "+" : ""}${averageYield.toFixed(
              2
            )}% avg`}
            changeType={averageYield >= 0 ? "positive" : "negative"}
            tooltip="Total value of all your investments"
          />
          <KPICard
            title="Net Balance"
            value={formatCurrency(netBalance)}
            icon={Wallet}
            change={`${netBalance >= 0 ? "Positive" : "Negative"} balance`}
            changeType={netBalance >= 0 ? "positive" : "negative"}
            tooltip="Income minus expenses"
          />
          <KPICard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            icon={TrendingUp}
            change={`${
              expenses.filter((e) => e.type === "Income").length
            } transactions`}
            changeType="positive"
            tooltip="All income sources"
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            change={`${
              expenses.filter((e) => e.type === "Expense").length
            } transactions`}
            changeType="negative"
            tooltip="All your expenses"
          />
        </div>

        {/* Income Tracker */}
        <IncomeTracker expenses={expenses} />

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/expenses">
            <div className="glass-card p-6 hover-lift cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">Track Expenses</h3>
                  <p className="text-sm text-muted-foreground">
                    View detailed spending analysis
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/investments">
            <div className="glass-card p-6 hover-lift cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    Manage Investments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Portfolio analysis & live prices
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/insights">
            <div className="glass-card p-6 hover-lift cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">View Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Smart recommendations & tips
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </TooltipProvider>
  );
}
