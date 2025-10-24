import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

type TimeRange = "weekly" | "monthly";

export const PremiumCashflowChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");

  const { data, isLoading } = useQuery({
    queryKey: ['premium-cashflow', timeRange],
    queryFn: async () => {
      const range = timeRange === "weekly" ? "4w" : "6m";
      const { data, error } = await supabase.functions.invoke('dashboard-cashflow', {
        body: { range }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.data || [];

  return (
    <Card className="premium-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-title">Cash Flow</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                timeRange === "weekly"
                  ? "bg-primary text-primary-foreground shadow-neon-purple"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                timeRange === "monthly"
                  ? "bg-primary text-primary-foreground shadow-neon-purple"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="period" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }}
            />
            <Bar 
              dataKey="income" 
              fill="hsl(var(--success))" 
              radius={[8, 8, 0, 0]}
              name="Income"
            />
            <Bar 
              dataKey="expenses" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              name="Expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
