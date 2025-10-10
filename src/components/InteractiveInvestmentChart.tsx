import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from "recharts";
import { Investment } from "@/lib/storage";
import { TrendingUp, Maximize2, Minimize2, ZoomIn } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface InteractiveInvestmentChartProps {
  investments: Investment[];
}

export const InteractiveInvestmentChart = ({ investments }: InteractiveInvestmentChartProps) => {
  const { formatCurrency } = useApp();
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBrush, setShowBrush] = useState(true);

  // Generate historical data (mock for demonstration)
  const generateHistoricalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const portfolioValue = investments.reduce((sum, inv) => {
        // Simulate historical prices (current price with some variance)
        const variance = (Math.random() - 0.5) * 0.2; // ±10%
        const historicalPrice = inv.currentPrice * (1 + variance * ((currentMonth - index) / 12));
        return sum + (inv.quantity * historicalPrice);
      }, 0);

      return {
        month,
        value: Math.round(portfolioValue * 100) / 100,
      };
    });
  };

  const chartData = generateHistoricalData();
  
  if (investments.length === 0) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Investment Performance
          </h3>
        </div>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No investments yet
        </div>
      </Card>
    );
  }

  const currentValue = chartData[chartData.length - 1]?.value || 0;
  const initialValue = chartData[0]?.value || 0;
  const totalChange = currentValue - initialValue;
  const percentChange = initialValue > 0 ? ((totalChange / initialValue) * 100) : 0;

  return (
    <Card className={`glass-card p-6 transition-all ${isExpanded ? 'col-span-full' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Investment Performance
          </h3>
          <Badge
            variant={percentChange >= 0 ? "default" : "destructive"}
            className="text-xs"
          >
            {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChartType(chartType === 'line' ? 'area' : 'line')}
            className="text-xs"
          >
            {chartType === 'line' ? 'Area View' : 'Line View'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBrush(!showBrush)}
            className="text-xs"
          >
            <ZoomIn className="h-3 w-3 mr-1" />
            {showBrush ? 'Hide' : 'Show'} Zoom
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Current Value</p>
          <p className="text-lg font-bold">{formatCurrency(currentValue)}</p>
        </div>
        
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Total Change</p>
          <p className={`text-lg font-bold ${totalChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
          </p>
        </div>
        
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Assets</p>
          <p className="text-lg font-bold">{investments.length}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={isExpanded ? 500 : 350}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
              activeDot={{ r: 6 }}
              name="Portfolio Value"
            />
            {showBrush && <Brush dataKey="month" height={30} stroke="hsl(var(--primary))" />}
          </LineChart>
        ) : (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Portfolio Value"
            />
            {showBrush && <Brush dataKey="month" height={30} stroke="hsl(var(--primary))" />}
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* Individual Investments Performance */}
      <div className="mt-6 space-y-2">
        <h4 className="font-semibold text-sm">Individual Assets ({investments.length})</h4>
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
          {investments.map((inv) => {
            const value = inv.quantity * inv.currentPrice;
            const cost = inv.quantity * inv.purchasePrice;
            const gain = value - cost;
            const gainPercent = (gain / cost) * 100;
            
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{inv.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.quantity} shares @ {formatCurrency(inv.currentPrice)}
                  </p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="font-bold text-sm">{formatCurrency(value)}</p>
                  <p className={`text-xs ${gain >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
