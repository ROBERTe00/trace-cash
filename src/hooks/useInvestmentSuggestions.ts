import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvestmentSuggestion {
  id: string;
  suggestion_type: string;
  amount_suggested: number;
  asset_type: string;
  reasoning: string;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
}

export const useInvestmentSuggestions = () => {
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['investment-suggestions'],
    queryFn: async (): Promise<InvestmentSuggestion[]> => {
      const { data, error } = await supabase
        .from('investment_suggestions')
        .select('*')
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as InvestmentSuggestion[];
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('investment_suggestions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['investment-suggestions'] });
      toast.success(
        variables.status === 'accepted' 
          ? 'Suggestion accepted! Consider reviewing your investments.' 
          : 'Suggestion dismissed'
      );
    },
    onError: () => {
      toast.error('Failed to update suggestion');
    },
  });

  return {
    suggestions,
    isLoading,
    acceptSuggestion: (id: string) => updateStatus.mutate({ id, status: 'accepted' }),
    rejectSuggestion: (id: string) => updateStatus.mutate({ id, status: 'rejected' }),
  };
};