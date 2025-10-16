import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import { IncomeTracker } from "@/components/IncomeTracker";
import { FinancialGoals } from "@/components/FinancialGoals";
import { InteractiveExpenseChart } from "@/components/InteractiveExpenseChart";
import { InteractiveInvestmentChart } from "@/components/InteractiveInvestmentChart";
import { EnhancedAIInsights } from "@/components/EnhancedAIInsights";
import { FinancialProfile } from "@/components/FinancialProfile";
import { NetWorthHeroCard } from "@/components/NetWorthHeroCard";
import { SavingsAllocationCard } from "@/components/SavingsAllocationCard";
import { ImpactOnInvestmentsWidget } from "@/components/ImpactOnInvestmentsWidget";
import { AdvancedInsightsCard } from "@/components/AdvancedInsightsCard";
import { GamificationPanel } from "@/components/GamificationPanel";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Download,
  FileText,
  RefreshCw,
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
import { useSavingsPotential } from "@/hooks/useSavingsPotential";
import { useExpenseCorrelation } from "@/hooks/useExpenseCorrelation";
import { useInvestmentSuggestions } from "@/hooks/useInvestmentSuggestions";
import { migrateLocalStorageToDatabase, hasPendingMigration } from "@/lib/migrateExpenses";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLivePricePolling, useManualPriceRefresh } from "@/hooks/useLivePricePolling";
import { useInvestments } from "@/hooks/useInvestments";
import { useExpenses } from "@/hooks/useExpenses";
import { Badge } from "@/components/ui/badge";

export default function DashboardHome() {
  const { formatCurrency } = useApp();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  
  // Use new hooks for real-time data
  const { expenses } = useExpenses();
  const { investments, totalValue, totalCost, totalGain, gainPercentage } = useInvestments();
  
  const { data: savingsData } = useSavingsPotential();
  const { data: correlationData, isLoading: correlationLoading } = useExpenseCorrelation();
  const { suggestions, acceptSuggestion, rejectSuggestion } = useInvestmentSuggestions();
  const { refreshPrices } = useManualPriceRefresh();

  // Enable automatic price polling (every 5 minutes)
  useLivePricePolling(true);

  useEffect(() => {
    const initData = async () => {
      // Check for pending migration
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

  // Calculate KPIs using real-time data from hooks
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  // Calculate net worth: cash balance + investment value
  const netWorth = useMemo(() => {
    return netBalance + totalValue;
  }, [netBalance, totalValue]);

  const handleExportCSV = () => {
    exportToCSV({
      expenses: expenses as any,
      investments: investments as any,
      goals,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue: totalValue },
    });
    toast.success("CSV exported successfully!");
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="gradient-text animate-float">Trace</span>
              <span className="text-foreground/80"> Cash</span>
            </h1>
            <p className="text-muted-foreground text-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Complete Financial Management
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshPrices}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Aggiorna Prezzi
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Net Worth Hero Card with AI Insight */}
        <NetWorthHeroCard
          netWorth={netWorth}
          cashBalance={netBalance}
          investmentsValue={totalValue}
          monthlyChange={gainPercentage}
          onRefreshPrices={refreshPrices}
        />

        {/* Savings & Quick Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SavingsAllocationCard
            availableSavings={savingsData?.available_savings || 0}
            savingsRate={savingsData?.savings_rate || 0}
            suggestion={savingsData?.suggestion || 'Inizia a tracciare per suggerimenti'}
            onInvestClick={() => setShowInvestDialog(true)}
          />
          <KPICard
            title="Valore Portfolio"
            value={formatCurrency(totalValue)}
            icon={TrendingUp}
            change={`${totalGain > 0 ? "+" : ""}${gainPercentage.toFixed(2)}%`}
            changeType={totalGain > 0 ? "positive" : "negative"}
            tooltip="Rendimento totale investimenti"
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
            title="Savings Rate"
            value={`${(savingsData?.savings_rate || 0).toFixed(1)}%`}
            icon={PiggyBank}
            change={savingsData?.savings_rate >= 20 ? "Excellent" : savingsData?.savings_rate >= 10 ? "Good" : "Needs improvement"}
            changeType={savingsData?.savings_rate >= 20 ? "positive" : savingsData?.savings_rate >= 10 ? "neutral" : "negative"}
            tooltip="Percentage of income saved"
          />
        </div>

        {/* Impact Analysis Widget */}
        <ImpactOnInvestmentsWidget
          correlationData={correlationData || null}
          loading={correlationLoading}
          onViewRecommendations={() => window.location.href = '/insights'}
        />

        {/* Financial Profile */}
        <FinancialProfile />

        {/* Financial Goals */}
        <FinancialGoals />

        {/* Advanced AI Insights */}
        <AdvancedInsightsCard />

        {/* Gamification & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GamificationPanel />
          <LeaderboardWidget />
        </div>

        {/* Legacy Enhanced AI Insights (if needed) */}
        <EnhancedAIInsights
          expenses={expenses as any}
          investments={investments as any}
        />

        {/* Interactive Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveExpenseChart expenses={expenses as any} />
          <InteractiveInvestmentChart investments={investments as any} />
        </div>

        {/* Income Tracker */}
        <IncomeTracker expenses={expenses as any} />

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

        {/* Investment Suggestions Dialog */}
        <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Investment Suggestions</DialogTitle>
              <DialogDescription>
                AI-powered recommendations based on your savings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {suggestions && suggestions.length > 0 ? (
                suggestions.map(suggestion => (
                  <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">
                        {suggestion.asset_type}
                      </span>
                      <span className="text-lg font-bold">
                        {formatCurrency(suggestion.amount_suggested)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.reasoning}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          acceptSuggestion(suggestion.id);
                          setShowInvestDialog(false);
                        }}
                        className="flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectSuggestion(suggestion.id)}
                        className="flex-1"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No suggestions available yet. Keep saving to receive investment recommendations!
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
