import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CorrelationData {
  correlation_score: number;
  impact_analysis: Array<{
    category: string;
    monthly_average: number;
    potential_reduction: number;
    impact_on_portfolio: string;
    suggestion: string;
  }>;
  projected_growth: {
    current_trajectory: number;
    optimized_trajectory: number;
    additional_gain: number;
  };
}

export const useExpenseCorrelation = () => {
  return useQuery({
    queryKey: ['expense-correlation'],
    queryFn: async (): Promise<CorrelationData> => {
      const { data, error } = await supabase.functions.invoke('analyze-expense-investment-correlation');

      if (error) throw error;

      return data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 1,
  });
};