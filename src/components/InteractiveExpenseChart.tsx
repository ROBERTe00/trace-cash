import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Expense } from "@/lib/storage";
import { Calendar, TrendingDown, Maximize2, Minimize2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface InteractiveExpenseChartProps {
  expenses: Expense[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="hsl(var(--foreground))" className="text-lg font-bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-sm">
        €{value.toFixed(2)}
      </text>
      <text x={cx} y={cy} dy={35} textAnchor="middle" fill="hsl(var(--muted-foreground))" className="text-xs">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const InteractiveExpenseChart = ({ expenses }: InteractiveExpenseChartProps) => {
  const { formatCurrency } = useApp();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Check if mobile
  const isMobile = window.innerWidth < 768;

  // Memoize category data to prevent unnecessary re-renders
  const categoryData = useMemo(() => expenses
    .filter((e) => e.type === "Expense")
    .reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>), [expenses]);

  const chartData = useMemo(() => Object.entries(categoryData)
    .map(([name, amount]) => ({
      name,
      value: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value), [categoryData]);

  const totalExpenses = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);

  // Drill-down data for selected category
  const categoryExpenses = selectedCategory
    ? expenses.filter(e => e.type === 'Expense' && e.category === selectedCategory)
    : [];

  if (chartData.length === 0) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Interactive Expense Analysis
          </h3>
        </div>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No expenses yet
        </div>
      </Card>
    );
  }

  return (
    <Card className={`glass-card p-4 md:p-6 transition-all ${isExpanded ? 'col-span-full' : ''}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 md:h-5 w-4 md:w-5 text-primary" />
            <span className="truncate">Interactive Expense Analysis</span>
          </h3>
          <Badge variant="outline" className="text-xs">
            {chartData.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
            className="text-xs flex-1 sm:flex-none"
          >
            {chartType === 'pie' ? 'Bar View' : 'Pie View'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Chart */}
        <div className="overflow-hidden -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height={isMobile ? 300 : (isExpanded ? 500 : 350)}>
            {chartType === 'pie' ? (
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 50}
                  outerRadius={isMobile ? 65 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onClick={(data) => setSelectedCategory(data.name)}
                  className="cursor-pointer focus:outline-none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-all hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                  itemStyle={{
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--chart-2))"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => setSelectedCategory(data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm md:text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Category Breakdown
          </h4>
          
          <div className="space-y-2 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {chartData.map((item, index) => {
              const percentage = (item.value / totalExpenses) * 100;
              const isSelected = selectedCategory === item.name;
              
              return (
                <div
                  key={item.name}
                  onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  `}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCategory(isSelected ? null : item.name);
                    }
                  }}
                  aria-label={`${item.name} category with ${formatCurrency(item.value)} spent`}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-sm truncate">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap">{formatCurrency(item.value)}</span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% of total
                  </p>
                </div>
              );
            })}
          </div>

          {selectedCategory && (
            <div className="mt-4 p-3 md:p-4 border border-primary/30 rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-sm">
                  {selectedCategory} ({categoryExpenses.length})
                </h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-7 text-xs"
                >
                  Close
                </Button>
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {categoryExpenses.slice(0, 10).map((exp) => (
                  <div key={exp.id} className="flex justify-between items-start py-1.5 gap-2">
                    <span className="text-muted-foreground truncate flex-1">{exp.description}</span>
                    <span className="font-medium text-destructive whitespace-nowrap">-{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
                {categoryExpenses.length > 10 && (
                  <p className="text-muted-foreground italic pt-2">
                    +{categoryExpenses.length - 10} more transactions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
