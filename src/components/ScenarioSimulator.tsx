import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialGoal } from "@/lib/storage";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Lightbulb, RefreshCw } from "lucide-react";

interface ScenarioSimulatorProps {
  goal: FinancialGoal;
}

export function ScenarioSimulator({ goal }: ScenarioSimulatorProps) {
  const [additionalMonthly, setAdditionalMonthly] = useState(0);
  const [inflationRate, setInflationRate] = useState(2);
  const [expectedReturn, setExpectedReturn] = useState(5);

  const calculateScenarios = () => {
    const monthsToDeadline = Math.ceil(
      (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const baseMonthly = (goal.targetAmount - goal.currentAmount) / monthsToDeadline;
    const enhancedMonthly = baseMonthly + additionalMonthly;

    // Base scenario (no investment returns, no inflation)
    const baseData = [];
    let baseBalance = goal.currentAmount;
    
    // Enhanced scenario (with additional monthly)
    let enhancedBalance = goal.currentAmount;
    
    // Investment scenario (with returns)
    let investmentBalance = goal.currentAmount;
    const monthlyReturnRate = expectedReturn / 100 / 12;
    
    // Inflation-adjusted scenario
    let inflationBalance = goal.currentAmount;
    const monthlyInflationRate = inflationRate / 100 / 12;
    let adjustedTarget = goal.targetAmount;

    for (let month = 0; month <= monthsToDeadline; month++) {
      if (month > 0) {
        baseBalance += baseMonthly;
        enhancedBalance += enhancedMonthly;
        investmentBalance = (investmentBalance + enhancedMonthly) * (1 + monthlyReturnRate);
        inflationBalance += enhancedMonthly;
        adjustedTarget *= (1 + monthlyInflationRate);
      }

      if (month % 3 === 0 || month === monthsToDeadline) {
        baseData.push({
          month,
          base: Math.round(baseBalance),
          enhanced: Math.round(enhancedBalance),
          investment: Math.round(investmentBalance),
          inflation: Math.round(inflationBalance),
          adjustedTarget: Math.round(adjustedTarget),
          target: goal.targetAmount,
        });
      }
    }

    return baseData;
  };

  const scenarioData = calculateScenarios();
  const finalScenario = scenarioData[scenarioData.length - 1];
  
  const monthsToDeadline = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const baseMonthly = (goal.targetAmount - goal.currentAmount) / monthsToDeadline;
  const monthsSaved = additionalMonthly > 0 
    ? Math.floor((goal.targetAmount - goal.currentAmount) / (baseMonthly + additionalMonthly))
    : 0;
  const monthsSavedDiff = monthsToDeadline - monthsSaved;

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Simulatore Scenari AI</h2>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scenarios">Proiezioni</TabsTrigger>
          <TabsTrigger value="controls">Parametri</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Contributo Mensile Aggiuntivo</Label>
              <span className="text-lg font-bold">+€{additionalMonthly}</span>
            </div>
            <Slider
              value={[additionalMonthly]}
              onValueChange={(v) => setAdditionalMonthly(v[0])}
              min={0}
              max={1000}
              step={50}
              className="my-4"
            />
            {additionalMonthly > 0 && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="icon-button text-success" />
                  <span className="font-medium">Impatto Positivo</span>
                </div>
                <p className="text-muted-foreground">
                  Raggiungerai l'obiettivo <span className="font-bold text-success">{monthsSavedDiff} mesi prima</span> ({new Date(Date.now() + monthsSaved * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')})
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Tasso Inflazione Annuo</Label>
              <span className="text-lg font-bold">{inflationRate}%</span>
            </div>
            <Slider
              value={[inflationRate]}
              onValueChange={(v) => setInflationRate(v[0])}
              min={0}
              max={10}
              step={0.5}
              className="my-4"
            />
            <p className="text-xs text-muted-foreground">
              Con inflazione al {inflationRate}%, il potere d'acquisto di €{goal.targetAmount.toLocaleString()} oggi 
              sarà equivalente a €{finalScenario.adjustedTarget.toLocaleString()} alla scadenza
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Rendimento Investimento Annuo</Label>
              <span className="text-lg font-bold">{expectedReturn}%</span>
            </div>
            <Slider
              value={[expectedReturn]}
              onValueChange={(v) => setExpectedReturn(v[0])}
              min={0}
              max={15}
              step={0.5}
              className="my-4"
            />
            <p className="text-xs text-muted-foreground">
              Con un rendimento del {expectedReturn}%, il tuo capitale finale potrebbe essere 
              €{finalScenario.investment.toLocaleString()} invece di €{finalScenario.enhanced.toLocaleString()}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Scenario Base</div>
              <div className="text-lg font-bold">€{finalScenario.base.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">No cambiamenti</div>
            </div>
            
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Con +€{additionalMonthly}</div>
              <div className="text-small-number text-primary">€{finalScenario.enhanced.toLocaleString()}</div>
              <div className="text-xs text-success">
                +€{(finalScenario.enhanced - finalScenario.base).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="text-xs text-muted-foreground mb-1">Con Investimenti</div>
              <div className="text-small-number text-success">€{finalScenario.investment.toLocaleString()}</div>
              <div className="text-xs text-success">
                +€{(finalScenario.investment - finalScenario.enhanced).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="text-xs text-muted-foreground mb-1">Target Adeguato</div>
              <div className="text-small-number text-warning">€{finalScenario.adjustedTarget.toLocaleString()}</div>
              <div className="text-xs text-warning">
                +€{(finalScenario.adjustedTarget - goal.targetAmount).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={scenarioData}>
              <defs>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEnhanced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Mesi', position: 'insideBottom', offset: -5 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`€${value.toLocaleString()}`, '']}
                labelFormatter={(label) => `Mese ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="base" 
                stroke="hsl(var(--muted-foreground))" 
                fillOpacity={1} 
                fill="url(#colorBase)"
                name="Base"
              />
              <Area 
                type="monotone" 
                dataKey="enhanced" 
                stroke="hsl(var(--chart-1))" 
                fillOpacity={1} 
                fill="url(#colorEnhanced)"
                name={`+€${additionalMonthly}/mese`}
              />
              <Area 
                type="monotone" 
                dataKey="investment" 
                stroke="hsl(var(--chart-2))" 
                fillOpacity={1} 
                fill="url(#colorInvestment)"
                name={`Investito ${expectedReturn}%`}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Target Originale"
              />
              <Line 
                type="monotone" 
                dataKey="adjustedTarget" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                name={`Target con Inflazione ${inflationRate}%`}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* AI Insights */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span className="font-semibold">Raccomandazioni AI</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {additionalMonthly > 0 && (
                <li className="flex items-start gap-2">
                  <TrendingUp className="icon-button text-success mt-0.5 shrink-0" />
                  <span>
                    Aumentando il contributo mensile di €{additionalMonthly}, raggiungerai l'obiettivo 
                    <span className="font-bold text-foreground"> {monthsSavedDiff} mesi prima</span>.
                  </span>
                </li>
              )}
              
              {expectedReturn > 0 && finalScenario.investment > finalScenario.enhanced && (
                <li className="flex items-start gap-2">
                  <TrendingUp className="icon-button text-primary mt-0.5 shrink-0" />
                  <span>
                    Investendo con rendimento del {expectedReturn}%, potresti guadagnare 
                    <span className="font-bold text-foreground"> €{(finalScenario.investment - finalScenario.enhanced).toLocaleString()} in più</span>.
                  </span>
                </li>
              )}

              {inflationRate > 0 && finalScenario.adjustedTarget > goal.targetAmount && (
                <li className="flex items-start gap-2">
                  <TrendingDown className="icon-button text-warning mt-0.5 shrink-0" />
                  <span>
                    Con inflazione al {inflationRate}%, considera di aumentare il target a 
                    <span className="font-bold text-foreground"> €{finalScenario.adjustedTarget.toLocaleString()}</span> 
                    per mantenere lo stesso potere d'acquisto.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
