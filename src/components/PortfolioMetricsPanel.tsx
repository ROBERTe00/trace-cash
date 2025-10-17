import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculatePortfolioMetrics, checkPortfolioBalance } from '@/lib/investmentMetrics';
import { Investment } from '@/lib/storage';
import { TrendingUp, TrendingDown, Activity, PieChart, AlertTriangle, Info, Percent } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { AIInsightTooltip } from '@/components/AIInsightTooltip';
import { AIInsightModal } from '@/components/AIInsightModal';

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
    allocation: ((value as number) / metrics.totalValue) * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Alerts - Enhanced */}
      {alerts.length > 0 && (
        <Card className="glass-card border-primary/50 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-primary">
                <AlertTriangle className="icon-card" />
                <span className="font-semibold">Portfolio Rebalancing Alerts</span>
              </div>
              <AIInsightTooltip
                title="Why Rebalancing Matters"
                content="When one asset grows too large (>40% of portfolio), it creates concentration risk. If that asset crashes, you lose a significant portion of your wealth. Diversification protects you."
              />
            </div>
            <div className="space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-md bg-card/50">
                  <span className="text-primary">•</span>
                  <p>{alert}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Recommendation:</strong> Consider selling some of the overweight asset and buying underweight ones to restore balance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid - Enhanced Typography */}
      <div className="grid grid-cols-2 gap-6">
        {/* Total Value */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-base font-medium">{t('metrics.totalValue')}</CardDescription>
              <AIInsightTooltip
                title="Total Portfolio Value"
                content="The current market value of all your investments combined. This is calculated by multiplying the current price of each asset by the quantity you own."
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold">{formatCurrency(metrics.totalValue)}</span>
            </div>
            <div className={`text-base flex items-center gap-1 mt-2 ${metrics.totalGainLoss > 0 ? 'text-success' : 'text-destructive'}`}>
              {metrics.totalGainLoss > 0 ? (
                <TrendingUp className="icon-button" />
              ) : (
                <TrendingDown className="icon-button" />
              )}
              {metrics.totalGainLossPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        {/* Annualized Return */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription className="text-base font-medium">{t('metrics.annualizedReturn')}</CardDescription>
                <AIInsightModal
                  title="Annualized Return Explained"
                  metric="Your Portfolio's Yearly Performance"
                  value={`${metrics.annualizedReturn.toFixed(2)}%`}
                  explanation="This shows how much your portfolio has grown on average each year. It's calculated by taking your total returns and converting them to a yearly rate, making it easy to compare against benchmarks like the S&P 500."
                  calculation="Formula: ((Current Value ÷ Initial Investment)^(1 ÷ Years Held)) - 1 × 100"
                  suggestions={[
                    "S&P 500 historical average: ~10% per year",
                    "Bonds typically return 3-5% per year",
                    "If you're above 10%, you're beating the market average!",
                    "Consistency matters more than occasional high returns"
                  ]}
                  improvement="Track your returns quarterly to spot trends early. Rebalance when certain assets drift significantly from your target allocation."
                />
              </div>
              <TrendingUp className="icon-card text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-success">{metrics.annualizedReturn.toFixed(2)}%</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              vs S&P 500: ~10%/year
            </div>
          </CardContent>
        </Card>

        {/* Volatility */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription className="text-base font-medium">{t('metrics.volatility')}</CardDescription>
                <AIInsightTooltip
                  title="Portfolio Volatility"
                  content="Measures how much your portfolio's value fluctuates over time. Lower volatility = more stable returns. Calculated using standard deviation of asset returns."
                />
              </div>
              <Activity className="icon-card text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-warning">{metrics.volatility.toFixed(2)}%</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {t('metrics.lowerBetter')}
            </div>
          </CardContent>
        </Card>

        {/* Sharpe Ratio */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription className="text-base font-medium">{t('metrics.sharpeRatio')}</CardDescription>
                <AIInsightModal
                  title="Understanding Sharpe Ratio"
                  metric="Risk-Adjusted Return Metric"
                  value={metrics.sharpeRatio.toFixed(2)}
                  explanation="The Sharpe Ratio measures how much return you're getting per unit of risk. It helps you understand if your returns justify the volatility you're experiencing."
                  calculation="(Portfolio Return - Risk-Free Rate) ÷ Portfolio Volatility. Risk-free rate is assumed to be 2% (Italian government bonds)."
                  suggestions={[
                    "A ratio above 1 is considered excellent - you're being well-rewarded for the risk",
                    "Between 0.5-1 is good - decent risk-adjusted returns",
                    "Below 0.5 suggests you could get similar returns with less risk",
                    "Negative ratio means you're losing money - time to reassess your strategy"
                  ]}
                  improvement="To improve your Sharpe Ratio: 1) Reduce volatility by diversifying, 2) Target higher-return assets within your risk tolerance, 3) Eliminate underperforming assets"
                />
              </div>
              <Percent className="icon-card text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold">{metrics.sharpeRatio.toFixed(2)}</span>
              <span className="text-base text-muted-foreground">
                {metrics.sharpeRatio > 1 ? 'Excellent' : metrics.sharpeRatio > 0.5 ? 'Good' : 'Fair'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diversification Analysis - Enhanced */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="icon-card" />
                  {t('metrics.diversification')}
                </CardTitle>
                <AIInsightTooltip
                  title="Asset Allocation Radar"
                  content="Visual representation of your portfolio's distribution across asset types. Ideally, the shape should be balanced (polygon-like) rather than heavily skewed toward one axis."
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CardDescription className="text-sm">
                  Herfindahl Index: {metrics.diversification.herfindahlIndex.toFixed(4)}
                </CardDescription>
                <AIInsightTooltip
                  title="Herfindahl-Hirschman Index (HHI)"
                  content="Measures portfolio concentration. <0.15 = Highly Diversified, 0.15-0.25 = Diversified, >0.25 = Concentrated. Lower is better for risk management."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={metrics.diversification.herfindahlIndex < 0.25 ? "outline" : "secondary"}>
                {metrics.diversification.herfindahlIndex < 0.25 ? 'Well Diversified' : 'Concentrated'}
              </Badge>
              <AIInsightTooltip
                title="Diversification Status"
                content="Well Diversified = Risk spread across multiple assets. Concentrated = High exposure to few assets, increasing risk."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="type" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar 
                name="Allocation %" 
                dataKey="allocation" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.6} 
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {Object.entries(metrics.diversification.byType).map(([type, value]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-medium">{type}</span>
                <span className="text-base font-semibold">
                  {(((value as number) / metrics.totalValue) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Educational Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              How to Read This Chart
            </h5>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Each axis represents an asset type in your portfolio</li>
              <li>• The further from center, the higher the allocation percentage</li>
              <li>• A balanced polygon shape = well-diversified portfolio</li>
              <li>• A sharp spike toward one axis = concentrated risk</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
