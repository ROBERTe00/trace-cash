import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingDown, AlertTriangle, Target, PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SavingsDetailViewProps {
  currentSavings: number;
  targetSavings: number;
  savingsRate: number;
  monthlyTrend: { month: string; value: number }[];
}

export function SavingsDetailView({
  currentSavings,
  targetSavings,
  savingsRate,
  monthlyTrend
}: SavingsDetailViewProps) {
  const navigate = useNavigate();
  const isNegative = currentSavings < 0;
  const progress = targetSavings > 0 ? Math.max(0, (currentSavings / targetSavings) * 100) : 0;

  const insights = [
    {
      type: isNegative ? 'error' as const : 'warning' as const,
      text: isNegative 
        ? `⚠️ CRITICO: Stai spendendo €${Math.abs(currentSavings).toLocaleString('it-IT', { minimumFractionDigits: 2 })} più di quanto guadagni. È urgente rivedere le tue spese.`
        : `📊 Sei al ${progress.toFixed(1)}% del tuo obiettivo di risparmio. Continua così!`,
      icon: isNegative ? AlertTriangle : Target
    },
    {
      type: 'info' as const,
      text: `💡 Il tuo tasso di risparmio è del ${Math.abs(savingsRate).toFixed(1)}%. L'obiettivo ideale è tra il 15-20%.`,
      icon: PiggyBank
    },
    {
      type: 'warning' as const,
      text: `📉 Negli ultimi mesi hai risparmiato ${currentSavings < 0 ? 'negativo' : 'poco'}. Considera di ridurre le spese non essenziali o aumentare le entrate.`,
      icon: TrendingDown
    }
  ];

  return (
    <>
      {/* Trend Chart */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Trend Risparmi</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isNegative ? "#ef4444" : "#10b981"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isNegative ? "#ef4444" : "#10b981"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isNegative ? "#ef4444" : "#10b981"}
              fillOpacity={1}
              fill="url(#colorSavings)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Progress Card */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Obiettivo Risparmio</h3>
          <span className={`text-2xl font-bold font-mono ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {currentSavings < 0 ? '-' : ''}€{Math.abs(currentSavings).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Progress value={progress} className="h-3 mb-2" />
        <p className="text-sm text-muted-foreground">
          Obiettivo: €{targetSavings.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
        </p>
      </Card>

      {/* Quick Recommendations */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Raccomandazioni</h3>
        <div className="space-y-3">
          {isNegative && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-1">Priorità Alta</p>
                <p className="text-sm text-muted-foreground">
                  Riduci le spese non essenziali di almeno €{Math.abs(currentSavings * 0.6).toFixed(0)} questo mese per equilibrare il bilancio.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
            <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Azione Consigliata</p>
              <p className="text-sm text-muted-foreground">
                Crea un budget mensile per controllare meglio le tue spese e raggiungere i tuoi obiettivi di risparmio.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

export function getSavingsInsights(props: SavingsDetailViewProps) {
  const { currentSavings, savingsRate } = props;
  const isNegative = currentSavings < 0;

  return [
    {
      type: isNegative ? 'error' as const : 'warning' as const,
      text: isNegative 
        ? `⚠️ CRITICO: Stai spendendo €${Math.abs(currentSavings).toLocaleString('it-IT', { minimumFractionDigits: 2 })} più di quanto guadagni questo mese.`
        : `📊 Sei al ${props.targetSavings > 0 ? ((currentSavings / props.targetSavings) * 100).toFixed(1) : 0}% del tuo obiettivo di risparmio.`,
      icon: isNegative ? AlertTriangle : Target
    },
    {
      type: 'info' as const,
      text: `💡 Il tuo tasso di risparmio è del ${Math.abs(savingsRate).toFixed(1)}%. Per un benessere finanziario sostenibile, cerca di risparmiare almeno il 15% del tuo reddito.`,
      icon: PiggyBank
    }
  ];
}

