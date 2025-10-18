/**
 * Gamification System Component
 * Achievements, progress tracking, and micro-animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Shield, 
  Crown,
  Sparkles,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Calendar,
  Award,
  CheckCircle,
  Lock,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'spending' | 'saving' | 'tracking' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  reward?: {
    type: 'points' | 'badge' | 'title';
    value: number;
  };
}

interface GamificationProps {
  userStats: {
    totalTransactions: number;
    totalSavings: number;
    streakDays: number;
    categoriesTracked: number;
    monthlyGoal: number;
    monthlyProgress: number;
  };
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

const achievementIcons = {
  Trophy,
  Star,
  Target,
  Zap,
  Shield,
  Crown,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Calendar,
  Award,
  CheckCircle,
  Gift
};

const rarityColors = {
  common: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20'
  },
  rare: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  epic: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
  legendary: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20'
  }
};

export const GamificationSystem: React.FC<GamificationProps> = ({
  userStats,
  onAchievementUnlocked
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);

  // Initialize achievements based on user stats
  useEffect(() => {
    const initialAchievements: Achievement[] = [
      {
        id: 'first-transaction',
        title: 'First Steps',
        description: 'Add your first transaction',
        icon: CheckCircle,
        category: 'tracking',
        rarity: 'common',
        progress: Math.min(userStats.totalTransactions, 1),
        maxProgress: 1,
        unlocked: userStats.totalTransactions >= 1,
        reward: { type: 'points', value: 10 }
      },
      {
        id: 'transaction-master',
        title: 'Transaction Master',
        description: 'Track 50 transactions',
        icon: CreditCard,
        category: 'tracking',
        rarity: 'rare',
        progress: Math.min(userStats.totalTransactions, 50),
        maxProgress: 50,
        unlocked: userStats.totalTransactions >= 50,
        reward: { type: 'points', value: 100 }
      },
      {
        id: 'saver',
        title: 'Smart Saver',
        description: 'Save €1000',
        icon: PiggyBank,
        category: 'saving',
        rarity: 'epic',
        progress: Math.min(userStats.totalSavings, 1000),
        maxProgress: 1000,
        unlocked: userStats.totalSavings >= 1000,
        reward: { type: 'points', value: 250 }
      },
      {
        id: 'streak-keeper',
        title: 'Streak Keeper',
        description: 'Maintain a 7-day tracking streak',
        icon: Calendar,
        category: 'tracking',
        rarity: 'rare',
        progress: Math.min(userStats.streakDays, 7),
        maxProgress: 7,
        unlocked: userStats.streakDays >= 7,
        reward: { type: 'points', value: 150 }
      },
      {
        id: 'category-expert',
        title: 'Category Expert',
        description: 'Track expenses in 5 different categories',
        icon: Target,
        category: 'tracking',
        rarity: 'epic',
        progress: Math.min(userStats.categoriesTracked, 5),
        maxProgress: 5,
        unlocked: userStats.categoriesTracked >= 5,
        reward: { type: 'points', value: 200 }
      },
      {
        id: 'goal-crusher',
        title: 'Goal Crusher',
        description: 'Achieve your monthly savings goal',
        icon: Trophy,
        category: 'milestone',
        rarity: 'legendary',
        progress: Math.min(userStats.monthlyProgress, userStats.monthlyGoal),
        maxProgress: userStats.monthlyGoal,
        unlocked: userStats.monthlyProgress >= userStats.monthlyGoal,
        reward: { type: 'points', value: 500 }
      }
    ];

    setAchievements(initialAchievements);

    // Check for newly unlocked achievements
    const newlyUnlocked = initialAchievements.filter(
      achievement => achievement.unlocked && !achievement.unlockedAt
    );

    if (newlyUnlocked.length > 0) {
      setShowUnlocked(true);
      newlyUnlocked.forEach(achievement => {
        onAchievementUnlocked?.(achievement);
        toast.success(`Achievement Unlocked!`, {
          description: achievement.title,
          duration: 5000
        });
      });
    }

    // Calculate user level and points
    const totalPoints = initialAchievements
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + (a.reward?.value || 0), 0);
    
    setUserPoints(totalPoints);
    setUserLevel(Math.floor(totalPoints / 100) + 1);
  }, [userStats, onAchievementUnlocked]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spending': return CreditCard;
      case 'saving': return PiggyBank;
      case 'tracking': return Target;
      case 'milestone': return Trophy;
      default: return Star;
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return Star;
      case 'rare': return Zap;
      case 'epic': return Shield;
      case 'legendary': return Crown;
      default: return Star;
    }
  };

  const AchievementCard: React.FC<{ achievement: Achievement; index: number }> = ({ 
    achievement, 
    index 
  }) => {
    const Icon = achievement.icon;
    const RarityIcon = getRarityIcon(achievement.rarity);
    const colors = rarityColors[achievement.rarity];
    const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative"
      >
        <Card className={`
          futuristic-card
          ${achievement.unlocked ? 'border-green-500/30' : 'border-gray-500/20'}
          ${achievement.unlocked ? 'neon-glow-green' : ''}
          transition-all duration-300
          group
          ${achievement.unlocked ? 'hover-lift' : 'opacity-60'}
        `}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`
                p-3 rounded-xl border-2
                ${achievement.unlocked ? colors.bg : 'bg-gray-500/10'}
                ${achievement.unlocked ? colors.border : 'border-gray-500/20'}
                relative
              `}>
                <Icon className={`
                  w-6 h-6
                  ${achievement.unlocked ? colors.text : 'text-gray-500'}
                `} />
                
                {/* Rarity indicator */}
                <div className="absolute -top-1 -right-1">
                  <RarityIcon className={`
                    w-3 h-3
                    ${achievement.unlocked ? colors.text : 'text-gray-500'}
                  `} />
                </div>

                {/* Unlock animation */}
                {achievement.unlocked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`
                    font-semibold
                    ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {achievement.title}
                  </h3>
                  
                  <Badge 
                    variant="secondary" 
                    className={`
                      text-xs
                      ${achievement.unlocked ? colors.bg : 'bg-gray-500/20'}
                      ${achievement.unlocked ? colors.text : 'text-gray-500'}
                    `}
                  >
                    {achievement.rarity}
                  </Badge>
                </div>

                <p className={`
                  text-sm
                  ${achievement.unlocked ? 'text-muted-foreground' : 'text-gray-500'}
                `}>
                  {achievement.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={achievement.unlocked ? 'text-muted-foreground' : 'text-gray-500'}>
                      Progress
                    </span>
                    <span className={achievement.unlocked ? 'text-muted-foreground' : 'text-gray-500'}>
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  
                  <Progress 
                    value={progressPercentage} 
                    className="h-2"
                  />
                </div>

                {/* Reward */}
                {achievement.reward && achievement.unlocked && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <Gift className="w-3 h-3" />
                    <span>+{achievement.reward.value} points</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* User Level & Points */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Card className="futuristic-card border-primary/30 neon-glow-primary">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
                <div>
                  <div className="text-2xl font-bold gradient-text-neon">
                    Level {userLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {userPoints} points
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress to Level {userLevel + 1}</span>
                  <span>{userPoints % 100}/100</span>
                </div>
                <Progress value={(userPoints % 100)} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold gradient-text-neon">Achievements</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <AchievementCard 
              key={achievement.id} 
              achievement={achievement} 
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Unlocked Achievements Modal */}
      <AnimatePresence>
        {showUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUnlocked(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="futuristic-card border-yellow-500/30 neon-glow-purple max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="p-8 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce-gentle" />
                </motion.div>
                
                <div>
                  <h3 className="text-2xl font-bold gradient-text-neon mb-2">
                    Achievement Unlocked!
                  </h3>
                  <p className="text-muted-foreground">
                    You've unlocked a new achievement. Keep up the great work!
                  </p>
                </div>

                <Button
                  onClick={() => setShowUnlocked(false)}
                  className="futuristic-button"
                >
                  Awesome!
                </Button>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamificationSystem;
