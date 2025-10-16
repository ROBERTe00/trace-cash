import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-muted-foreground">Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              >
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalExpenses)}</p>
              </motion.div>
            </div>
          </div>

          <div className="space-y-3">
            {categories.map((category, index) => {
              const percentage = ((category.amount / total) * 100).toFixed(0);
              return (
                <motion.div
                  key={category.name}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{percentage}%</span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseBreakdownCard;
