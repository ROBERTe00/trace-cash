import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculatePortfolioMetrics, checkPortfolioBalance } from '@/lib/investmentMetrics';
import { getInvestments } from '@/lib/storage';
import { TrendingUp, TrendingDown, Activity, PieChart, AlertTriangle } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export function PortfolioMetricsPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const investments = getInvestments();
    const calculatedMetrics = calculatePortfolioMetrics(investments);
    setMetrics(calculatedMetrics);

    const balanceAlerts = checkPortfolioBalance(
      calculatedMetrics.diversification.byType,
      calculatedMetrics.totalValue
    );
    setAlerts(balanceAlerts);
  }, []);

  if (!metrics) return null;

  // Prepare radar chart data
  const radarData = Object.entries(metrics.diversification.byType).map(([type, value]) => ({
    type,
    value: ((value as number) / metrics.totalValue) * 100,
  }));

  const getMetricColor = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? 'text-green-500' : 'text-red-500';
    }
    return value < 30 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <AlertTriangle className="h-5 w-5" />
              Portfolio Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-orange-500">•</span>
                <p>{alert}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{metrics.totalValue.toFixed(2)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${getMetricColor(metrics.totalGainLossPercent)}`}>
              {metrics.totalGainLoss > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {metrics.totalGainLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Annualized Return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.annualizedReturn)}`}>
              {metrics.annualizedReturn.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">
              vs S&P 500: ~10%/year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Volatility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.volatility.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Lower is better
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sharpe Ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.sharpeRatio > 1 ? 'Good' : metrics.sharpeRatio > 0.5 ? 'Fair' : 'Poor'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diversification Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Asset Diversification
          </CardTitle>
          <CardDescription>
            Herfindahl Index: {metrics.diversification.herfindahlIndex.toFixed(4)}
            {' '}
            <Badge variant={metrics.diversification.herfindahlIndex < 0.25 ? 'default' : 'destructive'}>
              {metrics.diversification.herfindahlIndex < 0.25 ? 'Well Diversified' : 'Concentrated'}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="type" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Allocation"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(metrics.diversification.byType).map(([type, value]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{type}</span>
                <span className="font-medium">
                  {(((value as number) / metrics.totalValue) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
