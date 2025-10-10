import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, Star, Target, TrendingUp, Award, Download, Eye, EyeOff } from "lucide-react";
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
}

export default function ProgressHub() {
  const { formatCurrency } = useApp();
  const { toast } = useToast();
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showAchievements, setShowAchievements] = useState(true);

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
    
    // Stats
    doc.text(`Current Streak: ${streak} days`, 20, 45);
    doc.text(`Level: ${level} - ${getLevelTitle(level)}`, 20, 55);
    doc.text(`XP Progress: ${xp}/100`, 20, 65);
    
    // Achievements
    doc.text("Achievements:", 20, 80);
    let yPos = 90;
    achievements.forEach((ach, idx) => {
      const status = ach.unlocked ? "✓" : "○";
      doc.text(`${status} ${ach.title} (${ach.progress}/${ach.maxProgress})`, 25, yPos);
      yPos += 10;
    });
    
    // Goals
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
    
    // Calculate streak (days with transactions)
    const today = new Date().toISOString().split('T')[0];
    const recentDays = expenses
      .map(e => e.date)
      .filter(date => {
        const daysDiff = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7;
      });
    setStreak(new Set(recentDays).size);

    // Calculate level and XP
    const totalTransactions = expenses.length + investments.length;
    const calculatedLevel = Math.floor(totalTransactions / 10) + 1;
    const calculatedXp = (totalTransactions % 10) * 10;
    setLevel(calculatedLevel);
    setXp(calculatedXp);

    // Define achievements
    const newAchievements: Achievement[] = [
      {
        id: "first_investment",
        title: "First Investment",
        description: "Add your first investment",
        icon: TrendingUp,
        unlocked: investments.length > 0,
        progress: Math.min(investments.length, 1),
        maxProgress: 1,
      },
      {
        id: "streak_7",
        title: "Week Warrior",
        description: "Track expenses for 7 days straight",
        icon: Flame,
        unlocked: streak >= 7,
        progress: streak,
        maxProgress: 7,
      },
      {
        id: "transactions_50",
        title: "Active Tracker",
        description: "Record 50 transactions",
        icon: Star,
        unlocked: totalTransactions >= 50,
        progress: Math.min(totalTransactions, 50),
        maxProgress: 50,
      },
      {
        id: "portfolio_1k",
        title: "First Milestone",
        description: "Reach 1,000€ portfolio value",
        icon: Target,
        unlocked: investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) >= 1000,
        progress: Math.min(investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0), 1000),
        maxProgress: 1000,
      },
      {
        id: "diversified",
        title: "Diversification Master",
        description: "Own 5 different investments",
        icon: Trophy,
        unlocked: investments.length >= 5,
        progress: Math.min(investments.length, 5),
        maxProgress: 5,
      },
      {
        id: "level_10",
        title: "Finance Pro",
        description: "Reach level 10",
        icon: Award,
        unlocked: calculatedLevel >= 10,
        progress: Math.min(calculatedLevel, 10),
        maxProgress: 10,
      },
    ];

    setAchievements(newAchievements);

    // Celebrate newly unlocked achievements
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
    if (level < 5) return "Beginner Saver";
    if (level < 10) return "Smart Spender";
    if (level < 20) return "Investment Explorer";
    if (level < 30) return "Finance Guru";
    return "Wealth Master";
  };

  const expenses = getExpenses();
  const investments = getInvestments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Progress Hub</h1>
          <p className="text-muted-foreground">Track your financial journey and achieve your goals</p>
        </div>
        <Button onClick={exportProgressToPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 hover-lift">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-3xl font-bold">{streak} days</p>
              <p className="text-xs text-muted-foreground mt-1">Keep going! 🔥</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 hover-lift">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5">
              <Trophy className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Level</p>
              <p className="text-3xl font-bold">{level}</p>
              <p className="text-xs text-muted-foreground mt-1">{getLevelTitle(level)}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-6 hover-lift">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5">
              <Star className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">XP Progress</p>
              <Progress value={xp} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{xp}/100 XP to next level</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Goals */}
      <FinancialGoals
        goals={goals}
        onAdd={handleAddGoal}
        onDelete={handleDeleteGoal}
        onUpdate={handleUpdateGoal}
      />

      {/* Trend Chart */}
      <TrendChart expenses={expenses} />

      {/* AI Insights */}
      <AIAdvicePanel expenses={expenses} investments={investments} goals={goals} />

      {/* Achievements */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Achievements
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAchievements(!showAchievements)}
            className="gap-2"
          >
            {showAchievements ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show
              </>
            )}
          </Button>
        </div>
        {showAchievements && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
            
            return (
              <Card 
                key={achievement.id}
                className={`p-4 transition-all ${
                  achievement.unlocked 
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 hover-lift" 
                    : "opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.unlocked 
                      ? "bg-primary/20" 
                      : "bg-muted"
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      achievement.unlocked 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <Badge variant="default" className="text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    <div className="space-y-1">
                      <Progress value={progressPercent} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )}
      </Card>

      {/* Motivational Card */}
      <Card className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-green-500/20">
            <Flame className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Daily Motivation</h3>
            <p className="text-muted-foreground mb-3">
              {streak > 0 
                ? `Amazing! You're on a ${streak}-day streak. Keep tracking your finances daily! 🎉`
                : "Start your streak today by adding a transaction! 💪"
              }
            </p>
            {goals.length > 0 && goals.some(g => g.currentAmount < g.targetAmount) && (
              <div className="mt-3 p-3 rounded-lg bg-background/50">
                <p className="text-sm font-medium mb-1">Next Milestone:</p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const nextGoal = goals.find(g => g.currentAmount < g.targetAmount);
                    if (!nextGoal) return null;
                    const remaining = nextGoal.targetAmount - nextGoal.currentAmount;
                    const daysLeft = Math.ceil((new Date(nextGoal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return `Save €${remaining.toFixed(2)} more for "${nextGoal.name}" in ${daysLeft} days`;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
