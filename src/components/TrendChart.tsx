import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Expense } from "@/lib/storage";

interface TrendChartProps {
  expenses: Expense[];
}

export function TrendChart({ expenses }: TrendChartProps) {
  // Calculate monthly trends for the last 6 months
  const getMonthlyData = () => {
    const monthlyData: { [key: string]: { income: number; expense: number; budget: number } } = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData[monthKey] = { income: 0, expense: 0, budget: 0 };
    }

    // Aggregate expenses and income
    expenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const monthKey = expDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (monthlyData[monthKey]) {
        if (exp.type === "Income") {
          monthlyData[monthKey].income += exp.amount;
        } else {
          monthlyData[monthKey].expense += exp.amount;
        }
      }
    });

    // Calculate average monthly expense for budget line
    const avgExpense = Object.values(monthlyData).reduce((sum, data) => sum + data.expense, 0) / 6;
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      Income: parseFloat(data.income.toFixed(2)),
      Expense: parseFloat(data.expense.toFixed(2)),
      Budget: parseFloat(avgExpense.toFixed(2)),
    }));
  };

  const data = getMonthlyData();
  const latestMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const expenseChange = previousMonth 
    ? ((latestMonth.Expense - previousMonth.Expense) / previousMonth.Expense) * 100 
    : 0;
  
  const isPositiveTrend = expenseChange < 0; // Negative change is positive (spending less)

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Monthly Trends</h2>
          <p className="text-sm text-muted-foreground">Income vs Expenses vs Budget</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            {isPositiveTrend ? (
              <TrendingDown className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-red-500" />
            )}
            <span className={`font-bold ${isPositiveTrend ? "text-green-500" : "text-red-500"}`}>
              {Math.abs(expenseChange).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">vs last month</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `€${value}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`€${value.toFixed(2)}`, '']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Income" 
            stroke="hsl(var(--chart-1))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Expense" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Budget" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5">
          <p className="text-xs text-muted-foreground mb-1">This Month Income</p>
          <p className="text-lg font-bold text-green-600">€{latestMonth.Income.toFixed(2)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5">
          <p className="text-xs text-muted-foreground mb-1">This Month Expense</p>
          <p className="text-lg font-bold text-red-600">€{latestMonth.Expense.toFixed(2)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <p className="text-xs text-muted-foreground mb-1">Avg. Budget</p>
          <p className="text-lg font-bold text-blue-600">€{latestMonth.Budget.toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}
