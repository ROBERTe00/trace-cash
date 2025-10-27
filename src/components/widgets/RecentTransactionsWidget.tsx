import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentTransactionsWidget() {
  const navigate = useNavigate();
  const { expenses, isLoading } = useDashboardData();

  const handleViewAll = () => {
    navigate('/transactions');
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Nessuna transazione recente
      </div>
    );
  }

  const recent = expenses.slice(0, 2);

  const getIcon = (category: string, type: string) => {
    if (type === 'Income') return '💰';
    const icons: Record<string, string> = {
      'Food': '🍕',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Health': '🏥',
      'Bills': '💳',
    };
    return icons[category] || '💸';
  };

  const getAmountColor = (type: string) => {
    return type === 'Income' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Transazioni Recenti</h3>
        <button 
          onClick={handleViewAll}
          className="text-sm text-gray-400 hover:text-white flex items-center"
        >
          Vedi tutte
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
      <div className="space-y-3">
        {recent.map((transaction: any) => {
          const icon = getIcon(transaction.category, transaction.type);
          const color = transaction.type === 'Income' 
            ? 'bg-green-500/20' 
            : 'bg-red-500/20';
          const iconColor = transaction.type === 'Income' 
            ? 'text-green-400' 
            : 'text-red-400';
          
          const date = new Date(transaction.date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isYesterday = new Date(date.setDate(date.getDate() + 1)).toDateString() === new Date().toDateString();
          
          const dateStr = isToday ? 'Oggi' : isYesterday ? 'Ieri' : 
            date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

          return (
            <div 
              key={transaction.id}
              className="flex justify-between items-center hover:bg-white/5 p-2 rounded cursor-pointer"
              onClick={() => navigate('/transactions')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center`}>
                  <span className={iconColor}>{icon}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">{transaction.description}</div>
                  <div className="text-xs text-gray-400">{dateStr} • {transaction.category}</div>
                </div>
              </div>
              <div className={getAmountColor(transaction.type)}>
                {transaction.type === 'Income' ? '+' : '-'}€{transaction.amount.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
