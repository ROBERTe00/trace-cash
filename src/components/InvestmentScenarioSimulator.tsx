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

export function InvestmentScenarioSimulator() {
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
          Scenario Simulator
        </CardTitle>
        <CardDescription>
          Project your portfolio growth with monthly contributions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly">Monthly Contribution (€)</Label>
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
            <Label htmlFor="years">Time Horizon (Years)</Label>
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
            <Label>Expected Annual Return: {expectedReturn}%</Label>
            <Slider
              value={[expectedReturn]}
              onValueChange={(value) => setExpectedReturn(value[0])}
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative (4-6%)</span>
              <span>Moderate (7-10%)</span>
              <span>Aggressive (11%+)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Capital Gains Tax: {taxRate}%</Label>
            <Slider
              value={[taxRate]}
              onValueChange={(value) => setTaxRate(value[0])}
              min={0}
              max={43}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Italy: 26% standard, up to 43% for some assets
            </p>
          </div>
        </div>

        {simulation && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Projected Value</p>
                <p className="text-2xl font-bold text-green-500">
                  €{simulation.projectedValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Contributions</p>
                <p className="text-lg font-semibold">
                  €{simulation.totalContributions.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Gains</p>
                <p className="text-lg font-semibold text-blue-500">
                  €{simulation.totalGains.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tax Liability</p>
                <p className="text-lg font-semibold text-orange-500">
                  -€{simulation.taxLiability.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-semibold mb-4">Projected Growth</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `€${value.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Portfolio Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="contributions"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    name="Contributions Only"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Net Value After Taxes
              </h4>
              <p className="text-3xl font-bold text-green-500">
                €{simulation.netValue.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Final value after {taxRate}% capital gains tax
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
