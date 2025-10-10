import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Users, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BenchmarkData {
  percentile: number;
  avgPortfolio: number;
  avgReturn: number;
  userCount: number;
}

interface LeaderboardWidgetProps {
  userPercentile?: number;
  userPortfolio?: number;
  userReturn?: number;
}

export function LeaderboardWidget({ userPercentile, userPortfolio, userReturn }: LeaderboardWidgetProps) {
  // Mock data - In production this would come from aggregated database queries
  const benchmarks: BenchmarkData[] = [
    { percentile: 10, avgPortfolio: 150000, avgReturn: 12.5, userCount: 1250 },
    { percentile: 20, avgPortfolio: 100000, avgReturn: 10.2, userCount: 2500 },
    { percentile: 50, avgPortfolio: 50000, avgReturn: 7.8, userCount: 6250 },
    { percentile: 80, avgPortfolio: 25000, avgReturn: 5.4, userCount: 10000 },
  ];

  const getUserTier = (percentile?: number) => {
    if (!percentile) return null;
    if (percentile <= 10) return { name: "Elite", color: "from-yellow-500 to-orange-500", icon: "🏆" };
    if (percentile <= 25) return { name: "Avanzato", color: "from-blue-500 to-cyan-500", icon: "💎" };
    if (percentile <= 50) return { name: "Intermedio", color: "from-green-500 to-emerald-500", icon: "⭐" };
    return { name: "In Crescita", color: "from-gray-500 to-slate-500", icon: "🌱" };
  };

  const tier = getUserTier(userPercentile);

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Classifica Anonima</h2>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          GDPR Compliant
        </Badge>
      </div>

      {/* User Position */}
      {userPercentile && tier && (
        <div className={`mb-6 p-4 rounded-lg bg-gradient-to-r ${tier.color} bg-opacity-10 border border-current`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{tier.icon}</span>
              <div>
                <div className="font-bold text-lg">{tier.name}</div>
                <div className="text-sm text-muted-foreground">
                  Sei nel {userPercentile}° percentile
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Top {userPercentile}%</div>
              <div className="text-xs text-muted-foreground">degli utenti</div>
            </div>
          </div>
          <Progress value={100 - userPercentile} className="h-2" />
        </div>
      )}

      {/* Benchmarks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Benchmark della Community</h3>
        </div>

        {benchmarks.map((benchmark, index) => (
          <div
            key={benchmark.percentile}
            className={`p-4 rounded-lg border transition-all ${
              userPercentile && userPercentile <= benchmark.percentile
                ? "bg-primary/5 border-primary/30"
                : "bg-muted/30 border-muted"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                  index === 1 ? "bg-blue-500/20 text-blue-600" :
                  index === 2 ? "bg-green-500/20 text-green-600" :
                  "bg-gray-500/20 text-gray-600"
                }`}>
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👥"}
                </div>
                <div>
                  <div className="font-semibold">Top {benchmark.percentile}%</div>
                  <div className="text-xs text-muted-foreground">
                    {benchmark.userCount.toLocaleString()} utenti
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {benchmark.avgReturn}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-1">Portafoglio Medio</div>
                <div className="font-bold">€{benchmark.avgPortfolio.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Rendimento Annuo</div>
                <div className="font-bold text-green-600">+{benchmark.avgReturn}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        📊 Dati aggregati e anonimizzati da {benchmarks[3].userCount.toLocaleString()} utenti opt-in.
        Aggiornati mensilmente per garantire privacy.
      </div>
    </Card>
  );
}
