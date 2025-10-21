import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const CashflowChart = () => {
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
      <Card className="modern-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  const chartData = data?.data || [];

  return (
    <Card className="modern-card p-6">
      <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'short' })}
          />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />
          <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
