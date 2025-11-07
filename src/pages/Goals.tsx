import { useEffect, useState, useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { useFinancialGoals, FinancialGoal } from "@/hooks/useFinancialGoals";
import { useModal } from "@/hooks/useInteractions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, MoreVertical, Trophy, Target } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth, subMonths, differenceInMonths } from "date-fns";
import { useExpenses } from "@/hooks/useExpenses";
import { useSearchParams } from "react-router-dom";
import { registerChartJS } from "@/lib/chartRegistry";

// Register Chart.js components (centralized)
registerChartJS();

const GOAL_TYPE_COLORS: Record<string, string> = {
  savings: '#00D4AA',
  investment: '#7B2FF7',
  debt_payoff: '#FF6B35',
  purchase: '#FFD166',
  emergency_fund: '#118AB2',
  retirement: '#9B59B6'
};

const GOAL_TYPE_ICONS: Record<string, string> = {
  savings: '💰',
  investment: '📈',
  debt_payoff: '💳',
  purchase: '🛍️',
  emergency_fund: '🛡️',
  retirement: '🎯'
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  savings: 'Risparmio',
  investment: 'Investimento',
  debt_payoff: 'Riduzione Debiti',
  purchase: 'Acquisto',
  emergency_fund: 'Fondo Emergenza',
  retirement: 'Pensione'
};

export default function Goals() {
  console.log('[Goals] Component rendering...');
  
  const { 
    goals: goalsData = [], 
    isLoading = false, 
    createGoal, 
    updateGoal, 
    deleteGoal 
  } = useFinancialGoals() || {};
  
  const { expenses: expensesData = [] } = useExpenses() || {};
  
  const goals = goalsData || [];
  const expenses = expensesData || [];
  
  console.log('[Goals] Hook values:', { 
    goalsCount: goals.length, 
    expensesCount: expenses.length, 
    isLoading,
    hasCreateFn: !!createGoal
  });
  const addModal = useModal();
  const editModal = useModal<{ goal: FinancialGoal }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: 0,
    current_amount: 0,
    goal_type: 'savings' as FinancialGoal['goal_type'],
    priority: 'medium' as FinancialGoal['priority'],
    deadline: '',
    status: 'active' as FinancialGoal['status']
  });

  // Open modal if action parameter is present
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      addModal.open();
      // Remove the action parameter from URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, addModal, setSearchParams]);

  // Calculate real metrics
  const metrics = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalCurrent = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
    const avgProgress = activeGoals.length > 0 
      ? activeGoals.reduce((sum, g) => sum + (g.current_amount / g.target_amount) * 100, 0) / activeGoals.length 
      : 0;
    
    // Calculate monthly savings from expenses
    let monthlySavings = 0;
    if (expenses && expenses.length > 0) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const monthlyIncome = expenses
        .filter(e => e.type === 'Income' && new Date(e.date) >= lastMonth)
        .reduce((sum, e) => sum + e.amount, 0);
      const monthlyExpenses = expenses
        .filter(e => e.type === 'Expense' && new Date(e.date) >= lastMonth)
        .reduce((sum, e) => sum + e.amount, 0);
      monthlySavings = monthlyIncome - monthlyExpenses;
    }
    
    // Calculate needed monthly savings for all goals
    const neededMonthly = activeGoals.reduce((sum, goal) => {
      if (!goal.deadline) return sum;
      const deadline = parseISO(goal.deadline);
      const monthsRemaining = Math.max(1, differenceInMonths(deadline, new Date()));
      const remaining = goal.target_amount - goal.current_amount;
      return sum + (remaining / monthsRemaining);
    }, 0);
    
    // Get last completed goal
    const lastCompleted = completedGoals
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    
    return {
      activeCount: activeGoals.length,
      totalTarget,
      totalCurrent,
      avgProgress,
      completedCount: completedGoals.length,
      monthlySavings,
      neededMonthly,
      lastCompleted
    };
  }, [goals, expenses]);

  // Generate chart data from real goals
  const chartData = useMemo(() => {
    if (!goals || goals.length === 0) return null;
    
    const activeGoals = goals.filter(g => g.status === 'active').slice(0, 6);
    if (activeGoals.length === 0) return null;
    
    // Generate last 12 months
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now
    });
    
    const labels = months.map(m => format(m, 'MMM'));
    const datasets = activeGoals.map((goal) => {
      const color = GOAL_TYPE_COLORS[goal.goal_type] || '#7B2FF7';
      
      const data = months.map((month, monthIdx) => {
        const progress = (monthIdx + 1) / 12;
        return Math.min(goal.current_amount + (goal.target_amount - goal.current_amount) * progress, goal.target_amount);
      });
      
      return {
        label: goal.title,
        data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        borderWidth: 2,
        fill: true,
        tension: 0.4
      };
    });
    
    return { labels, datasets };
  }, [goals]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value: any) => '€' + (Number(value) / 1000) + 'k'
        }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    }
  } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editModal.data?.goal) {
        console.log('[Goals] Updating goal:', editModal.data.goal.id, formData);
        await updateGoal({ id: editModal.data.goal.id, ...formData });
        editModal.close();
        // Toast viene emesso automaticamente da useFinancialGoals.onSuccess
      } else {
        console.log('[Goals] Creating goal:', formData);
        console.log('[Goals] createGoal function:', typeof createGoal);
        const result = await createGoal(formData);
        console.log('[Goals] Goal created successfully:', result);
        addModal.close();
        // Toast viene emesso automaticamente da useFinancialGoals.onSuccess
      }
      setFormData({
        title: '',
        description: '',
        target_amount: 0,
        current_amount: 0,
        goal_type: 'savings',
        priority: 'medium',
        deadline: '',
        status: 'active'
      });
    } catch (error: any) {
      console.error('[Goals] Error saving goal:', error);
      console.error('[Goals] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      toast.error(`Errore nel salvataggio dell'obiettivo: ${error?.message || 'Errore sconosciuto'}`);
      throw error; // Re-throw per permettere al form di gestire
    }
  };

  const handleEdit = (goal: FinancialGoal) => {
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      goal_type: goal.goal_type,
      priority: goal.priority,
      deadline: goal.deadline || '',
      status: goal.status
    });
    editModal.open({ goal });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo obiettivo?')) {
      try {
        await deleteGoal(id);
        toast.success("Obiettivo eliminato con successo!");
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error("Errore nell'eliminazione dell'obiettivo");
      }
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getGoalStatus = (goal: FinancialGoal) => {
    if (goal.status === 'completed') return 'Completato';
    if (!goal.deadline) return 'In corso';
    const deadline = parseISO(goal.deadline);
    const progress = calculateProgress(goal.current_amount, goal.target_amount);
    const monthsRemaining = differenceInMonths(deadline, new Date());
    const expectedProgress = (1 - monthsRemaining / 12) * 100;
    if (progress >= expectedProgress) return 'In linea';
    return 'In ritardo';
  };

  useEffect(() => {
    if (editModal.data?.goal) {
      const goal = editModal.data.goal;
      setFormData({
        title: goal.title,
        description: goal.description || '',
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        goal_type: goal.goal_type,
        priority: goal.priority,
        deadline: goal.deadline || '',
        status: goal.status
      });
    }
  }, [editModal.data]);

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const overdueGoals = activeGoals.filter(g => {
    if (!g.deadline) return false;
    const deadline = parseISO(g.deadline);
    const progress = calculateProgress(g.current_amount, g.target_amount);
    const monthsRemaining = differenceInMonths(deadline, new Date());
    const expectedProgress = (1 - monthsRemaining / 12) * 100;
    return progress < expectedProgress;
  });

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 gradient-text">I Tuoi Obiettivi Finanziari</h1>
            <p className="text-gray-400 text-lg">Pianifica, traccia e raggiungi i tuoi traguardi finanziari</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => addModal.open()} className="glass-card hover:bg-white/10">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Obiettivo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 fade-in">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{metrics.activeCount}</div>
            <div className="text-gray-400">Obiettivi Attivi</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">€{metrics.totalTarget.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</div>
            <div className="text-gray-400">Valore Totale Obiettivi</div>
            <div className="text-sm text-primary mt-2">€{metrics.totalCurrent.toLocaleString('it-IT', { maximumFractionDigits: 0 })} raggiunti</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{Math.round(metrics.avgProgress)}%</div>
            <div className="text-gray-400">Progresso Medio</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-accent mb-2">{metrics.completedCount}</div>
            <div className="text-gray-400">Obiettivi Completati</div>
            {metrics.lastCompleted && (
              <div className="text-sm text-accent mt-2">Ultimo: {metrics.lastCompleted.title}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          <div className="xl:col-span-2 glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">Obiettivi in Corso</h3>
            </div>

            <div className="space-y-6">
              {activeGoals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun obiettivo attivo. Crea il tuo primo obiettivo!</p>
                </div>
              ) : (
                activeGoals.map((goal) => {
                  const progress = calculateProgress(goal.current_amount, goal.target_amount);
                  const status = getGoalStatus(goal);
                  const color = GOAL_TYPE_COLORS[goal.goal_type] || '#7B2FF7';
                  
                  return (
                    <div key={goal.id} className="goal-card p-6 bg-white/5 rounded-xl">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                            <span className="text-2xl">{GOAL_TYPE_ICONS[goal.goal_type] || '🎯'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold">{goal.title}</h4>
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                {GOAL_TYPE_LABELS[goal.goal_type] || goal.goal_type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{goal.description || `Obiettivo: €${goal.target_amount.toLocaleString('it-IT')}`}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Progresso: {progress.toFixed(1)}%</span>
                          <span className={`${status === 'In linea' ? 'text-green-400' : status === 'In ritardo' ? 'text-orange-400' : 'text-secondary'}`}>
                            {status}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div className="h-3 rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${color}, ${color}cc)` }} />
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-gray-400">
                          <span>€{goal.current_amount.toLocaleString('it-IT')}</span>
                          <span>€{goal.target_amount.toLocaleString('it-IT')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 fade-in">
              <h3 className="text-xl font-semibold mb-6">Progresso Complessivo</h3>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <svg className="w-40 h-40" viewBox="0 0 120 120">
                    <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
                    <circle 
                      className="text-secondary" 
                      strokeWidth="8" 
                      strokeLinecap="round" 
                      stroke="currentColor" 
                      fill="transparent" 
                      r="52" 
                      cx="60" 
                      cy="60" 
                      strokeDasharray="326.56" 
                      strokeDashoffset={326.56 * (1 - Math.min(metrics.avgProgress, 100) / 100)} 
                      transform="rotate(-90 60 60)" 
                    />
                    <text x="60" y="65" textAnchor="middle" className="text-2xl font-bold fill-white">{Math.round(metrics.avgProgress)}%</text>
                    <text x="60" y="85" textAnchor="middle" className="text-xs fill-gray-400">Completato</text>
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Obiettivi Completati</span>
                  <span className="font-semibold text-secondary">{metrics.completedCount}/{goals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">In Progresso</span>
                  <span className="font-semibold text-primary">{activeGoals.length}/{goals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">In Ritardo</span>
                  <span className="font-semibold text-accent">{overdueGoals.length}/{goals.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Proiezione Obiettivi</h3>
            </div>
            <div className="h-80">
              {chartData ? (
                <Chart type="line" data={chartData} options={options} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Nessun dato disponibile
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Piano di Risparmio</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Risparmio Mensile Attuale</span>
                  <span className="font-semibold text-secondary">€{metrics.monthlySavings.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-secondary h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min((metrics.monthlySavings / Math.max(metrics.neededMonthly, 1)) * 100, 100)}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Necessario per Obiettivi</span>
                  <span className="font-semibold text-primary">€{metrics.neededMonthly.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              {metrics.neededMonthly > metrics.monthlySavings && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">💡</span>
                    <div>
                      <div className="font-semibold text-blue-400 mb-1">Raccomandazione</div>
                      <div className="text-sm text-gray-300">
                        Per raggiungere tutti i tuoi obiettivi, considera di aumentare il risparmio mensile di €{(metrics.neededMonthly - metrics.monthlySavings).toLocaleString('it-IT', { maximumFractionDigits: 0 })} o estendere alcune scadenze.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {completedGoals.length > 0 && (
          <div className="glass-card p-6 fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-10 w-10 text-yellow-400" />
              <div>
                <h3 className="text-2xl font-semibold">Obiettivi Raggiunti</h3>
                <p className="text-gray-400">Celebra i tuoi successi finanziari!</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.slice(0, 4).map((goal) => {
                const color = GOAL_TYPE_COLORS[goal.goal_type] || '#7B2FF7';
                return (
                  <div key={goal.id} className="p-6 bg-gradient-to-br rounded-2xl border" style={{ 
                    background: `linear-gradient(to bottom right, ${color}10, ${color}05)`,
                    borderColor: `${color}30`
                  }}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <span className="text-2xl">{GOAL_TYPE_ICONS[goal.goal_type] || '🎯'}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{goal.title}</h4>
                        <p className="text-sm text-gray-400">
                          Completato il {format(parseISO(goal.updated_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2" style={{ color }}>€{goal.target_amount.toLocaleString('it-IT')}</div>
                      <div className="text-sm text-gray-400">{goal.description || 'Obiettivo completato!'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        <Dialog open={addModal.isOpen} onOpenChange={(open) => open ? addModal.open() : addModal.close()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuovo Obiettivo</DialogTitle>
              <DialogDescription>Crea un nuovo obiettivo finanziario da raggiungere</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_amount">Importo Target</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="current_amount">Importo Attuale</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal_type">Tipo</Label>
                  <Select value={formData.goal_type} onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Risparmio</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="debt_payoff">Riduzione Debiti</SelectItem>
                      <SelectItem value="purchase">Acquisto</SelectItem>
                      <SelectItem value="emergency_fund">Fondo Emergenza</SelectItem>
                      <SelectItem value="retirement">Pensione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priorità</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Scadenza</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => addModal.close()}>Annulla</Button>
                <Button type="submit">Crea Obiettivo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Goal Modal */}
        <Dialog open={editModal.isOpen} onOpenChange={(open) => open ? editModal.open(editModal.data) : editModal.close()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifica Obiettivo</DialogTitle>
              <DialogDescription>Modifica i dettagli del tuo obiettivo</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit_title">Titolo</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Descrizione</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_target_amount">Importo Target</Label>
                  <Input
                    id="edit_target_amount"
                    type="number"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_current_amount">Importo Attuale</Label>
                  <Input
                    id="edit_current_amount"
                    type="number"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_goal_type">Tipo</Label>
                  <Select value={formData.goal_type} onValueChange={(value: any) => setFormData({ ...formData, goal_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Risparmio</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="debt_payoff">Riduzione Debiti</SelectItem>
                      <SelectItem value="purchase">Acquisto</SelectItem>
                      <SelectItem value="emergency_fund">Fondo Emergenza</SelectItem>
                      <SelectItem value="retirement">Pensione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_priority">Priorità</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_deadline">Scadenza</Label>
                <Input
                  id="edit_deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_status">Stato</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                    <SelectItem value="paused">In Pausa</SelectItem>
                    <SelectItem value="cancelled">Cancellato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => editModal.close()}>Annulla</Button>
                <Button type="submit">Salva Modifiche</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
