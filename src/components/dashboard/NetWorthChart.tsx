import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const NetWorthChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-networth'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-networth', {
        body: { range: '90d' }
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

  const points = data?.points || [];

  return (
    <Card className="modern-card p-6">
      <h3 className="text-lg font-semibold mb-4">Net Worth Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
          />
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
