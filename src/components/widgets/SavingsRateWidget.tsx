import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function SavingsRateWidget() {
  const { metrics, isLoading } = useDashboardData();

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Nessun dato disponibile
      </div>
    );
  }

  const savingsRate = (metrics.savingsRate * 100).toFixed(1);
  const totalIncome = metrics.totalIncome;
  const totalExpenses = metrics.totalExpenses;

  return (
    <div className="text-center p-4">
      <div className="text-4xl font-bold text-green-400 mb-2">
        {savingsRate}%
      </div>
      <div className="text-lg font-semibold mb-1">Tasso di Risparmio</div>
      <div className="text-xs text-gray-400 mb-3">Del tuo reddito mensile</div>
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
          <div className="text-gray-400">Entrate</div>
          <div className="font-semibold">€{totalIncome.toLocaleString('it-IT')}</div>
        </div>
        <div>
          <div className="text-gray-400">Uscite</div>
          <div className="font-semibold">€{totalExpenses.toLocaleString('it-IT')}</div>
        </div>
      </div>
    </div>
  );
}
