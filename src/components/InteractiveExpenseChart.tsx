import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { 
  Calendar, 
  TrendingDown, 
  Maximize2, 
  Minimize2,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

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

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍕",
  Transport: "🚗",
  Entertainment: "🎬",
  Bills: "📄",
  Healthcare: "🏥",
  Shopping: "🛍️",
  Other: "📦",
};

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
      <Card className="glass-card p-6 border-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Interactive Expense Analysis</h3>
            <p className="text-xs text-muted-foreground">AI-powered insights</p>
          </div>
        </div>
        <div className="h-80 flex flex-col items-center justify-center gap-4">
          <div className="p-4 rounded-full bg-muted/50">
            <TrendingDown className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-muted-foreground">No expenses yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add transactions to see your spending analysis</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "glass-card transition-all duration-300 overflow-hidden border-primary/10",
      isExpanded ? "col-span-full" : ""
    )}>
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                Interactive Expense Analysis
                <Badge variant="secondary" className="text-xs font-normal">
                  AI Powered
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {chartData.length} categories • {formatCurrency(totalExpenses)} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="flex-1 sm:flex-none"
            >
              <PieIcon className="h-3.5 w-3.5 mr-1.5" />
              Pie
            </Button>
            
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="flex-1 sm:flex-none"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Bar
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
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6 p-4 md:p-6">
        {/* Chart Section */}
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={isMobile ? 320 : (isExpanded ? 480 : 380)}>
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 60 : 80}
                  outerRadius={isMobile ? 110 : 130}
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
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 10, bottom: 60, left: 10 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => setSelectedCategory(data.name)}
                  className="cursor-pointer"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Top Category</p>
              <p className="font-bold text-sm">{chartData[0]?.name || '-'}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <p className="font-bold text-sm">{formatCurrency(totalExpenses / chartData.length)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Categories</p>
              <p className="font-bold text-sm">{chartData.length}</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Category Breakdown
            </h4>
            <Badge variant="outline" className="text-xs">
              {chartData.length} items
            </Badge>
          </div>
          
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {chartData.map((item, index) => {
              const percentage = (item.value / totalExpenses) * 100;
              const isSelected = selectedCategory === item.name;
              const icon = CATEGORY_ICONS[item.name] || CATEGORY_ICONS.Other;
              
              return (
                <div
                  key={item.name}
                  onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                  className={cn(
                    "group p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-sm",
                    isSelected 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                      : 'border-border/50 hover:border-primary/50 hover:bg-accent/50'
                  )}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-2xl">{icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{item.name}</span>
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {percentage.toFixed(1)}% of total spending
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold whitespace-nowrap">{formatCurrency(item.value)}</span>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform text-muted-foreground",
                        isSelected && "rotate-90"
                      )} />
                    </div>
                  </div>
                  
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                      // @ts-ignore
                      '--progress-background': COLORS[index % COLORS.length],
                    }}
                  />
                  
                  {isSelected && categoryExpenses.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-2 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                        <span>Recent Transactions</span>
                        <span>{categoryExpenses.length} items</span>
                      </div>
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {categoryExpenses.slice(0, 8).map((exp) => (
                          <div 
                            key={exp.id} 
                            className="flex justify-between items-center p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                          >
                            <span className="text-xs text-muted-foreground truncate flex-1 pr-2">
                              {exp.description}
                            </span>
                            <span className="text-xs font-semibold text-destructive whitespace-nowrap">
                              -{formatCurrency(exp.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {categoryExpenses.length > 8 && (
                        <p className="text-xs text-muted-foreground italic text-center pt-2">
                          +{categoryExpenses.length - 8} more transactions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AI Insights Badge */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium">AI Analysis</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your top spending category is {chartData[0]?.name} at {((chartData[0]?.value / totalExpenses) * 100).toFixed(0)}% of expenses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
