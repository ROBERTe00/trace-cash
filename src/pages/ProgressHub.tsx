import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star, Target, TrendingUp, Award } from "lucide-react";
import { getExpenses, getInvestments } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";
import confetti from "canvas-confetti";

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
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    calculateProgress();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Progress Hub</h1>
          <p className="text-muted-foreground">Track your financial journey</p>
        </div>
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

      {/* Achievements */}
      <Card className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="h-6 w-6" />
          Achievements
        </h2>
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
      </Card>

      {/* Daily Tips */}
      <Card className="glass-card p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Daily Motivation
        </h3>
        <p className="text-muted-foreground">
          {streak > 0 
            ? `Amazing! You're on a ${streak}-day streak. Keep tracking your finances daily! 🎉`
            : "Start your streak today by adding a transaction! 💪"
          }
        </p>
      </Card>
    </div>
  );
}
