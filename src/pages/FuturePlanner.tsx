import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useApp } from "@/contexts/AppContext";
import { TrendingUp, Target, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function FuturePlanner() {
  const { formatCurrency } = useApp();
  const [monthlyInvestment, setMonthlyInvestment] = useState(100);
  const [expectedYield, setExpectedYield] = useState(7);
  const [targetAmount, setTargetAmount] = useState(50000);
  const [years, setYears] = useState(10);

  const calculateProjection = () => {
    const data = [];
    const monthlyRate = expectedYield / 100 / 12;
    const months = years * 12;
    
    let balance = 0;
    for (let month = 0; month <= months; month++) {
      if (month > 0) {
        balance = (balance + monthlyInvestment) * (1 + monthlyRate);
      }
      
      if (month % 12 === 0) {
        data.push({
          year: month / 12,
          amount: Math.round(balance),
          invested: monthlyInvestment * month,
          gains: Math.round(balance - monthlyInvestment * month),
        });
      }
    }
    
    return data;
  };

  const projectionData = calculateProjection();
  const finalAmount = projectionData[projectionData.length - 1].amount;
  const totalInvested = monthlyInvestment * years * 12;
  const totalGains = finalAmount - totalInvested;
  const willReachTarget = finalAmount >= targetAmount;

  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Future Planner</h1>
          <p className="text-muted-foreground">AI-powered financial projections</p>
        </div>
        <Button onClick={handleCelebrate} variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Celebrate
        </Button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Monthly Investment</Label>
                <span className="text-lg font-bold">{formatCurrency(monthlyInvestment)}</span>
              </div>
              <Slider
                value={[monthlyInvestment]}
                onValueChange={(v) => setMonthlyInvestment(v[0])}
                min={10}
                max={2000}
                step={10}
                className="my-4"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Expected Annual Yield</Label>
                <span className="text-lg font-bold">{expectedYield}%</span>
              </div>
              <Slider
                value={[expectedYield]}
                onValueChange={(v) => setExpectedYield(v[0])}
                min={0}
                max={20}
                step={0.5}
                className="my-4"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Time Horizon (Years)</Label>
                <span className="text-lg font-bold">{years}y</span>
              </div>
              <Slider
                value={[years]}
                onValueChange={(v) => setYears(v[0])}
                min={1}
                max={30}
                step={1}
                className="my-4"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Target Goal</Label>
                <span className="text-lg font-bold">{formatCurrency(targetAmount)}</span>
              </div>
              <Slider
                value={[targetAmount]}
                onValueChange={(v) => setTargetAmount(v[0])}
                min={1000}
                max={500000}
                step={1000}
                className="my-4"
              />
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4">Projection Results</h3>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${willReachTarget ? "bg-green-500/10 border-2 border-green-500/20" : "bg-orange-500/10 border-2 border-orange-500/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5" />
                <span className="font-semibold">Goal Status</span>
              </div>
              <p className="text-2xl font-bold">
                {willReachTarget ? "✓ Target Reached!" : "⚠ Below Target"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {willReachTarget 
                  ? `You'll have ${formatCurrency(finalAmount - targetAmount)} extra!`
                  : `Need ${formatCurrency(targetAmount - finalAmount)} more`
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Invested</span>
                <span className="font-bold">{formatCurrency(totalInvested)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Expected Gains</span>
                <span className="font-bold text-green-500">+{formatCurrency(totalGains)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Final Amount</span>
                <span className="font-bold gradient-text">{formatCurrency(finalAmount)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-primary/5 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">💡 Assumptions</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Compound interest monthly</li>
                  <li>• {expectedYield}% annual return assumed</li>
                  <li>• No withdrawals during period</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Growth Projection
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectionData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="year" 
              label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="invested" 
              stroke="hsl(var(--muted-foreground))" 
              fillOpacity={1} 
              fill="url(#colorInvested)"
              name="Invested"
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="hsl(var(--primary))" 
              fillOpacity={1} 
              fill="url(#colorAmount)"
              name="Total Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
