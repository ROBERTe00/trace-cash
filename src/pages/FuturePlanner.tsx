import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Target, Trophy, TrendingUp, DollarSign } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="icon-card text-primary" />
              </div>
              <div>
                <h1 className="text-section">Pianificazione Futura</h1>
                <p className="text-sm text-muted-foreground">Monitora obiettivi e patrimonio</p>
              </div>
            </div>
            <Button onClick={() => setWizardOpen(true)} size="lg" className="gap-2">
              <Plus className="icon-button" />
              <span className="hidden sm:inline">Nuovo Obiettivo</span>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      {/* Stats Overview - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="icon-card text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Attivi</div>
              <div className="text-small-number text-primary">{activeGoals.length}</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Trophy className="icon-card text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Completati</div>
              <div className="text-small-number text-success">{completedGoals.length}</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="icon-card text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Progresso</div>
              <div className="text-small-number text-primary">{totalProgress.toFixed(0)}%</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="icon-card text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Valore Totale</div>
              <div className="text-small-number text-primary truncate">
                €{goals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      {goals.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Target className="icon-hero text-muted-foreground mx-auto mb-4" />
          <h3 className="text-card-title mb-2">Inizia la Tua Pianificazione</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crea il tuo primo obiettivo finanziario utilizzando il wizard guidato.
          </p>
          <Button onClick={() => setWizardOpen(true)} size="lg" className="gap-2">
            <Plus className="icon-button" />
            Crea Primo Obiettivo
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="goals" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="icon-button" />
              <span className="hidden sm:inline">Obiettivi</span>
            </TabsTrigger>
            <TabsTrigger value="networth" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="icon-button" />
              <span className="hidden sm:inline">Patrimonio</span>
            </TabsTrigger>
            <TabsTrigger value="simulator" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="icon-button" />
              <span className="hidden sm:inline">Simulatore</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Goals */}
          <TabsContent value="goals" className="space-y-6">
            {/* Goal Selector - Horizontal */}
            {goals.length > 1 && (
              <Card className="glass-card p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Seleziona:</span>
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

            {/* Goal Timeline - Compact */}
            <div className="max-h-[600px] overflow-y-auto">
              <GoalTimeline goals={selectedGoal ? [selectedGoal] : goals} />
            </div>
          </TabsContent>

          {/* TAB 2: Net Worth & Emergency Fund */}
          <TabsContent value="networth" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetWorthTracker expenses={expenses} investments={investments} />
              <EmergencyFundTracker expenses={expenses} />
            </div>
          </TabsContent>

          {/* TAB 3: Scenario Simulator */}
          <TabsContent value="simulator" className="space-y-6">
            {selectedGoal ? (
              <ScenarioSimulator goal={selectedGoal} />
            ) : (
              <Card className="glass-card p-12 text-center">
                <Trophy className="icon-hero text-muted-foreground mx-auto mb-4" />
                <h3 className="text-card-title mb-2">Seleziona un Obiettivo</h3>
                <p className="text-muted-foreground">
                  Seleziona un obiettivo per simulare diversi scenari
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
