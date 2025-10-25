import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Trophy, Target, DollarSign } from "lucide-react";

interface IncomeDetailViewProps {
  totalIncome: number;
  incomeChange: number;
  monthlyTrend: { month: string; value: number }[];
  projectedYearly: number;
}

export function IncomeDetailView({
  totalIncome,
  incomeChange,
  monthlyTrend,
  projectedYearly
}: IncomeDetailViewProps) {
  const avgIncome = monthlyTrend.reduce((sum, m) => sum + m.value, 0) / monthlyTrend.length;
  const isAboveAverage = totalIncome > avgIncome;

  return (
    <>
      {/* Trend Chart */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Trend Reddito</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorIncome)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="border-0 bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="text-sm text-muted-foreground">Media Mensile</p>
          </div>
          <p className="text-2xl font-bold font-mono">
            €{avgIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="border-0 bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-muted-foreground">Proiezione Annuale</p>
          </div>
          <p className="text-2xl font-bold font-mono">
            €{projectedYearly.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Performance Badge */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isAboveAverage ? 'bg-green-500/10' : 'bg-yellow-500/10'
          }`}>
            <Trophy className={`w-6 h-6 ${isAboveAverage ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <p className="font-semibold">{isAboveAverage ? 'Above Average' : 'On Track'}</p>
            <p className="text-sm text-muted-foreground">
              {isAboveAverage 
                ? 'Il tuo reddito è superiore alla media degli ultimi mesi'
                : 'Il tuo reddito è stabile rispetto alla media'
              }
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

export function getIncomeInsights(props: IncomeDetailViewProps) {
  const { totalIncome, incomeChange, projectedYearly } = props;

  return [
    {
      type: incomeChange > 0 ? 'success' as const : 'info' as const,
      text: incomeChange > 0
        ? `🎉 Incredibile! Il tuo reddito è aumentato del ${incomeChange.toFixed(1)}% rispetto al mese scorso.`
        : `📊 Il tuo reddito è stabile. Proiezione annuale: €${projectedYearly.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp
    },
    {
      type: 'info' as const,
      text: `💰 Se mantieni questo ritmo, guadagnerai circa €${projectedYearly.toLocaleString('it-IT', { minimumFractionDigits: 2 })} quest'anno.`,
      icon: Trophy
    }
  ];
}

