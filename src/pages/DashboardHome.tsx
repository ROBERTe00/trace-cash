import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import { IncomeTracker } from "@/components/IncomeTracker";
import { FinancialGoals } from "@/components/FinancialGoals";
import { InteractiveExpenseChart } from "@/components/InteractiveExpenseChart";
import { InteractiveInvestmentChart } from "@/components/InteractiveInvestmentChart";
import { EnhancedAIInsights } from "@/components/EnhancedAIInsights";
import { FinancialProfile } from "@/components/FinancialProfile";
import { NetWorthSummary } from "@/components/NetWorthSummary";
import { SavingsAllocationCard } from "@/components/SavingsAllocationCard";
import { ImpactOnInvestmentsWidget } from "@/components/ImpactOnInvestmentsWidget";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Download,
  FileText,
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

export default function DashboardHome() {
  const { formatCurrency } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  
  const { data: savingsData } = useSavingsPotential();
  const { data: correlationData, isLoading: correlationLoading } = useExpenseCorrelation();
  const { suggestions, acceptSuggestion, rejectSuggestion } = useInvestmentSuggestions();

  useEffect(() => {
    const initData = async () => {
      // Check for pending migration
      const { data: { user } } = await supabase.auth.getUser();
      if (user && hasPendingMigration()) {
        await migrateLocalStorageToDatabase(user.id);
      }
      
      setExpenses(getExpenses());
      setInvestments(getInvestments());
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

  const handleExportCSV = () => {
    exportToCSV({
      expenses,
      investments,
      goals,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue },
    });
    toast.success("CSV exported successfully!");
  };

  const handleExportPDF = () => {
    exportToPDF({
      expenses,
      investments,
      goals,
      summary: { totalIncome, totalExpenses, netBalance, portfolioValue },
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

        {/* Net Worth Summary - Hero Section */}
        <NetWorthSummary
          totalValue={portfolioValue + netBalance}
          expenses={totalExpenses}
          investments={portfolioValue}
          trend={netBalance > 0 ? 'up' : netBalance < 0 ? 'down' : 'neutral'}
          onConnectBroker={() => window.location.href = '/investments'}
          hasInvestments={investments.length > 0}
        />

        {/* Savings & Quick Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SavingsAllocationCard
            availableSavings={savingsData?.available_savings || 0}
            savingsRate={savingsData?.savings_rate || 0}
            suggestion={savingsData?.suggestion || 'Start tracking to see suggestions'}
            onInvestClick={() => setShowInvestDialog(true)}
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
        <FinancialGoals
          goals={goals}
          onAdd={handleAddGoal}
          onDelete={handleDeleteGoal}
          onUpdate={handleUpdateGoal}
        />

        {/* Enhanced AI Insights */}
        <EnhancedAIInsights 
          expenses={expenses}
          investments={investments}
        />

        {/* Interactive Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveExpenseChart expenses={expenses} />
          <InteractiveInvestmentChart investments={investments} />
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
