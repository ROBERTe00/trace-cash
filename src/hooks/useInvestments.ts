import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stateManager } from "@/core/state-manager";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  category: string;
  symbol?: string;
  purchase_price: number;
  current_price: number;
  quantity: number;
  sector?: string;
  notes?: string;
  purchase_date?: string;
  live_tracking: boolean;
  created_at: string;
  updated_at: string;
}

export const useInvestments = () => {
  const queryClient = useQueryClient();
  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: async (): Promise<Investment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useInvestments] No authenticated user');
        return [];
      }

      console.log('[useInvestments] Fetching investments for user:', user.id);

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useInvestments] Error fetching investments:', error);
        throw error;
      }
      
      console.log(`[useInvestments] Fetched ${data?.length || 0} investments for user ${user.id}`);
      return (data || []) as Investment[];
    },
  });

  const totalValue = investments?.reduce((sum, inv) => {
    return sum + (inv.current_price * inv.quantity);
  }, 0) || 0;

  const totalCost = investments?.reduce((sum, inv) => {
    return sum + (inv.purchase_price * inv.quantity);
  }, 0) || 0;

  const totalGain = totalValue - totalCost;
  const gainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const predictGrowth = (amount: number, months: number = 12) => {
    const monthlyRate = 0.08 / 12; // 8% annual return
    return amount * Math.pow(1 + monthlyRate, months);
  };

  const createInvestment = useMutation({
    mutationFn: async (investment: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('[useInvestments] Creating investment for user:', user.id);

      const { data, error } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          ...investment,
        })
        .select()
        .single();

      if (error) {
        console.error('[useInvestments] Error creating investment:', error);
        throw error;
      }
      
      console.log('[useInvestments] Investment created successfully for user:', user.id);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('investments');
      stateManager.setState('investments', [data, ...current]);
      toast.success('Investment added successfully!');
    },
    onError: () => {
      toast.error('Failed to add investment');
    },
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Investment> & { id: string }) => {
      const { data, error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('investments');
      const updated = current.map((inv: any) => inv.id === data.id ? data : inv);
      stateManager.setState('investments', updated);
      toast.success('Investment updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update investment');
    },
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('investments');
      const filtered = current.filter((inv: any) => inv.id !== deletedId);
      stateManager.setState('investments', filtered);
      toast.success('Investment deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete investment');
    },
  });

  return {
    investments: investments || [],
    isLoading,
    totalValue,
    totalCost,
    totalGain,
    gainPercentage,
    predictGrowth,
    createInvestment: createInvestment.mutate,
    updateInvestment: updateInvestment.mutate,
    deleteInvestment: deleteInvestment.mutate,
  };
};
