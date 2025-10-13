import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SavingsPotential {
  available_savings: number;
  monthly_income: number;
  monthly_expenses: number;
  savings_rate: number;
  suggestion: string;
}

export const useSavingsPotential = (threshold: number = 200) => {
  return useQuery({
    queryKey: ['savings-potential', threshold],
    queryFn: async (): Promise<SavingsPotential> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_savings_potential', {
        p_user_id: user.id,
        p_threshold: threshold
      });

      if (error) throw error;

      return data[0] || {
        available_savings: 0,
        monthly_income: 0,
        monthly_expenses: 0,
        savings_rate: 0,
        suggestion: 'Start tracking expenses to calculate savings potential'
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};