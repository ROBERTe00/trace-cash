import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedPieChart } from "@/components/charts/EnhancedCharts";
import { MobileOptimizedCard } from "@/components/MobileOptimizations";
import { aggregateSmallCategories } from "@/lib/chartUtils";
import { useApp } from "@/contexts/AppContext";

interface CategoryData {
  name: string;
  amount: number;
  color: string;
}

interface ExpenseBreakdownCardProps {
  categories: CategoryData[];
  totalExpenses: number;
}

const ExpenseBreakdownCard = ({ categories, totalExpenses }: ExpenseBreakdownCardProps) => {
  const { formatCurrency } = useApp();

  // Aggregate small categories
  const rawData = categories.map(cat => ({
    name: cat.name,
    value: cat.amount,
  }));

  const aggregatedData = aggregateSmallCategories(rawData, 0.05);
  
  // Map back to include colors
  const chartData = aggregatedData.map(item => {
    const original = categories.find(cat => cat.name === item.name);
    return {
      name: item.name,
      value: item.value,
      color: original?.color || "#64748b",
    };
  });

  const total = chartData.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <MobileOptimizedCard title="Expense Breakdown" className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card">
        <div className="space-y-6">
          {/* Enhanced Pie Chart with Center Label */}
          <EnhancedPieChart
            data={chartData}
            centerLabel={{
              title: "Total",
              value: formatCurrency(totalExpenses),
            }}
            showPercentages={true}
            height={280}
            onSegmentClick={(data) => {
              console.log('Segment clicked:', data);
            }}
          />

          {/* Category List */}
          <div className="space-y-3">
            {chartData.map((category, index) => {
              const percentage = ((category.value / total) * 100).toFixed(1);
              return (
                <motion.div
                  key={category.name}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium truncate">{category.name}</span>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">{percentage}%</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </MobileOptimizedCard>
    </motion.div>
  );
};

export default ExpenseBreakdownCard;
