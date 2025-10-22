import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Bell, DollarSign, AlertTriangle, Target, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RevolutBalanceCard } from "@/components/dashboard/RevolutBalanceCard";
import { QuickOverviewCards } from "@/components/dashboard/QuickOverviewCards";
import { RevolutStatisticsChart } from "@/components/dashboard/RevolutStatisticsChart";
import { RecentTransactionsList } from "@/components/RecentTransactionsList";
import { QuickActionsGrid } from "@/components/QuickActionsGrid";
import { AIInsightsCard, Insight } from "@/components/AIInsightsCard";
import { CategoriesDonutChart } from "@/components/dashboard/CategoriesDonutChart";
import { RecentTransfersAvatars } from "@/components/RecentTransfersAvatars";

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch transactions
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

  // Generate AI insights
  const insights: Insight[] = [
    {
      type: 'success',
      icon: DollarSign,
      text: '💰 Great job! You saved $1,500 this month (22% savings rate)',
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      text: '⚠️ Food & Dining expenses are high (35% of income). Consider optimizing this category.',
    },
    {
      type: 'tip',
      icon: TrendingUp,
      text: '💡 You have $3,250 in cash. Consider investing $1,600 in diversified assets.',
    }
  ];

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
      <RevolutBalanceCard />

      {/* Quick Overview Cards */}
      <QuickOverviewCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Transfer Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Quick transfer</h3>
          <RecentTransfersAvatars />
        </div>

        {/* Statistics Chart */}
        <RevolutStatisticsChart />
      </div>

      {/* Transactions and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Transactions</h3>
          <RecentTransactionsList transactions={transactionsData || []} maxItems={5} />
        </div>
        
        <CategoriesDonutChart />
      </div>

      {/* AI Insights */}
      <AIInsightsCard insights={insights} />
    </div>
  );
}
