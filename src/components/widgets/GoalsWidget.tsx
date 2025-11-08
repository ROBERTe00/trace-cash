import { Target, Plus } from 'lucide-react';
import { useFinancialGoals } from '@/hooks/useFinancialGoals';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function GoalsWidget() {
  const navigate = useNavigate();
  const { goals, isLoading } = useFinancialGoals();

  useEffect(() => {
    console.log('[GoalsWidget] Render - isLoading:', isLoading, 'goals:', goals?.length || 0);
  }, [isLoading, goals]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  const activeGoals = goals?.filter(g => g.status === 'active').slice(0, 3) || [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Obiettivi Attivi
        </h3>
        <button 
          onClick={() => navigate('/goals')}
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          Vedi tutti
        </button>
      </div>
      
      {activeGoals.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm space-y-3">
          <Target className="w-12 h-12 mx-auto opacity-50" />
          <p>Nessun obiettivo attivo</p>
          <button 
            onClick={() => navigate('/goals')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Crea il primo obiettivo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => {
            const progress = ((goal.current_amount || 0) / goal.target_amount) * 100;
            const remaining = goal.target_amount - (goal.current_amount || 0);
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{goal.title}</div>
                    <div className="text-xs text-gray-400">{goal.description || 'Nessuna descrizione'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      €{(goal.current_amount || 0).toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs text-gray-400">
                      di €{goal.target_amount.toLocaleString('it-IT')}
                    </div>
                  </div>
                </div>
                <Progress value={Math.min(100, Math.max(0, progress))} className="h-2" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{progress.toFixed(0)}% completato</span>
                  <span>€{remaining.toLocaleString('it-IT')} rimanenti</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
