import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stateManager } from "@/core/state-manager";
import { useEffect } from "react";

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  goal_type: 'savings' | 'investment' | 'debt_payoff' | 'purchase' | 'emergency_fund' | 'retirement';
  linked_asset_type?: string;
  investment_link?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const useFinancialGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading, error } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async (): Promise<FinancialGoal[]> => {
      console.log('[useFinancialGoals] Query started');
      try {
        // Timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
        );

        const dataPromise = (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('[useFinancialGoals] No user, returning empty array');
            return [];
          }

          console.log(`[useFinancialGoals] Fetching goals for user: ${user.id}`);
          const { data, error } = await supabase
            .from('financial_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('priority', { ascending: false })
            .order('deadline', { ascending: true });

          if (error) {
            console.error('[useFinancialGoals] Error fetching goals:', error);
            return [];
          }
          
          console.log(`[useFinancialGoals] Fetched ${data?.length || 0} goals`);
          return (data || []) as FinancialGoal[];
        })();

        return await Promise.race([dataPromise, timeoutPromise]);
      } catch (error) {
        console.error('[useFinancialGoals] Exception in queryFn:', error);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (error) {
      console.error('[useFinancialGoals] Query error:', error);
    }
  }, [error]);

  const createGoal = useMutation({
    mutationFn: async (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          ...goal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('goals');
      stateManager.setState('goals', [data, ...current]);
      toast.success('Goal created successfully!');
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('goals');
      const updated = current.map((goal: any) => goal.id === data.id ? data : goal);
      stateManager.setState('goals', updated);
      toast.success('Goal updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update goal');
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('goals');
      const filtered = current.filter((goal: any) => goal.id !== deletedId);
      stateManager.setState('goals', filtered);
      toast.success('Goal deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete goal');
    },
  });

  return {
    goals: goals || [],
    isLoading,
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
  };
};