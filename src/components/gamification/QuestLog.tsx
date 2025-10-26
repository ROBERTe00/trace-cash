import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Zap, Target, TrendingUp, PiggyBank } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  xp: number;
  completed: boolean;
  category: 'daily' | 'weekly' | 'monthly';
}

const QUESTS: Quest[] = [
  {
    id: 'log-transaction',
    title: 'Log a transaction',
    description: 'Track your spending or income',
    icon: TrendingUp,
    xp: 50,
    completed: false,
    category: 'daily',
  },
  {
    id: 'save-goal',
    title: 'Achieve savings goal',
    description: 'Set and reach your savings target',
    icon: PiggyBank,
    xp: 100,
    completed: false,
    category: 'daily',
  },
  {
    id: 'review-spending',
    title: 'Review weekly spending',
    description: 'Analyze your weekly expenses',
    icon: Target,
    xp: 75,
    completed: false,
    category: 'weekly',
  },
  {
    id: 'add-investment',
    title: 'Add an investment',
    description: 'Track your portfolio growth',
    icon: Zap,
    xp: 150,
    completed: false,
    category: 'weekly',
  },
];

export function QuestLog() {
  const { addPoints } = useGamification();
  const [quests, setQuests] = React.useState<Quest[]>(QUESTS);

  const handleQuestClick = async (quest: Quest) => {
    if (quest.completed) return;

    // Simulate quest completion
    const updatedQuests = quests.map((q) =>
      q.id === quest.id ? { ...q, completed: true } : q
    );
    setQuests(updatedQuests);

    // Award points
    await addPoints({ points: quest.xp, reason: `Completed: ${quest.title}` });
  };

  const dailyQuests = quests.filter((q) => q.category === 'daily');
  const weeklyQuests = quests.filter((q) => q.category === 'weekly');
  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Daily Quests
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Complete tasks to earn XP
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {completedCount}/{quests.length}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Daily Quests */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Today
          </h4>
          <div className="space-y-2">
            {dailyQuests.map((quest) => {
              const Icon = quest.icon;
              return (
                <motion.div
                  key={quest.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuestClick(quest)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    quest.completed
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        quest.completed
                          ? 'bg-primary/10'
                          : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          quest.completed ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium text-sm ${
                          quest.completed ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {quest.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {quest.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 gap-2">
                    <Badge
                      variant={quest.completed ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {quest.completed ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : null}
                      +{quest.xp} XP
                    </Badge>
                    {quest.completed && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weekly Quests */}
        {weeklyQuests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              This Week
            </h4>
            <div className="space-y-2">
              {weeklyQuests.map((quest) => {
                const Icon = quest.icon;
                return (
                  <motion.div
                    key={quest.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuestClick(quest)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      quest.completed
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30 border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          quest.completed ? 'bg-primary/10' : 'bg-muted'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            quest.completed ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium text-sm ${
                            quest.completed ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {quest.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quest.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={quest.completed ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {quest.completed ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : null}
                        +{quest.xp} XP
                      </Badge>
                      {quest.completed && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

