import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_reward: number;
  category: string | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  achievement: Achievement;
}

export const useGamification = () => {
  const queryClient = useQueryClient();

  // Fetch user level
  const { data: userLevel, isLoading: levelLoading } = useQuery({
    queryKey: ['user-level'],
    queryFn: async (): Promise<UserLevel | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Create if doesn't exist
      if (!data) {
        const { data: newLevel, error: insertError } = await supabase
          .from('user_levels')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newLevel;
      }

      return data;
    },
  });

  // Fetch all achievements
  const { data: allAchievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch user achievements
  const { data: userAchievements } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: async (): Promise<UserAchievement[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as any || [];
    },
  });

  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: async ({ points, reason }: { points: number; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const currentLevel = userLevel || { total_points: 0, level: 1 };
      const newTotalPoints = currentLevel.total_points + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1; // Level up every 100 points

      const { error } = await supabase
        .from('user_levels')
        .upsert({
          user_id: user.id,
          total_points: newTotalPoints,
          level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      return { points, newLevel: newLevel > (currentLevel.level || 1) };
    },
    onSuccess: ({ points, newLevel }) => {
      queryClient.invalidateQueries({ queryKey: ['user-level'] });
      
      if (newLevel) {
        toast.success(`🎉 Level Up!`, {
          description: `You've reached level ${(userLevel?.level || 1) + 1}!`
        });
      } else {
        toast.success(`+${points} points`, {
          description: 'Keep up the great work!'
        });
      }
    },
  });

  // Unlock achievement
  const unlockAchievement = useMutation({
    mutationFn: async (achievementCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const achievement = allAchievements?.find(a => a.code === achievementCode);
      if (!achievement) throw new Error('Achievement not found');

      // Check if already unlocked
      const exists = userAchievements?.some(ua => ua.achievement.code === achievementCode);
      if (exists) return null;

      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

      if (error) throw error;

      // Add points
      if (achievement.points_reward > 0) {
        await addPointsMutation.mutateAsync({
          points: achievement.points_reward,
          reason: `Achievement: ${achievement.name}`
        });
      }

      return achievement;
    },
    onSuccess: (achievement) => {
      if (achievement) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        toast.success(`🏆 ${achievement.icon} Achievement Unlocked!`, {
          description: achievement.name
        });
      }
    },
  });

  return {
    userLevel,
    allAchievements: allAchievements || [],
    userAchievements: userAchievements || [],
    levelLoading,
    addPoints: addPointsMutation.mutate,
    unlockAchievement: unlockAchievement.mutate,
  };
};