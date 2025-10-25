import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

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
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
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
  
  // Calculate summary stats
  const totalIncome = chartData.reduce((sum: number, item: any) => sum + (item.income || 0), 0);
  const totalExpenses = chartData.reduce((sum: number, item: any) => sum + (item.expenses || 0), 0);
  const netCashFlow = totalIncome - totalExpenses;
  const isPositive = netCashFlow > 0;

  // Add net cash flow to chart data
  const enhancedData = chartData.map((item: any) => ({
    ...item,
    netCashFlow: (item.income || 0) - (item.expenses || 0)
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-card-title">Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <DollarSign className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nessun dato disponibile</p>
            <p className="text-sm text-muted-foreground mt-2">Aggiungi delle transazioni per vedere il cash flow</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-title">Cash Flow Overview</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange("weekly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                timeRange === "weekly"
                  ? "bg-primary text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Settimanale
            </button>
            <button
              onClick={() => setTimeRange("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                timeRange === "monthly"
                  ? "bg-primary text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Mensile
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Entrate</p>
            </div>
            <p className="text-2xl font-bold font-mono text-green-600">
              €{totalIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-muted-foreground">Uscite</p>
            </div>
            <p className="text-2xl font-bold font-mono text-purple-600">
              €{totalExpenses.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-xl border ${
              isPositive 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <p className="text-sm text-muted-foreground">Netto</p>
            </div>
            <p className={`text-2xl font-bold font-mono ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? '+' : ''}€{netCashFlow.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={enhancedData}>
            <defs>
              <linearGradient id="netCashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.5} />
            <XAxis 
              dataKey="period" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--foreground))',
                padding: '12px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'netCashFlow') {
                  return [`€${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 'Netto'];
                }
                return [`€${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, name === 'income' ? 'Entrate' : 'Uscite'];
              }}
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(var(--muted-foreground))', paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'income') return 'Entrate';
                if (value === 'expenses') return 'Uscite';
                if (value === 'netCashFlow') return 'Cash Flow Netto';
                return value;
              }}
            />
            {/* Net Cash Flow Area */}
            <Area
              type="monotone"
              dataKey="netCashFlow"
              fill="url(#netCashFlowGradient)"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              name="netCashFlow"
            />
            {/* Income Bar */}
            <Bar 
              dataKey="income" 
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              name="income"
              opacity={0.7}
            />
            {/* Expenses Bar */}
            <Bar 
              dataKey="expenses" 
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              name="expenses"
              opacity={0.7}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
