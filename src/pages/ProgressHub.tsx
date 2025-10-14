import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Star, Target, TrendingUp, Award, Download, CheckCircle2, Circle } from "lucide-react";
import { getExpenses, getInvestments, getGoals, saveGoals, FinancialGoal } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import { FinancialGoals } from "@/components/FinancialGoals";
import { TrendChart } from "@/components/TrendChart";
import { AIAdvicePanel } from "@/components/AIAdvicePanel";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'essential' | 'advanced' | 'expert';
}

export default function ProgressHub() {
  const { formatCurrency } = useApp();
  const { toast } = useToast();
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  useEffect(() => {
    calculateProgress();
    setGoals(getGoals());
  }, []);

  const handleAddGoal = (goal: Omit<FinancialGoal, "id">) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: crypto.randomUUID(),
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  const handleDeleteGoal = (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id);
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
    toast({
      title: "Goal Deleted",
      description: "Your financial goal has been removed.",
    });
  };

  const handleUpdateGoal = (id: string, currentAmount: number) => {
    const updatedGoals = goals.map(g => 
      g.id === id ? { ...g, currentAmount } : g
    );
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  const exportProgressToPDF = () => {
    const doc = new jsPDF();
    const expenses = getExpenses();
    const investments = getInvestments();
    
    doc.setFontSize(20);
    doc.text("Progress Hub Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    doc.text(`Current Streak: ${streak} days`, 20, 45);
    doc.text(`Level: ${level} - ${getLevelTitle(level)}`, 20, 55);
    doc.text(`XP Progress: ${xp}/100`, 20, 65);
    
    doc.text("Achievements:", 20, 80);
    let yPos = 90;
    achievements.forEach((ach, idx) => {
      const status = ach.unlocked ? "✓" : "○";
      doc.text(`${status} ${ach.title} (${ach.progress}/${ach.maxProgress})`, 25, yPos);
      yPos += 10;
    });
    
    if (goals.length > 0) {
      yPos += 10;
      doc.text("Financial Goals:", 20, yPos);
      yPos += 10;
      goals.forEach(goal => {
        const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
        doc.text(`${goal.name}: ${progress}% (€${goal.currentAmount}/€${goal.targetAmount})`, 25, yPos);
        yPos += 10;
      });
    }
    
    doc.save("progress-hub-report.pdf");
    toast({
      title: "Export Complete",
      description: "Your progress report has been downloaded.",
    });
  };

  const calculateProgress = () => {
    const expenses = getExpenses();
    const investments = getInvestments();
    
    const today = new Date().toISOString().split('T')[0];
    const recentDays = expenses
      .map(e => e.date)
      .filter(date => {
        const daysDiff = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      });
    setStreak(new Set(recentDays).size);

    const totalTransactions = expenses.length + investments.length;
    const calculatedLevel = Math.floor(totalTransactions / 10) + 1;
    const calculatedXp = (totalTransactions % 10) * 10;
    setLevel(calculatedLevel);
    setXp(calculatedXp);

    const portfolioValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);

    const newAchievements: Achievement[] = [
      {
        id: "first_investment",
        title: "Primo Investimento",
        description: "Aggiungi il tuo primo investimento",
        icon: TrendingUp,
        unlocked: investments.length > 0,
        progress: Math.min(investments.length, 1),
        maxProgress: 1,
        category: 'essential',
      },
      {
        id: "streak_7",
        title: "Guerriero Settimanale",
        description: "Traccia le spese per 7 giorni di fila",
        icon: Flame,
        unlocked: streak >= 7,
        progress: streak,
        maxProgress: 7,
        category: 'essential',
      },
      {
        id: "transactions_50",
        title: "Tracker Attivo",
        description: "Registra 50 transazioni",
        icon: Star,
        unlocked: totalTransactions >= 50,
        progress: Math.min(totalTransactions, 50),
        maxProgress: 50,
        category: 'advanced',
      },
      {
        id: "portfolio_1k",
        title: "Prima Pietra Miliare",
        description: "Raggiungi 1.000€ di valore portafoglio",
        icon: Target,
        unlocked: portfolioValue >= 1000,
        progress: Math.min(portfolioValue, 1000),
        maxProgress: 1000,
        category: 'advanced',
      },
      {
        id: "diversified",
        title: "Maestro Diversificazione",
        description: "Possiedi 5 investimenti diversi",
        icon: Trophy,
        unlocked: investments.length >= 5,
        progress: Math.min(investments.length, 5),
        maxProgress: 5,
        category: 'advanced',
      },
      {
        id: "level_10",
        title: "Professionista Finanza",
        description: "Raggiungi il livello 10",
        icon: Award,
        unlocked: calculatedLevel >= 10,
        progress: Math.min(calculatedLevel, 10),
        maxProgress: 10,
        category: 'expert',
      },
    ];

    setAchievements(newAchievements);

    newAchievements.forEach(achievement => {
      if (achievement.unlocked && achievement.progress === achievement.maxProgress) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    });
  };

  const getLevelTitle = (level: number) => {
    if (level < 5) return "Risparmiatore Principiante";
    if (level < 10) return "Spender Intelligente";
    if (level < 20) return "Esploratore Investimenti";
    if (level < 30) return "Guru Finanza";
    return "Maestro Ricchezza";
  };

  const expenses = getExpenses();
  const investments = getInvestments();
  
  const essentialAchievements = achievements.filter(a => a.category === 'essential');
  const advancedAchievements = achievements.filter(a => a.category === 'advanced');
  const expertAchievements = achievements.filter(a => a.category === 'expert');
  
  const overallProgress = achievements.length > 0 
    ? (achievements.filter(a => a.unlocked).length / achievements.length) * 100 
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header più compatto */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Progress Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitora i tuoi progressi finanziari
          </p>
        </div>
        <Button onClick={exportProgressToPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Esporta PDF
        </Button>
      </div>

      {/* Dashboard Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Streak Attuale</p>
              <p className="text-3xl font-bold mt-2">{streak}</p>
              <p className="text-xs text-muted-foreground mt-1">giorni consecutivi</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/20">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Livello</p>
              <p className="text-3xl font-bold mt-2">{level}</p>
              <p className="text-xs text-muted-foreground mt-1">{getLevelTitle(level)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Trophy className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">XP a Prossimo Livello</p>
              <Progress value={xp} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">{xp}/100 XP</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/20 ml-4">
              <Star className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs per organizzare meglio il contenuto */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            Obiettivi
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Tab Achievements */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Progresso Complessivo */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Progresso Complessivo</h3>
                <p className="text-sm text-muted-foreground">
                  {achievements.filter(a => a.unlocked).length} di {achievements.length} completati
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{overallProgress.toFixed(0)}%</p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </Card>

          {/* Achievements Essenziali */}
          {essentialAchievements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Essenziali
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {essentialAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {/* Achievements Avanzati */}
          {advancedAchievements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Avanzati
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advancedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {/* Achievements Esperti */}
          {expertAchievements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Esperti
                </h3>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expertAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab Obiettivi */}
        <TabsContent value="goals" className="space-y-6">
          <FinancialGoals />
          <TrendChart expenses={expenses} />
        </TabsContent>

        {/* Tab Insights */}
        <TabsContent value="insights" className="space-y-6">
          <AIAdvicePanel expenses={expenses} investments={investments} goals={goals} />
          
          {/* Motivational Card */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-green-500/20 flex-shrink-0">
                <Flame className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Motivazione Giornaliera</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {streak > 0 
                    ? `Fantastico! Sei a ${streak} giorni di streak. Continua così! 🎉`
                    : "Inizia il tuo streak oggi aggiungendo una transazione! 💪"
                  }
                </p>
                {goals.length > 0 && goals.some(g => g.currentAmount < g.targetAmount) && (
                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-green-500/20">
                    <p className="text-sm font-medium mb-1">Prossimo Traguardo:</p>
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const nextGoal = goals.find(g => g.currentAmount < g.targetAmount);
                        if (!nextGoal) return null;
                        const remaining = nextGoal.targetAmount - nextGoal.currentAmount;
                        const daysLeft = Math.ceil((new Date(nextGoal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return `Risparmia €${remaining.toFixed(2)} per "${nextGoal.name}" in ${daysLeft} giorni`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente Achievement Card riutilizzabile
function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievement.icon;
  const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
  
  return (
    <Card 
      className={`p-5 transition-all ${
        achievement.unlocked 
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30" 
          : "opacity-70 hover:opacity-100"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl flex-shrink-0 ${
          achievement.unlocked 
            ? "bg-primary/20" 
            : "bg-muted"
        }`}>
          <Icon className={`h-6 w-6 ${
            achievement.unlocked 
              ? "text-primary" 
              : "text-muted-foreground"
          }`} />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{achievement.title}</h3>
            {achievement.unlocked ? (
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
          
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-1.5" />
            <p className="text-xs text-muted-foreground text-right">
              {achievement.progress}/{achievement.maxProgress}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
