import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp, Lightbulb, Rocket, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InvestmentsDetailViewProps {
  totalInvestments: number;
  idealAllocation: { name: string; percentage: number; color: string }[];
}

const IDEAL_ALLOCATION = [
  { name: 'Azioni', percentage: 60, color: '#8b5cf6' },
  { name: 'Obligazioni', percentage: 30, color: '#10b981' },
  { name: 'Cash', percentage: 10, color: '#f59e0b' }
];

export function InvestmentsDetailView({
  totalInvestments,
  idealAllocation = IDEAL_ALLOCATION
}: InvestmentsDetailViewProps) {
  const navigate = useNavigate();
  const hasInvestments = totalInvestments > 0;

  return (
    <>
      {!hasInvestments ? (
        /* Empty State */
        <Card className="border-0 bg-card/50 backdrop-blur-sm p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Non hai ancora investimenti</h3>
          <p className="text-muted-foreground mb-6">
            Inizia a investire per far crescere i tuoi risparmi nel tempo
          </p>
          <Button onClick={() => navigate('/investments')} className="bg-primary">
            Inizia a Investire
          </Button>
        </Card>
      ) : (
        <>
          {/* Performance Chart */}
          <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Allocazione Ideale</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={idealAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {idealAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Current Performance */}
          <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Valore Totale</h3>
              <span className="text-2xl font-bold font-mono text-green-600">
                €{totalInvestments.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>Performance positiva</span>
            </div>
          </Card>
        </>
      )}

      {/* Recommendations */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Raccomandazioni</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Diversifica il Portafoglio</p>
              <p className="text-sm text-muted-foreground">
                Distribuisci i tuoi investimenti tra azioni, obbligazioni e cash per ridurre il rischio.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
            <Rocket className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Investi Regolarmente</p>
              <p className="text-sm text-muted-foreground">
                Investi una quota fissa ogni mese per sfruttare la potenza dell'interesse composto.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

export function getInvestmentsInsights(props: InvestmentsDetailViewProps) {
  const { totalInvestments } = props;
  const hasInvestments = totalInvestments > 0;

  return [
    {
      type: hasInvestments ? 'success' as const : 'info' as const,
      text: hasInvestments
        ? `💼 Hai €${totalInvestments.toLocaleString('it-IT', { minimumFractionDigits: 2 })} investiti. Continua così!`
        : `💡 Non hai ancora investimenti. Inizia oggi per far crescere i tuoi risparmi nel tempo.`,
      icon: TrendingUp
    },
    {
      type: 'info' as const,
      text: `📈 Diversifica il tuo portafoglio: 60% azioni, 30% obbligazioni, 10% cash è una strategia solida.`,
      icon: Target
    }
  ];
}

