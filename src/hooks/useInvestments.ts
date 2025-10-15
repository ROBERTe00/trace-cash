import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: async (): Promise<Investment[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  return {
    investments: investments || [],
    isLoading,
    totalValue,
    totalCost,
    totalGain,
    gainPercentage,
    predictGrowth,
  };
};
