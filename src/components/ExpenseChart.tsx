import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Expense } from "@/lib/storage";

interface ExpenseChartProps {
  expenses: Expense[];
}

export const ExpenseChart = ({ expenses }: ExpenseChartProps) => {
  // Group expenses by category
  const categoryData = expenses
    .filter((e) => e.type === "Expense")
    .reduce((acc, exp) => {
      if (acc[exp.category]) {
        acc[exp.category] += exp.amount;
      } else {
        acc[exp.category] = exp.amount;
      }
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([name, amount]) => ({
    category: name,
    amount: Math.round(amount * 100) / 100,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No expenses yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="category" 
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
          <Bar 
            dataKey="amount" 
            fill="hsl(var(--chart-2))" 
            name="Amount (€)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
