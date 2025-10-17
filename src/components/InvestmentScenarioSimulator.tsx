import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { simulateFutureReturns } from '@/lib/investmentMetrics';
import { getInvestments } from '@/lib/storage';
import { Calculator, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '@/contexts/AppContext';
import { AIInsightTooltip } from '@/components/AIInsightTooltip';
import { AIInsightModal } from '@/components/AIInsightModal';

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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">{t('simulator.title')}</h3>
        <AIInsightModal
          title="The Power of Compound Growth"
          metric="How Your Money Grows Over Time"
          value={`${expectedReturn}% annually`}
          explanation="Compound growth means you earn returns on your returns. Each year, your gains are reinvested, creating a snowball effect. Even small monthly contributions can grow significantly over decades."
          calculation="Future Value = Current Value × (1 + Return)^Years + Monthly Contribution × (((1 + Monthly Return)^Months - 1) / Monthly Return)"
          suggestions={[
            "Start early - time is your biggest advantage. 10 years at 8% doubles your money",
            "Consistency beats timing - regular contributions smooth out market volatility",
            "Don't withdraw early - breaking the compound chain costs you exponentially",
            "Reinvest dividends - this accelerates compounding significantly"
          ]}
          improvement="Even increasing monthly contributions by just €50 can add tens of thousands to your final value over 20-30 years."
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('simulator.description')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="monthly" className="text-base font-medium">
              {t('simulator.monthlyContribution')} ({currencySymbols[currency]})
            </Label>
            <AIInsightTooltip
              title="Monthly Contribution"
              content="Regular monthly investments. Compounding makes even small contributions grow significantly over time thanks to the 'snowball effect'."
            />
          </div>
          <Input
            id="monthly"
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            min="0"
            step="100"
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="years" className="text-base font-medium">{t('simulator.timeHorizon')}</Label>
            <AIInsightTooltip
              title="Investment Time Horizon"
              content="Longer time horizons amplify compound growth. The difference between 10 and 30 years can be exponential, not linear."
            />
          </div>
          <Input
            id="years"
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            min="1"
            max="40"
            className="text-base"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">{t('simulator.expectedReturn')}: {expectedReturn}%</Label>
            <AIInsightTooltip
              title="Expected Annual Return"
              content="Conservative: 3-5% (bonds, savings), Moderate: 6-10% (diversified stocks), Aggressive: 10%+ (growth stocks, crypto). Historical S&P 500 average is ~10%."
            />
          </div>
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">{t('simulator.taxRate')}: {taxRate}%</Label>
            <AIInsightTooltip
              title="Capital Gains Tax"
              content="Italy applies 26% tax on investment gains. This simulator calculates net value after taxes. Different countries have different rates."
            />
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-medium">{t('simulator.projectedValue')}</p>
                <AIInsightTooltip
                  title="Projected Portfolio Value"
                  content="Total portfolio value after X years, including contributions and compound growth. This is the gross value before taxes."
                />
              </div>
              <p className="text-xl md:text-2xl font-bold text-success">
                {formatCurrency(simulation.projectedValue)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-medium">{t('simulator.totalContributions')}</p>
                <AIInsightTooltip
                  title="Total Invested"
                  content="Sum of your initial investment plus all monthly contributions. This is your 'own money' put in."
                />
              </div>
              <p className="text-xl md:text-2xl font-bold text-primary">
                {formatCurrency(simulation.totalContributions)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-medium">{t('simulator.totalGains')}</p>
                <AIInsightTooltip
                  title="Total Investment Gains"
                  content="Profit from your investments = Projected Value - Initial Value - Total Contributions. This is the 'free money' from market growth."
                />
              </div>
              <p className="text-xl md:text-2xl font-bold text-primary">
                {formatCurrency(simulation.totalGains)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-medium">{t('simulator.taxLiability')}</p>
                <AIInsightTooltip
                  title="Tax on Gains"
                  content="Amount you'll pay in capital gains tax when you sell. Calculated as: Total Gains × Tax Rate%. Only gains are taxed, not contributions."
                />
              </div>
              <p className="text-xl md:text-2xl font-bold text-destructive">
                -{formatCurrency(simulation.taxLiability)}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold">{t('simulator.projectedGrowth')}</h4>
              <AIInsightTooltip
                title="Growth Projection Chart"
                content="Blue line = Portfolio value with compound growth. Dashed line = Total contributions without growth. The gap shows your investment gains."
              />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === t('portfolio.analysis')) {
                      return [formatCurrency(value), 'Portfolio Value'];
                    } else {
                      return [formatCurrency(value), 'Total Invested'];
                    }
                  }}
                  labelFormatter={(year) => `Year ${year}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name={t('portfolio.analysis')}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="contributions"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name={t('simulator.totalContributions')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-primary/5 p-5 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {t('simulator.netValue')}
              </h4>
              <AIInsightTooltip
                title="Net Portfolio Value"
                content="What you actually keep after paying taxes. Formula: Projected Value - Tax Liability. This is your real take-home amount."
              />
            </div>
            <p className="text-3xl md:text-4xl font-bold text-success">
              {formatCurrency(simulation.netValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t('simulator.finalValue')} {taxRate}% {t('simulator.taxRate').toLowerCase()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
