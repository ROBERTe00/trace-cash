/**
 * Interactive Category Breakdown Chart
 * Click on bar to filter transactions by category
 */

import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";

interface CategoryData {
  name: string;
  amount: number;
  count: number;
  color: string;
}

interface InteractiveCategoryChartProps {
  data: CategoryData[];
  onCategoryClick: (category: string) => void;
  selectedCategory?: string;
}

// Category color mapping
const categoryColors: Record<string, string> = {
  'Food & Dining': '#10B981',
  'Transportation': 'hsl(262, 83%, 58%)', // purple instead of blue
  'Shopping': '#8B5CF6',
  'Entertainment': '#F59E0B',
  'Healthcare': '#EF4444',
  'Bills & Utilities': 'hsl(262, 83%, 58%)', // purple instead of indigo
  'Income': '#059669',
  'Other': '#6B7280',
};

export const InteractiveCategoryChart = ({
  data,
  onCategoryClick,
  selectedCategory,
}: InteractiveCategoryChartProps) => {
  const { formatCurrency } = useApp();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="p-3 shadow-lg border-0">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(data.amount)}</p>
          <p className="text-xs text-muted-foreground">{data.count} transazioni</p>
          <p className="text-xs text-primary mt-1">Click per filtrare →</p>
        </Card>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="p-6 glass-card border-0 hover-lift">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Categorie</h3>
            {selectedCategory && (
              <button
                onClick={() => onCategoryClick('')}
                className="text-xs text-primary hover:underline"
              >
                Mostra tutte
              </button>
            )}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(262, 83%, 58%, 0.1)' }} />
              <Bar
                dataKey="amount"
                radius={[8, 8, 0, 0]}
                cursor="pointer"
                onClick={(data) => onCategoryClick(data.name)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColors[entry.name] || '#6B7280'}
                    opacity={selectedCategory === entry.name ? 1 : selectedCategory ? 0.3 : 0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            {data.map((cat) => (
              <button
                key={cat.name}
                onClick={() => onCategoryClick(cat.name)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[cat.name] || '#6B7280' }}
                />
                <span>{cat.name}</span>
                <span className="font-semibold">{formatCurrency(cat.amount)}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

