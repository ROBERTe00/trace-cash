import { Card } from "@/components/ui/card";
import { Investment } from "@/lib/storage";
import { ModernPieChart } from "@/components/charts/ModernPieChart";
import { aggregateSmallCategories, assignCategoryColors } from "@/lib/chartUtils";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";

interface PortfolioChartProps {
  investments: Investment[];
}

export const PortfolioChart = ({ investments }: PortfolioChartProps) => {
  const { formatCurrency } = useApp();

  // Group investments by category
  const categoryData = investments.reduce((acc, inv) => {
    const value = inv.quantity * inv.currentPrice;
    if (acc[inv.type]) {
      acc[inv.type] += value;
    } else {
      acc[inv.type] = value;
    }
    return acc;
  }, {} as Record<string, number>);

  const rawChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100,
  }));

  // Aggregate small categories
  const aggregatedData = aggregateSmallCategories(rawChartData, 0.05);
  
  // Assign colors
  const colorMap = assignCategoryColors(aggregatedData.map(d => d.name));
  const chartData = aggregatedData.map(d => ({
    ...d,
    color: colorMap[d.name],
  }));

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Asset Allocation</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No investments yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-6">Asset Allocation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Modern Pie Chart */}
        <div>
          <ModernPieChart
            data={chartData}
            showPercentages={true}
            height={300}
          />
        </div>

        {/* Category List */}
        <div className="space-y-4">
          {chartData.map((category, index) => {
            const percentage = ((category.value / totalValue) * 100).toFixed(1);
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(category.value)}</p>
                  <p className="text-sm text-muted-foreground">{percentage}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};