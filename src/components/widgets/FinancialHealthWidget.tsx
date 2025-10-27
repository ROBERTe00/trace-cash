import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

interface FinancialHealthWidgetProps {
  onViewDetails?: () => void;
}

export function FinancialHealthWidget({ onViewDetails }: FinancialHealthWidgetProps) {
  const { metrics, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Nessun dato disponibile</p>
      </div>
    );
  }

  const totalBalance = metrics.savings;
  const healthScore = Math.min(100, Math.max(0, metrics.savingsRate));
  const savingsRate = (metrics.savingsRate * 100).toFixed(1);
  const streak = 7; // TODO: da implementare

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-gray-400 text-sm mb-2">Saldo Totale</div>
          <div className="text-3xl md:text-4xl font-bold mb-2">
            €{totalBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span>↑</span>
            <span>+{metrics.incomeChange.toFixed(1)}% vs mese scorso</span>
            <span className="text-gray-400">• €{metrics.incomeChange.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-right" onClick={onViewDetails}>
          <div className="text-gray-400 text-sm mb-2">Health Score</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl md:text-3xl font-bold">{Math.round(healthScore)}</div>
            <div className="text-gray-400">/100</div>
          </div>
          <div className="text-xs text-gray-400 mt-1">Livello 4 • Esperto</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-400 bg-clip-text text-transparent">
            {savingsRate}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Risparmiato</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <div className="text-xl md:text-2xl font-bold">
            {streak}<span className="text-orange-400"><Flame className="w-4 h-4 inline" /></span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Day Streak</div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <div className="text-xl md:text-2xl font-bold">3/5</div>
          <div className="text-xs text-gray-400 mt-1">Quest</div>
        </div>
      </div>
    </>
  );
}
