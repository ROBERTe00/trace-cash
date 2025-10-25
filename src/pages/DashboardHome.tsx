import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Bell, DollarSign, AlertTriangle, Target, TrendingUp, TrendingDown, PieChart, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumBalanceCard } from "@/components/dashboard/PremiumBalanceCard";
import { QuickOverviewCards } from "@/components/dashboard/QuickOverviewCards";
import { PremiumCashflowChart } from "@/components/dashboard/PremiumCashflowChart";
import { RecentTransactionsList } from "@/components/RecentTransactionsList";
import { QuickActionsGrid } from "@/components/QuickActionsGrid";
import { AIInsightsCard, Insight } from "@/components/AIInsightsCard";
import { CategoriesDonutChart } from "@/components/dashboard/CategoriesDonutChart";
import { RecentTransfersAvatars } from "@/components/RecentTransfersAvatars";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartInsightCard } from "@/components/dashboard/ChartInsightCard";
import { useApp } from "@/contexts/AppContext";
import { MetricDetailDrawer } from "@/components/dashboard/MetricDetailDrawer";
import { IncomeDetailView, getIncomeInsights } from "@/components/dashboard/IncomeDetailView";
import { ExpensesDetailView, getExpensesInsights } from "@/components/dashboard/ExpensesDetailView";
import { InvestmentsDetailView, getInvestmentsInsights } from "@/components/dashboard/InvestmentsDetailView";
import { SavingsDetailView, getSavingsInsights } from "@/components/dashboard/SavingsDetailView";

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);
  const { formatCurrency } = useApp();
  const { metrics, expenses, isLoading } = useDashboardData();
  const [openDrawer, setOpenDrawer] = useState<'income' | 'expenses' | 'investments' | 'savings' | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch recent transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        type: item.type as 'Income' | 'Expense'
      }));
    },
  });

  // Generate AI insights based on real data
  const insights: Insight[] = metrics ? [
    {
      type: 'success',
      icon: DollarSign,
      text: `💰 Ottimo lavoro! Hai risparmiato ${formatCurrency(metrics.savings)} questo mese (${metrics.savingsRate.toFixed(1)}% del tuo reddito)`,
    },
    ...(metrics.expensesChange > 0 ? [{
      type: 'warning' as const,
      icon: AlertTriangle,
      text: `⚠️ Le tue spese sono aumentate del ${metrics.expensesChange.toFixed(1)}% rispetto al mese scorso.`,
    }] : []),
    {
      type: 'tip' as const,
      icon: TrendingUp,
      text: `💡 Hai ${formatCurrency(metrics.savings)} disponibili. Considera di investire per far crescere i tuoi risparmi.`,
    }
  ] : [];

  return (
    <div className="page-container py-8 space-y-6 animate-fade-in">
      {/* Header Section with Search */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Hello, {user?.email?.split('@')[0] || 'Robert'}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            All information about your bank account in the sections below.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search something" 
              className="pl-10 w-80 rounded-xl bg-muted/50"
            />
          </div>
          <button className="relative p-2 hover:bg-muted rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.email?.[0]?.toUpperCase() || 'R'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Balance Card with Quick Actions */}
      <PremiumBalanceCard 
        totalBalance={metrics?.totalIncome || 0}
        availableBalance={metrics?.savings || 0}
      />

      {/* Quick Overview Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Reddito Mensile"
            value={formatCurrency(metrics.totalIncome)}
            change={metrics.incomeChange}
            icon={TrendingUp}
            iconColor="text-green-600 dark:text-green-400"
            bgColor="bg-green-500/10"
            insight="Il tuo reddito totale per questo mese"
            trend={metrics.incomeChange > 0 ? 'up' : 'down'}
            onClick={() => setOpenDrawer('income')}
          />
          <MetricCard
            title="Spese Mensili"
            value={formatCurrency(metrics.totalExpenses)}
            change={metrics.expensesChange}
            icon={TrendingDown}
            iconColor="text-red-600 dark:text-red-400"
            bgColor="bg-red-500/10"
            insight="Totale spese per questo mese"
            trend={metrics.expensesChange > 0 ? 'down' : 'up'}
            onClick={() => setOpenDrawer('expenses')}
          />
          <MetricCard
            title="Investimenti"
            value={formatCurrency(0)}
            icon={PieChart}
            iconColor="text-purple-600 dark:text-purple-400"
            bgColor="bg-purple-500/10"
            insight="Valore totale del tuo portafoglio"
            onClick={() => setOpenDrawer('investments')}
          />
          <MetricCard
            title="Risparmi"
            value={formatCurrency(metrics.savings)}
            icon={PiggyBank}
            iconColor="text-primary"
            bgColor="bg-primary/10"
            insight={`${metrics.savingsRate.toFixed(1)}% del tuo reddito risparmiato`}
            onClick={() => setOpenDrawer('savings')}
          />
        </div>
      ) : (
        <QuickOverviewCards />
      )}

      {/* Statistics Chart */}
      <div>
        <PremiumCashflowChart />
        {metrics && (
          <ChartInsightCard
            title="Cash Flow Overview"
            description={`Le tue entrate sono ${formatCurrency(metrics.totalIncome)} e le spese ${formatCurrency(metrics.totalExpenses)}. Hai un ${metrics.savings > 0 ? 'surplus' : 'deficit'} di ${formatCurrency(Math.abs(metrics.savings))} questo mese.`}
            trend={metrics.savings > 0 ? 'up' : 'down'}
            trendValue={metrics.savingsRate.toFixed(1) + '%'}
            icon={metrics.savings > 0 ? 'up' : 'down'}
          />
        )}
      </div>

      {/* Transactions and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
          <RecentTransactionsList transactions={transactionsData || []} maxItems={5} />
        </div>
        
        <div>
          <CategoriesDonutChart />
          {metrics && Object.keys(metrics.categoryBreakdown).length > 0 && (
            <ChartInsightCard
              title="Spending Patterns"
              description={`Le categorie più importanti questo mese rappresentano la maggior parte delle tue spese. Monitora queste aree per ottimizzare il tuo budget.`}
              icon="info"
            />
          )}
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightsCard insights={insights} />

      {/* Metric Detail Drawers */}
      {metrics && (
        <>
          {/* Income Drawer */}
          <MetricDetailDrawer
            open={openDrawer === 'income'}
            onOpenChange={(open) => setOpenDrawer(open ? 'income' : null)}
            title="Reddito Mensile"
            subtitle="Analisi dettagliata del tuo reddito"
            icon={TrendingUp}
            iconColor="text-green-600"
            bgColor="bg-green-500/10"
            insights={getIncomeInsights({
              totalIncome: metrics.totalIncome,
              incomeChange: metrics.incomeChange,
              monthlyTrend: metrics.monthlyIncomeTrend || [],
              projectedYearly: metrics.totalIncome * 12
            })}
            actionButton={{
              label: "Visualizza Transazioni",
              onClick: () => window.location.href = '/transactions'
            }}
          >
            <IncomeDetailView
              totalIncome={metrics.totalIncome}
              incomeChange={metrics.incomeChange}
              monthlyTrend={metrics.monthlyIncomeTrend || []}
              projectedYearly={metrics.totalIncome * 12}
            />
          </MetricDetailDrawer>

          {/* Expenses Drawer */}
          <MetricDetailDrawer
            open={openDrawer === 'expenses'}
            onOpenChange={(open) => setOpenDrawer(open ? 'expenses' : null)}
            title="Spese Mensili"
            subtitle="Analisi dettagliata delle tue spese"
            icon={TrendingDown}
            iconColor="text-red-600"
            bgColor="bg-red-500/10"
            insights={getExpensesInsights({
              totalExpenses: metrics.totalExpenses,
              budget: 1500, // TODO: Get from user settings
              expensesChange: metrics.expensesChange,
              monthlyTrend: metrics.monthlyExpensesTrend || [],
              topCategories: Object.entries(metrics.categoryBreakdown).map(([name, amount]) => ({
                name,
                amount: amount as number,
                percentage: (amount as number / metrics.totalExpenses) * 100
              })).slice(0, 4)
            })}
            actionButton={{
              label: "Gestisci Budget",
              onClick: () => window.location.href = '/budget'
            }}
          >
            <ExpensesDetailView
              totalExpenses={metrics.totalExpenses}
              budget={1500}
              expensesChange={metrics.expensesChange}
              monthlyTrend={metrics.monthlyExpensesTrend || []}
              topCategories={Object.entries(metrics.categoryBreakdown).map(([name, amount]) => ({
                name,
                amount: amount as number,
                percentage: (amount as number / metrics.totalExpenses) * 100
              })).slice(0, 4)}
            />
          </MetricDetailDrawer>

          {/* Investments Drawer */}
          <MetricDetailDrawer
            open={openDrawer === 'investments'}
            onOpenChange={(open) => setOpenDrawer(open ? 'investments' : null)}
            title="Investimenti"
            subtitle="Portafoglio e performance"
            icon={PieChart}
            iconColor="text-purple-600"
            bgColor="bg-purple-500/10"
            insights={getInvestmentsInsights({
              totalInvestments: 0,
              idealAllocation: []
            })}
            actionButton={{
              label: "Inizia a Investire",
              onClick: () => window.location.href = '/investments'
            }}
          >
            <InvestmentsDetailView
              totalInvestments={0}
              idealAllocation={[]}
            />
          </MetricDetailDrawer>

          {/* Savings Drawer */}
          <MetricDetailDrawer
            open={openDrawer === 'savings'}
            onOpenChange={(open) => setOpenDrawer(open ? 'savings' : null)}
            title="Risparmi"
            subtitle={metrics.savings < 0 ? "Attenzione: Deficit rilevato" : "Progresso verso il tuo obiettivo"}
            icon={PiggyBank}
            iconColor="text-primary"
            bgColor="bg-primary/10"
            insights={getSavingsInsights({
              currentSavings: metrics.savings,
              targetSavings: 1900,
              savingsRate: metrics.savingsRate,
              monthlyTrend: metrics.monthlySavingsTrend || []
            })}
            actionButton={{
              label: "Ottimizza Risparmi",
              onClick: () => window.location.href = '/budget',
              variant: metrics.savings < 0 ? 'destructive' : 'default'
            }}
          >
            <SavingsDetailView
              currentSavings={metrics.savings}
              targetSavings={1900}
              savingsRate={metrics.savingsRate}
              monthlyTrend={metrics.monthlySavingsTrend || []}
            />
          </MetricDetailDrawer>
        </>
      )}
    </div>
  );
}
