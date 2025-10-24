import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, PieChart, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const QuickOverviewCards = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-summary', {
        body: { date_range: '30d' }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  const { data: cashflowData } = useQuery({
    queryKey: ['dashboard-cashflow'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-cashflow', {
        body: { range: '6m' }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6">
            <Skeleton className="h-8 w-8 mb-4 rounded-full" />
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  const currentMonth = cashflowData?.data?.[cashflowData.data.length - 1];
  const income = currentMonth?.income || 0;
  const expenses = currentMonth?.expenses || 0;
  const investmentsValue = data?.summary?.net_worth || 0;
  const savings = income - expenses;

  const cards = [
    {
      label: "Monthly Income",
      value: income,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      label: "Monthly Expenses",
      value: expenses,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      label: "Investments Value",
      value: investmentsValue,
      icon: PieChart,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Savings",
      value: savings,
      icon: PiggyBank,
      color: "text-info",
      bgColor: "bg-info/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="stat-card group cursor-pointer">
          <div className={`w-12 h-12 rounded-full ${card.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <p className="text-sm text-muted-foreground mb-2">{card.label}</p>
          <p className="text-2xl font-bold font-mono">
            ${card.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
      ))}
    </div>
  );
};
