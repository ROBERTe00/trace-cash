// User Data Service - Fetches user transaction/expense data
import type { Timeframe, HistoricalDataPoint } from '@/lib/ai-chart-generator';
import { supabase } from '@/integrations/supabase/client';

export class UserDataService {
  /**
   * Get historical transaction data for a user
   */
  async getHistoricalData(userId: string, timeframe: Timeframe): Promise<HistoricalDataPoint[]> {
    try {
      const days = this.timeframeToDays(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Aggregate by day
      const dailyTotals = new Map<string, number>();
      data?.forEach((expense: any) => {
        const date = expense.date;
        const amount = expense.type === 'Income' ? expense.amount : -expense.amount;
        dailyTotals.set(date, (dailyTotals.get(date) || 0) + amount);
      });

      return Array.from(dailyTotals.entries()).map(([date, value]) => ({
        timestamp: new Date(date).toISOString(),
        value,
        label: 'Transazioni'
      }));
    } catch (error) {
      console.error('[UserDataService] Error fetching user transaction data:', error);
      return [];
    }
  }

  private timeframeToDays(timeframe: Timeframe): number {
    const mapping: Record<Timeframe, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': 730
    };
    return mapping[timeframe] || 30;
  }
}

