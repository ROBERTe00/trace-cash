import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { simulateFutureReturns } from '@/lib/investmentMetrics';
import { getInvestments } from '@/lib/storage';
import { Calculator, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '@/contexts/AppContext';

export function InvestmentScenarioSimulator() {
  const { t, formatCurrency, currencySymbols, currency } = useApp();
  const [currentValue, setCurrentValue] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [expectedReturn, setExpectedReturn] = useState(8);
  const [years, setYears] = useState(10);
  const [taxRate, setTaxRate] = useState(26);
  const [simulation, setSimulation] = useState<any>(null);

  useEffect(() => {
    const investments = getInvestments();
    const total = investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
    setCurrentValue(total);
  }, []);

  const runSimulation = () => {
    const result = simulateFutureReturns(
      currentValue,
      monthlyContribution,
      expectedReturn,
      years,
      taxRate
    );
    setSimulation(result);
  };

  useEffect(() => {
    if (currentValue > 0) {
      runSimulation();
    }
  }, [currentValue, monthlyContribution, expectedReturn, years, taxRate]);

  const chartData = simulation?.yearlyBreakdown.map((year: any) => ({
    year: year.year,
    value: year.value,
    contributions: currentValue + (year.year * monthlyContribution * 12),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t('simulator.title')}
        </CardTitle>
        <CardDescription>
          {t('simulator.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly">{t('simulator.monthlyContribution')} ({currencySymbols[currency]})</Label>
            <Input
              id="monthly"
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              min="0"
              step="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="years">{t('simulator.timeHorizon')}</Label>
            <Input
              id="years"
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              min="1"
              max="40"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('simulator.expectedReturn')}: {expectedReturn}%</Label>
            <Slider
              value={[expectedReturn]}
              onValueChange={(value) => setExpectedReturn(value[0])}
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('simulator.conservative')}</span>
              <span>{t('simulator.moderate')}</span>
              <span>{t('simulator.aggressive')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('simulator.taxRate')}: {taxRate}%</Label>
            <Slider
              value={[taxRate]}
              onValueChange={(value) => setTaxRate(value[0])}
              min={0}
              max={43}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {t('simulator.italyTax')}
            </p>
          </div>
        </div>

        {simulation && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('simulator.projectedValue')}</p>
                <p className="text-medium-number text-success">
                  {formatCurrency(simulation.projectedValue)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('simulator.totalContributions')}</p>
                <p className="text-small-number text-primary">
                  {formatCurrency(simulation.totalContributions)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('simulator.totalGains')}</p>
                <p className="text-small-number text-primary">
                  {formatCurrency(simulation.totalGains)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('simulator.taxLiability')}</p>
                <p className="text-small-number text-destructive">
                  -{formatCurrency(simulation.taxLiability)}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-semibold mb-4">{t('simulator.projectedGrowth')}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name={t('portfolio.analysis')}
                  />
                  <Line
                    type="monotone"
                    dataKey="contributions"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    name={t('simulator.totalContributions')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="icon-button text-primary" />
                {t('simulator.netValue')}
              </h4>
              <p className="text-large-number text-success">
                {formatCurrency(simulation.netValue)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('simulator.finalValue')} {taxRate}% {t('simulator.taxRate').toLowerCase()}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
