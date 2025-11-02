import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stateManager } from "@/core/state-manager";
import { eventBus, Events } from "@/core/event-system";

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'Expense' | 'Income';
  recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  linked_investment_id?: string;
  created_at: string;
  updated_at: string;
}

export const useExpenses = () => {
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useExpenses] No authenticated user');
        return [];
      }

      console.log('[useExpenses] Fetching expenses for user:', user.id);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('[useExpenses] Error fetching expenses:', error);
        throw error;
      }
      
      console.log(`[useExpenses] Fetched ${data?.length || 0} expenses for user ${user.id}`);
      return (data || []) as Expense[];
    },
    staleTime: 0, // Always refetch when invalidated (0 = immediately stale)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('[useExpenses] Creating expense for user:', user.id);

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          ...expense,
        })
        .select()
        .single();

      if (error) {
        console.error('[useExpenses] Error creating expense:', error);
        throw error;
      }
      
      console.log('[useExpenses] Expense created successfully for user:', user.id);
      return data;
    },
    onSuccess: (data) => {
      console.log('[useExpenses] Expense created, invalidating queries and emitting event');
      // Invalidare e forzare refetch immediato
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'], refetchType: 'active' });
      
      // Optimistic update: aggiorna cache immediatamente
      queryClient.setQueryData(['expenses'], (old: Expense[] | undefined) => {
        if (!old) return [data];
        return [data, ...old];
      });
      
      // Sync con StateManager
      const current = stateManager.getStateKey('transactions');
      stateManager.setState('transactions', [data, ...current]);
      
      // Emit event per real-time updates
      eventBus.emit(Events.TRANSACTION_CREATED, data);
      
      toast.success('Transaction added successfully!');
    },
    onError: () => {
      toast.error('Failed to add transaction');
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidare tutte le query correlate per sincronizzazione
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('transactions');
      const updated = current.map((t: any) => t.id === data.id ? data : t);
      stateManager.setState('transactions', updated);
      toast.success('Transaction updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update transaction');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      // Invalidare tutte le query correlate per sincronizzazione
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('transactions');
      const filtered = current.filter((t: any) => t.id !== deletedId);
      stateManager.setState('transactions', filtered);
      toast.success('Transaction deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete transaction');
    },
  });

  return {
    expenses: expenses || [],
    isLoading,
    createExpense: createExpense.mutate,
    updateExpense: updateExpense.mutate,
    deleteExpense: deleteExpense.mutate,
  };
};