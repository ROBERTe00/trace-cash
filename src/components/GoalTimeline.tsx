import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FinancialGoal } from "@/lib/storage";
import { Target, Calendar, TrendingUp, Trophy, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface GoalTimelineProps {
  goals: FinancialGoal[];
}

export function GoalTimeline({ goals }: GoalTimelineProps) {
  const sortedGoals = [...goals].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  const celebrateMilestone = (goalName: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const getStatusInfo = (goal: FinancialGoal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((deadline.getTime() - new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = daysLeft > 0 ? ((totalDays - daysLeft) / totalDays) * 100 : 100;
    
    const isOnTrack = progress >= expectedProgress - 5;
    const isCompleted = progress >= 100;
    const isBehind = !isOnTrack && !isCompleted;

    return { progress, daysLeft, isOnTrack, isCompleted, isBehind };
  };

  if (goals.length === 0) {
    return (
      <Card className="glass-card p-12 text-center">
        <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Nessun Obiettivo Attivo</h3>
        <p className="text-muted-foreground">
          Crea il tuo primo obiettivo finanziario per iniziare a tracciare i progressi
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedGoals.map((goal, index) => {
        const { progress, daysLeft, isOnTrack, isCompleted, isBehind } = getStatusInfo(goal);
        const remaining = goal.targetAmount - goal.currentAmount;

        return (
          <Card 
            key={goal.id} 
            className={`glass-card p-6 relative overflow-hidden transition-all hover-lift ${
              isCompleted ? "border-green-500/50 bg-gradient-to-br from-green-500/10 to-green-600/5" :
              isBehind ? "border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-orange-600/5" :
              "border-primary/50"
            }`}
          >
            {/* Timeline Connector */}
            {index < sortedGoals.length - 1 && (
              <div className="absolute left-8 bottom-0 w-0.5 h-6 bg-gradient-to-b from-primary to-transparent transform translate-y-full" />
            )}

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`p-3 rounded-2xl shrink-0 ${
                isCompleted ? "bg-green-500/20" :
                isBehind ? "bg-orange-500/20" :
                "bg-primary/20"
              }`}>
                {isCompleted ? (
                  <Trophy className="h-6 w-6 text-green-500" />
                ) : isBehind ? (
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                ) : (
                  <Target className="h-6 w-6 text-primary" />
                )}
              </div>

              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{goal.name}</h3>
                      {goal.priority && (
                        <Badge 
                          variant={
                            goal.priority === "High" ? "destructive" :
                            goal.priority === "Medium" ? "default" :
                            "secondary"
                          }
                          className="text-xs"
                        >
                          {goal.priority}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {goal.category}
                      </Badge>
                      {isCompleted && (
                        <Badge className="text-xs bg-green-500">
                          ✓ Completato
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {daysLeft > 0 ? `${daysLeft} giorni rimanenti` : "Scadenza passata"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          {isOnTrack ? "In linea" : isBehind ? "In ritardo" : "Eccellente"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => celebrateMilestone(goal.name)}
                      className="gap-2"
                    >
                      <Trophy className="h-4 w-4" />
                      Celebra
                    </Button>
                  )}
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Sei al {progress.toFixed(1)}% per €{goal.targetAmount.toLocaleString()}
                    </span>
                    <span className="font-bold">
                      €{goal.currentAmount.toLocaleString()} / €{goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className="h-4" 
                    indicatorClassName={`transition-all duration-500 ${
                      isCompleted ? "bg-gradient-to-r from-green-500 to-green-600" :
                      isBehind ? "bg-gradient-to-r from-orange-500 to-orange-600" :
                      "bg-gradient-to-r from-primary to-primary/80"
                    }`}
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Inizio: {new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT')}</span>
                    <span>Target: {new Date(goal.deadline).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>

                {/* Insights */}
                {!isCompleted && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Rimanente</div>
                      <div className="text-lg font-bold">€{remaining.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Mensile Suggerito</div>
                      <div className="text-lg font-bold">
                        €{daysLeft > 0 ? Math.ceil(remaining / (daysLeft / 30)).toLocaleString() : "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Message */}
                <div className={`p-3 rounded-lg ${
                  isCompleted ? "bg-green-500/10 border border-green-500/20" :
                  isBehind ? "bg-orange-500/10 border border-orange-500/20" :
                  "bg-blue-500/10 border border-blue-500/20"
                }`}>
                  <p className="text-sm">
                    {isCompleted ? (
                      <span className="font-medium text-green-600 dark:text-green-400">
                        🎉 Obiettivo raggiunto! Hai completato il tuo traguardo finanziario.
                      </span>
                    ) : isBehind ? (
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        ⚠️ Sei leggermente indietro. Considera di aumentare il contributo mensile di €
                        {Math.ceil(remaining / Math.max(daysLeft / 30, 1) * 0.2).toLocaleString()}.
                      </span>
                    ) : (
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        👍 Ottimo lavoro! Sei in linea con il tuo piano. Continua così!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
