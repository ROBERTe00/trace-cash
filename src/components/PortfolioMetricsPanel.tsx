import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculatePortfolioMetrics, checkPortfolioBalance } from '@/lib/investmentMetrics';
import { Investment } from '@/lib/storage';
import { TrendingUp, TrendingDown, Activity, PieChart, AlertTriangle } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '@/contexts/AppContext';

interface PortfolioMetricsPanelProps {
  investments: Investment[];
}

export function PortfolioMetricsPanel({ investments }: PortfolioMetricsPanelProps) {
  const { t, formatCurrency } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const calculatedMetrics = calculatePortfolioMetrics(investments);
    setMetrics(calculatedMetrics);

    const balanceAlerts = checkPortfolioBalance(
      calculatedMetrics.diversification.byType,
      calculatedMetrics.totalValue
    );
    setAlerts(balanceAlerts);
  }, [investments]);

  if (!metrics) return null;

  // Prepare radar chart data
  const radarData = Object.entries(metrics.diversification.byType).map(([type, value]) => ({
    type,
    value: ((value as number) / metrics.totalValue) * 100,
  }));

  const getMetricColor = (value: number, isPositive: boolean = true) => {
    if (isPositive) {
      return value > 0 ? 'text-success' : 'text-destructive';
    }
    return value < 30 ? 'text-success' : 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="icon-card" />
              {t('metrics.alerts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-warning">•</span>
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
            <CardDescription>{t('metrics.totalValue')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-medium-number">
              {formatCurrency(metrics.totalValue)}
            </div>
            <div className={`text-sm flex items-center gap-1 ${getMetricColor(metrics.totalGainLossPercent)}`}>
              {metrics.totalGainLoss > 0 ? (
                <TrendingUp className="icon-button" />
              ) : (
                <TrendingDown className="icon-button" />
              )}
              {metrics.totalGainLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('metrics.annualizedReturn')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-medium-number ${getMetricColor(metrics.annualizedReturn)}`}>
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
              <Activity className="icon-small" />
              {t('metrics.volatility')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-medium-number">
              {metrics.volatility.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {t('metrics.lowerBetter')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>{t('metrics.sharpeRatio')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-medium-number">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {metrics.sharpeRatio > 1 ? t('metrics.good') : metrics.sharpeRatio > 0.5 ? t('metrics.fair') : t('metrics.poor')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diversification Radar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="icon-card" />
                {t('metrics.diversification')}
              </CardTitle>
              <CardDescription className="mt-1">
                Herfindahl Index: {metrics.diversification.herfindahlIndex.toFixed(4)}
              </CardDescription>
            </div>
            <Badge variant={metrics.diversification.herfindahlIndex < 0.25 ? 'default' : 'destructive'}>
              {metrics.diversification.herfindahlIndex < 0.25 ? t('metrics.wellDiversified') : t('metrics.concentrated')}
            </Badge>
          </div>
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
