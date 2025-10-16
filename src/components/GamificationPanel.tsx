import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Flame, Target } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";

export const GamificationPanel = () => {
  const { userLevel, userAchievements, allAchievements, levelLoading } = useGamification();

  if (levelLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const currentLevel = userLevel?.level || 1;
  const currentPoints = userLevel?.total_points || 0;
  const pointsForNextLevel = currentLevel * 100;
  const pointsInCurrentLevel = currentPoints % 100;
  const progressPercent = (pointsInCurrentLevel / 100) * 100;
  
  const unlockedCount = userAchievements.length;
  const totalAchievements = allAchievements.length;

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Level {currentLevel}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentPoints.toLocaleString()} total points
            </p>
          </div>
          
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Flame className="w-4 h-4 mr-1" />
            {userLevel?.current_streak || 0} day streak
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Level {currentLevel + 1}</span>
            <span className="font-medium">{pointsInCurrentLevel}/{pointsForNextLevel}</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>
      </Card>

      {/* Achievements Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </h3>
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{totalAchievements} unlocked
          </span>
        </div>

        {/* Recent Achievements */}
        <div className="space-y-3">
          {userAchievements.slice(0, 3).map((ua) => (
            <div
              key={ua.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <div className="text-2xl">{ua.achievement.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ua.achievement.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ua.achievement.description}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                +{ua.achievement.points_reward}
              </Badge>
            </div>
          ))}
          
          {unlockedCount === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start tracking to unlock achievements!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};