import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RevolutStatisticsChart = () => {
  const [timeRange, setTimeRange] = React.useState<'weekly' | 'monthly'>('weekly');
  
  const { data, isLoading } = useQuery({
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
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  const chartData = (data?.data || []).map((item: any) => ({
    name: new Date(item.month + '-01').toLocaleDateString('en-US', { weekday: 'short' }),
    income: item.income,
    expenses: item.expenses
  }));

  const currentMonth = data?.data?.[data.data.length - 1];
  const totalValue = (currentMonth?.income || 0) - (currentMonth?.expenses || 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Statistics</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === 'weekly' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTimeRange('weekly')}
          >
            Weekly
          </Button>
          <Button 
            variant={timeRange === 'monthly' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setTimeRange('monthly')}
          >
            Monthly
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold font-mono">
          ${Math.abs(totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <Button variant="ghost" size="sm" className="mt-2">
          Details →
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Bar dataKey="expenses" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          <Bar dataKey="income" fill="hsl(var(--muted))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex gap-8 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted" />
          <span className="text-sm text-muted-foreground">Income</span>
          <span className="text-sm font-semibold">
            ${(currentMonth?.income || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Expenses</span>
          <span className="text-sm font-semibold">
            ${(currentMonth?.expenses || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
};
