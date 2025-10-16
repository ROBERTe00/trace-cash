import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGamification } from "@/hooks/useGamification";
import { Trophy, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const AchievementsList = () => {
  const { allAchievements, userAchievements, levelLoading } = useGamification();

  if (levelLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement.id));

  // Group achievements by category
  const groupedAchievements = allAchievements.reduce((acc, achievement) => {
    const category = achievement.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof allAchievements>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          All Achievements
        </CardTitle>
        <CardDescription>
          {userAchievements.length} of {allAchievements.length} unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedAchievements).map(([category, achievements]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-primary">{category}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  return (
                    <Card
                      key={achievement.id}
                      className={`relative overflow-hidden transition-all ${
                        isUnlocked
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-muted opacity-60'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="text-3xl">{achievement.icon}</div>
                          {isUnlocked ? (
                            <Badge variant="default" className="bg-primary">
                              Unlocked
                            </Badge>
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <CardTitle className="text-base">{achievement.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-muted-foreground">Reward</span>
                          <Badge variant="secondary">
                            +{achievement.points_reward} pts
                          </Badge>
                        </div>
                        {isUnlocked && (
                          <Progress value={100} className="h-1" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
