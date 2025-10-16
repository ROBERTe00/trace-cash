import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernPieChart } from "@/components/charts/ModernPieChart";
import { aggregateSmallCategories, assignCategoryColors } from "@/lib/chartUtils";
import { useApp } from "@/contexts/AppContext";
import { motion } from "framer-motion";

interface ExpenseDonutChartProps {
  expenses: Array<{ category: string; amount: number }>;
}

export function ExpenseDonutChart({ expenses }: ExpenseDonutChartProps) {
  const { formatCurrency } = useApp();

  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const rawData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));

    // Aggregate small categories
    const aggregated = aggregateSmallCategories(rawData, 0.05);

    // Assign colors
    const colorMap = assignCategoryColors(aggregated.map(d => d.name));

    return aggregated
      .map(item => ({
        name: item.name,
        value: item.value,
        color: colorMap[item.name],
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modern Pie Chart */}
        <ModernPieChart
          data={chartData}
          centerLabel={{
            title: "Total Expenses",
            value: formatCurrency(total),
          }}
          showPercentages={true}
          height={320}
        />

        {/* Category List */}
        <div className="space-y-3 pt-4 border-t">
          {chartData.map((category, index) => {
            const percentage = ((category.value / total) * 100).toFixed(1);
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-sm truncate">{category.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm">{formatCurrency(category.value)}</p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
