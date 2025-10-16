import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, DollarSign, TrendingUp, PiggyBank, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExpenses } from "@/hooks/useExpenses";
import { useInvestments } from "@/hooks/useInvestments";
import { useSavingsPotential } from "@/hooks/useSavingsPotential";
import { useExpenseCorrelation } from "@/hooks/useExpenseCorrelation";
import { useInvestmentSuggestions } from "@/hooks/useInvestmentSuggestions";
import { useLivePricePolling, useManualPriceRefresh } from "@/hooks/useLivePricePolling";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { migrateLocalStorageToDatabase, hasPendingMigration } from "@/lib/migrateExpenses";
import { getGoals, saveGoals, FinancialGoal } from "@/lib/storage";
import FinanceScoreCard from "@/components/FinanceScoreCard";
import BalanceCard from "@/components/BalanceCard";
import StatCard from "@/components/StatCard";
import ExpenseBreakdownCard from "@/components/ExpenseBreakdownCard";
import CashflowCard from "@/components/CashflowCard";
import SavingPlansCard from "@/components/SavingPlansCard";
import { FinancialGoals } from "@/components/FinancialGoals";
import { useApp } from "@/contexts/AppContext";

export default function DashboardHome() {
  const { formatCurrency } = useApp();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { expenses } = useExpenses();
  const { investments, totalValue } = useInvestments();
  const { suggestions: investmentSuggestions } = useInvestmentSuggestions();
  const { refreshPrices } = useManualPriceRefresh();

  useLivePricePolling(true);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && hasPendingMigration()) {
        await migrateLocalStorageToDatabase(user.id);
      }
      setGoals(getGoals());
    };
    initData();
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
    toast.success("Prices refreshed!");
  };

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const totalInvestments = totalValue;
  const totalNetWorth = netBalance + totalInvestments;

  const handleExportCSV = () => {
    exportToCSV({
      expenses: expenses as any,
      investments: investments as any,
      goals,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue: totalValue },
    });
    toast.success("CSV exported!");
  };

  const handleExportPDF = () => {
    exportToPDF({
      expenses: expenses as any,
      investments: investments as any,
      goals,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue: totalValue },
    });
    toast.success("PDF report generated!");
  };

  const financeScore = 75;
  const totalBalance = totalNetWorth;
  const accounts = [
    { name: "Premium Plus", amount: totalInvestments * 0.6, type: "Investment", icon: 'card' as const, color: "#10b981" },
    { name: "Cash Account", amount: totalInvestments * 0.4, type: "Savings", icon: 'wallet' as const, color: "#3b82f6" },
  ];

  const categoryBreakdown = expenses.reduce((acc, expense) => {
    const existing = acc.find(c => c.name === expense.category);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({
        name: expense.category,
        amount: expense.amount,
        color: ['#1E3A26', '#81C784', '#9C27B0', '#BDBDBD'][acc.length % 4]
      });
    }
    return acc;
  }, [] as Array<{ name: string; amount: number; color: string }>).slice(0, 4);

  const cashflowData = [
    { day: 'Mon', income: 4200, expense: 2400 },
    { day: 'Tue', income: 3800, expense: 2200 },
    { day: 'Wed', income: 5000, expense: 2800 },
    { day: 'Thu', income: 4600, expense: 2600 },
    { day: 'Fri', income: 5200, expense: 3000 },
    { day: 'Sat', income: 3200, expense: 1800 },
    { day: 'Sun', income: 2800, expense: 1500 },
  ];

  const savingPlans = [
    { name: "Emergency Fund", current: 8000, target: 20000, color: "#81C784" },
    { name: "Retirement", current: 15000, target: 60000, color: "#9C27B0" },
  ];

  const monthlyIncome = 18000;
  const monthlyExpenses = totalExpenses / 12;
  const monthlySavingsAmount = monthlyIncome - monthlyExpenses;

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base">Your complete financial overview</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 rounded-2xl"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
              className="gap-2 rounded-2xl"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 rounded-2xl"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FinanceScoreCard score={financeScore} />
          <BalanceCard totalBalance={totalBalance} accounts={accounts} />
          <ExpenseBreakdownCard categories={categoryBreakdown} totalExpenses={totalExpenses} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={DollarSign}
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            change={8.2}
            changeType="increase"
            delay={0.3}
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            change={3.1}
            changeType="decrease"
            delay={0.4}
          />
          <StatCard
            icon={PiggyBank}
            label="Monthly Savings"
            value={formatCurrency(monthlySavingsAmount)}
            change={12.5}
            changeType="increase"
            delay={0.5}
          />
          <StatCard
            icon={Target}
            label="Investment"
            value={formatCurrency(totalInvestments)}
            change={5.8}
            changeType="increase"
            delay={0.6}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashflowCard data={cashflowData} />
          </div>
          <SavingPlansCard plans={savingPlans} />
        </div>

        <FinancialGoals />

        <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Investment Suggestions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {investmentSuggestions && investmentSuggestions.length > 0 ? (
                investmentSuggestions.map((suggestion: any) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <p className="text-sm">{suggestion.reasoning}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No suggestions available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
