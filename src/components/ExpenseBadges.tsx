import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingDown, Calendar, Award, Star } from "lucide-react";
import { Expense } from "@/lib/storage";

interface ExpenseBadgesProps {
  expenses: Expense[];
}

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  achieved: boolean;
  color: string;
}

export function ExpenseBadges({ expenses }: ExpenseBadgesProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           e.type === "Expense";
  });

  const previousMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === prevMonth && 
           date.getFullYear() === prevYear &&
           e.type === "Expense";
  });

  const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPrevious = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetLimit = 1500;

  // Calcola badge
  const badges: BadgeItem[] = [
    {
      id: "budget_keeper",
      name: "Budget Rispettato",
      description: "Rimani sotto il budget mensile",
      icon: <Trophy className="h-5 w-5" />,
      progress: Math.min((totalCurrent / budgetLimit) * 100, 100),
      achieved: totalCurrent <= budgetLimit,
      color: "bg-yellow-500"
    },
    {
      id: "consistent_tracker",
      name: "Tracciamento Costante",
      description: "Registra almeno 20 transazioni al mese",
      icon: <Calendar className="h-5 w-5" />,
      progress: Math.min((currentMonthExpenses.length / 20) * 100, 100),
      achieved: currentMonthExpenses.length >= 20,
      color: "bg-blue-500"
    },
    {
      id: "savings_hero",
      name: "Eroe del Risparmio",
      description: "Riduci le spese rispetto al mese scorso",
      icon: <TrendingDown className="h-5 w-5" />,
      progress: totalPrevious > 0 
        ? Math.max(0, Math.min(((totalPrevious - totalCurrent) / totalPrevious) * 100, 100))
        : 0,
      achieved: totalCurrent < totalPrevious && totalPrevious > 0,
      color: "bg-green-500"
    },
    {
      id: "category_master",
      name: "Maestro delle Categorie",
      description: "Bilancia le spese tra tutte le categorie",
      icon: <Target className="h-5 w-5" />,
      progress: 45, // Mock progress
      achieved: false,
      color: "bg-purple-500"
    }
  ];

  const achievedCount = badges.filter(b => b.achieved).length;
  const totalBadges = badges.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Badge e Obiettivi
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-2">
            {achievedCount} su {totalBadges} obiettivi raggiunti questo mese
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {badges.map((badge) => (
              <Card 
                key={badge.id}
                className={`transition-all ${
                  badge.achieved 
                    ? 'border-primary shadow-lg' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${badge.color} ${badge.achieved ? '' : 'opacity-50'}`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{badge.name}</h4>
                        {badge.achieved && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {badge.description}
                      </p>
                      <div className="space-y-2">
                        <Progress value={badge.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {badge.progress.toFixed(0)}% completato
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
