import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, DollarSign, TrendingUp, PiggyBank, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExpenses } from "@/hooks/useExpenses";
import { useInvestments } from "@/hooks/useInvestments";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useInvestmentSuggestions } from "@/hooks/useInvestmentSuggestions";
import { useLivePricePolling, useManualPriceRefresh } from "@/hooks/useLivePricePolling";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { migrateLocalStorageToDatabase, hasPendingMigration } from "@/lib/migrateExpenses";
import FinanceScoreCard from "@/components/FinanceScoreCard";
import BalanceCard from "@/components/BalanceCard";
import StatCard from "@/components/StatCard";
import ExpenseBreakdownCard from "@/components/ExpenseBreakdownCard";
import CashflowCard from "@/components/CashflowCard";
import SavingPlansCard from "@/components/SavingPlansCard";
import { FinancialGoals } from "@/components/FinancialGoals";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { LoadingDashboard } from "@/components/LoadingDashboard";
import { useApp } from "@/contexts/AppContext";
import { startOfMonth, eachDayOfInterval, format } from "date-fns";

export default function DashboardHome() {
  const { formatCurrency } = useApp();
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const { expenses, isLoading: loadingExpenses } = useExpenses();
  const { investments, totalValue, isLoading: loadingInvestments } = useInvestments();
  const { goals, isLoading: loadingGoals } = useFinancialGoals();
  const { suggestions: investmentSuggestions } = useInvestmentSuggestions();
  const { refreshPrices } = useManualPriceRefresh();

  useLivePricePolling(true);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      if (hasPendingMigration()) {
        await migrateLocalStorageToDatabase(user.id);
      }
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(profile);
      setIsLoadingProfile(false);
      
      if (profile?.created_at) {
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        setShowWelcome(daysSinceCreation < 7);
      }
    };
    initData();
  }, []);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
    toast.success("Prices refreshed!");
  };

  // Show loading state
  const isLoading = loadingExpenses || loadingInvestments || loadingGoals || isLoadingProfile;
  
  if (isLoading) {
    return <LoadingDashboard />;
  }

  // Calculate real financial data
  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const totalInvestments = totalValue;
  const cashAvailable = userProfile?.cash_available || 0;
  const totalNetWorth = cashAvailable + totalInvestments;

  const handleExportCSV = () => {
    exportToCSV({
      expenses: expenses as any,
      investments: investments as any,
      goals: goals as any,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue: totalValue },
    });
    toast.success("CSV exported!");
  };

  const handleExportPDF = () => {
    exportToPDF({
      expenses: expenses as any,
      investments: investments as any,
      goals: goals as any,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue: totalValue },
    });
    toast.success("PDF report generated!");
  };

  // Calculate finance score based on real data
  const calculateFinanceScore = () => {
    let score = 50; // Base score
    
    // Income vs Expenses ratio (max 25 points)
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
      score += Math.min(25, savingsRate / 4);
    }
    
    // Has investments (15 points)
    if (investments.length > 0) score += 15;
    
    // Has goals (10 points)
    if (goals.length > 0) score += 10;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const financeScore = calculateFinanceScore();
  const totalBalance = totalNetWorth;
  
  // Real accounts based on actual data
  const accounts = [
    { name: "Investments", amount: totalInvestments, type: "Investment", icon: 'card' as const, color: "#10b981" },
    { name: "Cash Available", amount: cashAvailable, type: "Cash", icon: 'wallet' as const, color: "#3b82f6" },
  ].filter(acc => acc.amount > 0);

  // Real category breakdown from expenses
  const categoryBreakdown = expenses
    .filter(e => e.type === "Expense")
    .reduce((acc, expense) => {
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
    }, [] as Array<{ name: string; amount: number; color: string }>)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  // Real cashflow data from last 7 days
  const getLast7DaysCashflow = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExpenses = expenses.filter(e => 
        e.type === "Expense" && e.date === dayStr
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const dayIncome = expenses.filter(e => 
        e.type === "Income" && e.date === dayStr
      ).reduce((sum, e) => sum + e.amount, 0);
      
      return {
        day: format(day, 'EEE'),
        income: dayIncome,
        expense: dayExpenses
      };
    });
  };

  const cashflowData = getLast7DaysCashflow();

  // Real saving plans from financial goals
  const savingPlans = goals
    .filter(g => g.goal_type === 'savings' || g.goal_type === 'emergency_fund')
    .map(g => ({
      name: g.title,
      current: g.current_amount,
      target: g.target_amount,
      color: g.goal_type === 'emergency_fund' ? "#81C784" : "#9C27B0"
    }));

  // Real monthly calculations
  const monthlyIncome = userProfile?.monthly_income || 0;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const currentMonthExpenses = expenses
    .filter(e => e.type === "Expense" && new Date(e.date) >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpenses = currentMonthExpenses;
  const monthlySavingsAmount = monthlyIncome - monthlyExpenses;

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        {showWelcome && <WelcomeBanner />}
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-section font-extrabold tracking-tight mb-2 break-words">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-base truncate">Your complete financial overview</p>
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
