import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface StatsOverviewProps {
  totalInvestments: number;
  totalYield: number;
  goalsProgress: number;
  monthlyChange: number;
}

export const StatsOverview = ({
  totalInvestments,
  totalYield,
  goalsProgress,
  monthlyChange,
}: StatsOverviewProps) => {
  const { formatCurrency } = useApp();

  const stats = [
    {
      title: "Total Investments",
      value: formatCurrency(totalInvestments),
      icon: DollarSign,
      trend: monthlyChange,
      color: "from-info to-info/70",
    },
    {
      title: "Total Yield",
      value: `${totalYield >= 0 ? "+" : ""}${totalYield.toFixed(2)}%`,
      icon: totalYield >= 0 ? TrendingUp : TrendingDown,
      trend: totalYield,
      color: totalYield >= 0 ? "from-success to-success/70" : "from-destructive to-destructive/70",
    },
    {
      title: "Goals Progress",
      value: `${goalsProgress.toFixed(0)}%`,
      icon: Target,
      trend: goalsProgress,
      color: "from-accent to-accent/70",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="glass-morphism hover-lift animate-fade-in p-6 relative overflow-hidden group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                  {stat.title}
                </p>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} opacity-20 group-hover:opacity-30 transition-opacity`}>
                  <Icon className="icon-card text-foreground" />
                </div>
              </div>
              <p className="text-medium-number bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text break-words">
                {stat.value}
              </p>
              {stat.trend !== undefined && (
                <div className="mt-2 flex items-center gap-1">
                  {stat.trend >= 0 ? (
                    <TrendingUp className="icon-button text-success" />
                  ) : (
                    <TrendingDown className="icon-button text-destructive" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend >= 0 ? "text-success" : "text-destructive"}`}>
                    {stat.trend >= 0 ? "+" : ""}{Math.abs(stat.trend).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
