import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Target, Trophy } from "lucide-react";
import { getGoals, saveGoals, FinancialGoal } from "@/lib/storage";
import { GoalWizard } from "@/components/GoalWizard";
import { GoalTimeline } from "@/components/GoalTimeline";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { EmergencyFundTracker } from "@/components/EmergencyFundTracker";
import { NetWorthTracker } from "@/components/NetWorthTracker";
import { getExpenses, getInvestments } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function FuturePlanner() {
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const expenses = getExpenses();
  const investments = getInvestments();

  useEffect(() => {
    const loadedGoals = getGoals();
    setGoals(loadedGoals);
    if (loadedGoals.length > 0 && !selectedGoal) {
      setSelectedGoal(loadedGoals[0]);
    }
  }, []);

  const handleAddGoal = (goal: Omit<FinancialGoal, "id">) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: crypto.randomUUID(),
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
    setSelectedGoal(newGoal);
  };

  const activeGoals = goals.filter(g => (g.currentAmount / g.targetAmount) * 100 < 100);
  const completedGoals = goals.filter(g => (g.currentAmount / g.targetAmount) * 100 >= 100);
  const totalProgress = goals.length > 0
    ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / goals.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-section">Pianificazione Futura</h1>
          <p className="text-muted-foreground">Crea e monitora i tuoi obiettivi finanziari con AI</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Plus className="icon-button" />
          Nuovo Obiettivo
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="glass-card p-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Target className="icon-card text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground truncate">Obiettivi Attivi</div>
              <div className="text-medium-number truncate">{activeGoals.length}</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10 flex-shrink-0">
              <Trophy className="icon-card text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground truncate">Completati</div>
              <div className="text-medium-number truncate">{completedGoals.length}</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10 flex-shrink-0">
              <Target className="icon-card text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground truncate">Progresso Medio</div>
              <div className="text-medium-number truncate">{totalProgress.toFixed(0)}%</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10 flex-shrink-0">
              <Target className="icon-card text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground truncate">Valore Totale</div>
              <div className="text-small-number truncate">
                €{goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Goal Selection */}
      {goals.length > 1 && (
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Seleziona Obiettivo:</span>
            {goals.map((goal) => (
              <Badge
                key={goal.id}
                variant={selectedGoal?.id === goal.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedGoal(goal)}
              >
                {goal.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content */}
      {goals.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Target className="icon-hero text-muted-foreground mx-auto mb-4" />
          <h3 className="text-card-title mb-2">Inizia la Tua Pianificazione</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crea il tuo primo obiettivo finanziario utilizzando il wizard guidato.
            Definisci importo, scadenza e contributo mensile per iniziare.
          </p>
          <Button onClick={() => setWizardOpen(true)} size="lg" className="gap-2">
            <Plus className="icon-button" />
            Crea Primo Obiettivo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <GoalTimeline goals={goals} />
          </div>

          {/* Right Column - Tools */}
          <div className="space-y-6">
            {selectedGoal && (
              <ScenarioSimulator goal={selectedGoal} />
            )}
            
            <EmergencyFundTracker expenses={expenses} />
            
            <NetWorthTracker expenses={expenses} investments={investments} />
          </div>
        </div>
      )}

      {/* Wizard Dialog */}
      <GoalWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleAddGoal}
      />
    </div>
  );
}
