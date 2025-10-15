import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const { data: goals, isLoading } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async (): Promise<FinancialGoal[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('deadline', { ascending: true });

      if (error) throw error;
      return (data || []) as FinancialGoal[];
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
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