import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

export function RecentTransactionsWidget() {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { expenses, isLoading, error } = useDashboardData();

  useEffect(() => {
    console.log('[RecentTransactionsWidget] Render - isLoading:', isLoading, 'expenses:', expenses?.length || 0, 'error:', !!error);
  }, [isLoading, expenses, error]);

  const handleViewAll = () => {
    navigate('/transactions');
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Transazioni Recenti</h3>
          <button 
            onClick={handleViewAll}
            className="text-sm text-gray-400 hover:text-white flex items-center"
          >
            Vedi sezione
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={handleViewAll}>
          <div className="text-4xl mb-3">💸</div>
          <p className="text-sm font-medium mb-1 text-white">Nessuna transazione recente</p>
          <p className="text-xs text-gray-400">Clicca per aggiungere la prima transazione</p>
        </div>
      </div>
    );
  }

  const displayCount = showAll ? expenses.length : 7;
  const recent = expenses.slice(0, displayCount);

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
        <div className="flex items-center gap-2">
          {expenses.length > 7 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Comprimi
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Mostra tutte ({expenses.length})
                </>
              )}
            </button>
          )}
          <button 
            onClick={handleViewAll}
            className="text-sm text-gray-400 hover:text-white flex items-center"
          >
            Vedi sezione
            <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
