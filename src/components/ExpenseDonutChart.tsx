import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useApp } from "@/contexts/AppContext";

interface ExpenseDonutChartProps {
  expenses: Array<{ category: string; amount: number }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food": "hsl(142, 76%, 36%)",
  "Transport": "hsl(217, 91%, 60%)",
  "Entertainment": "hsl(0, 84%, 60%)",
  "Healthcare": "hsl(262, 83%, 58%)",
  "Shopping": "hsl(280, 100%, 70%)",
  "Bills": "hsl(43, 96%, 56%)",
  "Groceries": "hsl(142, 76%, 46%)",
  "Other": "hsl(220, 9%, 46%)",
};

export function ExpenseDonutChart({ expenses }: ExpenseDonutChartProps) {
  const { formatCurrency } = useApp();

  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const remaining = Math.max(0, total * 0.1); // Mock remaining budget

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm">
                  {value}: {formatCurrency(entry.payload.value)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <div className="text-3xl font-bold">{formatCurrency(total)}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {formatCurrency(remaining)} remaining
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
