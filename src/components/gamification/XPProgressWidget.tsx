import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Star, Flame, Sparkles } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { motion } from 'framer-motion';

export function XPProgressWidget() {
  const { userLevel, levelLoading } = useGamification();

  if (levelLoading || !userLevel) {
    return null;
  }

  const currentLevel = userLevel.level || 1;
  const currentPoints = userLevel.total_points || 0;
  const pointsForNextLevel = 100;
  const pointsInCurrentLevel = currentPoints % 100;
  const progressPercent = (pointsInCurrentLevel / pointsForNextLevel) * 100;
  const streak = userLevel.current_streak || 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-0 p-4 hover:from-primary/15 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Star className="w-5 h-5 text-primary" />
            <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Level {currentLevel}</h3>
            <p className="text-xs text-muted-foreground">{currentPoints} XP</p>
          </div>
        </div>
        
        {streak > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Flame className="w-3 h-3 mr-1 text-orange-500" />
            {streak} day streak
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress to Level {currentLevel + 1}</span>
          <span className="font-medium">{pointsInCurrentLevel}/100</span>
        </div>
        <Progress 
          value={progressPercent} 
          className="h-2"
        />
      </div>
    </Card>
  );
}

