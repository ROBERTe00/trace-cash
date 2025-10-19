import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, DollarSign, TrendingUp, PiggyBank, Target, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useExpenses } from "@/hooks/useExpenses";
import { useInvestments } from "@/hooks/useInvestments";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useLivePricePolling, useManualPriceRefresh } from "@/hooks/useLivePricePolling";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { migrateLocalStorageToDatabase, hasPendingMigration } from "@/lib/migrateExpenses";
import FinanceScoreCard from "@/components/FinanceScoreCard";
import StatCard from "@/components/StatCard";
import ExpenseBreakdownCard from "@/components/ExpenseBreakdownCard";
import CashflowCard from "@/components/CashflowCard";
import { FinancialGoals } from "@/components/FinancialGoals";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { LoadingDashboard } from "@/components/LoadingDashboard";
import { NetWorthHeroCard } from "@/components/NetWorthHeroCard";
import { AIInsightsCard, Insight } from "@/components/AIInsightsCard";
import { RecentTransactionsList } from "@/components/RecentTransactionsList";
import { PDFParserTest } from "@/components/PDFParserTest";
import { FrontendUpload } from "@/components/FrontendUpload";
import { DefinitivePDFTest } from "@/components/DefinitivePDFTest";
import { OCRTest } from "@/components/OCRTest";
import { useApp } from "@/contexts/AppContext";
import { startOfMonth, subMonths, format, eachDayOfInterval } from "date-fns";

export default function DashboardHome() {
  const { formatCurrency } = useApp();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const { expenses, isLoading: loadingExpenses } = useExpenses();
  const { investments, totalValue, isLoading: loadingInvestments } = useInvestments();
  const { goals, isLoading: loadingGoals } = useFinancialGoals();
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

  // Helper: Calculate monthly trend
  const calculateMonthlyTrend = () => {
    const lastMonth = subMonths(new Date(), 1);
    const lastMonthExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date >= lastMonth && date < startOfMonth(new Date());
    });
    
    const lastMonthIncome = lastMonthExpenses
      .filter(e => e.type === 'Income')
      .reduce((sum, e) => sum + e.amount, 0);
    const lastMonthExpense = lastMonthExpenses
      .filter(e => e.type === 'Expense')
      .reduce((sum, e) => sum + e.amount, 0);
    const lastMonthNetWorth = cashAvailable + totalInvestments; // Simplified
    
    const change = totalNetWorth - lastMonthNetWorth;
    const percentage = lastMonthNetWorth > 0 ? (change / lastMonthNetWorth) * 100 : 0;
    
    return {
      percentage,
      amount: change,
      period: 'vs last month'
    };
  };

  // Helper: Generate AI insights
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    // Insight 1: Savings success
    if (monthlySavingsAmount > 0) {
      const savingsRate = monthlyIncome > 0 ? (monthlySavingsAmount / monthlyIncome) * 100 : 0;
      insights.push({
        type: 'success',
        icon: DollarSign,
        text: `💰 Great job! You saved ${formatCurrency(monthlySavingsAmount)} this month (${savingsRate.toFixed(1)}% savings rate)`
      });
    }
    
    // Insight 2: Top spending category alert
    if (categoryBreakdown.length > 0 && monthlyIncome > 0) {
      const topCategory = categoryBreakdown[0];
      const categoryPercent = (topCategory.amount / monthlyIncome) * 100;
      if (categoryPercent > 30) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          text: `⚠️ ${topCategory.name} expenses are high (${categoryPercent.toFixed(0)}% of income). Consider optimizing this category.`
        });
      }
    }
    
    // Insight 3: Goal projection
    if (goals.length > 0 && monthlySavingsAmount > 0) {
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length > 0) {
        const nextGoal = activeGoals[0];
        const remaining = nextGoal.target_amount - nextGoal.current_amount;
        const monthsToGoal = Math.ceil(remaining / monthlySavingsAmount);
        if (monthsToGoal > 0 && monthsToGoal < 100) {
          insights.push({
            type: 'info',
            icon: Target,
            text: `🎯 At your current savings rate, you'll reach "${nextGoal.title}" in ${monthsToGoal} months!`
          });
        }
      }
    }
    
    // Insight 4: Investment suggestion
    if (cashAvailable > 1000 && totalInvestments < cashAvailable * 2) {
      insights.push({
        type: 'tip',
        icon: TrendingUp,
        text: `💡 You have ${formatCurrency(cashAvailable)} in cash. Consider investing ${formatCurrency(cashAvailable * 0.5)} in diversified assets.`,
        action: {
          label: 'View Investments',
          onClick: () => navigate('/investments')
        }
      });
    }
    
    return insights.slice(0, 3);
  };

  const monthlyChange = totalInvestments > 0 ? 
    ((totalInvestments - (totalInvestments * 0.95)) / (totalInvestments * 0.95)) * 100 : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 w-full pb-safe">
        {showWelcome && <WelcomeBanner />}
        
        {/* 1. HERO: Net Worth Card */}
        <NetWorthHeroCard
          netWorth={totalNetWorth}
          cashBalance={cashAvailable}
          investmentsValue={totalInvestments}
          monthlyChange={monthlyChange}
          onRefreshPrices={handleRefresh}
        />

        {/* 2. AI Insights + Finance Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <AIInsightsCard insights={generateInsights()} autoRotate={true} />
          </div>
          <FinanceScoreCard score={financeScore} />
        </div>

        {/* 3. Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={DollarSign}
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            delay={0.1}
          />
          <StatCard
            icon={TrendingUp}
            label="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            delay={0.2}
          />
          <StatCard
            icon={PiggyBank}
            label="Monthly Savings"
            value={formatCurrency(monthlySavingsAmount)}
            delay={0.3}
          />
          <StatCard
            icon={Target}
            label="Investments"
            value={formatCurrency(totalInvestments)}
            delay={0.4}
          />
        </div>

        {/* 4. Enhanced Cashflow */}
        <CashflowCard expenses={expenses} defaultTimeRange="1m" />

        {/* 5. Expense Breakdown + Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ExpenseBreakdownCard categories={categoryBreakdown} totalExpenses={totalExpenses} />
          <RecentTransactionsList 
            transactions={expenses.slice().sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )}
            onViewAll={() => navigate('/transactions')}
          />
        </div>

        {/* 6. Financial Goals */}
        <FinancialGoals />

        {/* 7. PDF Parser Test (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-4">
            <OCRTest />
            <DefinitivePDFTest />
            <PDFParserTest />
            <FrontendUpload 
              onTransactionsParsed={(transactions, metadata) => {
                console.log('Transactions parsed:', transactions.length);
                toast.success(`Processed ${transactions.length} transactions`);
              }}
              onError={(error) => {
                console.error('Upload error:', error);
                toast.error(error);
              }}
            />
          </div>
        )}

        {/* 8. Export Actions */}
        <div className="flex justify-end gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            className="gap-2 rounded-2xl"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF}
            className="gap-2 rounded-2xl"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
