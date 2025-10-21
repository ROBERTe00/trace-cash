import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

export const DashboardSummaryCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-summary', {
        body: { date_range: '30d' }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const summary = data?.summary || {};

  const kpis = [
    {
      label: "Net Worth",
      value: `€${(summary.net_worth || 0).toFixed(2)}`,
      change: summary.net_worth_change_pct,
      positive: (summary.net_worth_change_pct || 0) >= 0
    },
    {
      label: "Cash Flow (30d)",
      value: `€${(summary.cashflow_30d || 0).toFixed(2)}`,
      change: null,
      positive: (summary.cashflow_30d || 0) >= 0
    },
    {
      label: "Budget Used",
      value: `${(summary.budget_spent_pct || 0).toFixed(1)}%`,
      change: null,
      positive: (summary.budget_spent_pct || 0) <= 80
    },
    {
      label: "Goals Progress",
      value: `${(summary.saving_goal_progress_pct || 0).toFixed(1)}%`,
      change: null,
      positive: true
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="modern-card p-6">
          <p className="text-sm text-muted-foreground mb-2">{kpi.label}</p>
          <p className="text-3xl font-bold mb-2">{kpi.value}</p>
          {kpi.change !== null && (
            <div className={`flex items-center gap-1 text-sm ${kpi.positive ? 'text-success' : 'text-destructive'}`}>
              {kpi.positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(kpi.change).toFixed(1)}%</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
