import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Expense } from "@/lib/storage";

interface TrendChartProps {
  expenses: Expense[];
}

export const TrendChart = ({ expenses }: TrendChartProps) => {
  // Group by month
  const monthlyData = expenses.reduce((acc, exp) => {
    const month = exp.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0 };
    }
    if (exp.type === "Income") {
      acc[month].income += exp.amount;
    } else {
      acc[month].expenses += exp.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number }>);

  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      month: item.month,
      income: Math.round(item.income * 100) / 100,
      expenses: Math.round(item.expenses * 100) / 100,
    }));

  if (chartData.length === 0) {
    return (
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Income vs Expenses Trend</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No data yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Income vs Expenses Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number) => `€${value.toFixed(2)}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            name="Income"
            dot={{ fill: "hsl(var(--chart-3))" }}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            name="Expenses"
            dot={{ fill: "hsl(var(--chart-1))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
