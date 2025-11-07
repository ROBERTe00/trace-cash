// Report Data Processor - Elabora e aggrega dati per i report
import { supabase } from '@/integrations/supabase/client';

export interface ReportData {
  expenses: any[];
  investments: any[];
  goals: any[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    portfolioValue: number;
  };
  timeframe: {
    start: string;
    end: string;
    period: string;
  };
}

export interface ProcessedReportData extends ReportData {
  spendingByCategory: Record<string, number>;
  spendingTrends: Array<{
    month: string;
    total: number;
    categories: Record<string, number>;
  }>;
  savingsRate: number;
  portfolioMetrics: any;
  goalProgress: Array<{
    id: string;
    name: string;
    progress: number;
    target: number;
    current: number;
  }>;
}

export class ReportDataProcessor {
  /**
   * Raccoglie dati completi per il report
   */
  async collectReportData(userId: string, timeframe: string): Promise<ReportData> {
    const { startDate, endDate } = this.parseTimeframe(timeframe);
    
    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (expensesError) {
      console.error('[ReportDataProcessor] Error fetching expenses:', expensesError);
    }

    // Fetch investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (investmentsError) {
      console.error('[ReportDataProcessor] Error fetching investments:', investmentsError);
    }

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('[ReportDataProcessor] Error fetching goals:', goalsError);
    }

    // Calculate summary
    const totalIncome = (expenses || [])
      .filter(e => e.type === 'Income')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = (expenses || [])
      .filter(e => e.type === 'Expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const portfolioValue = (investments || [])
      .reduce((sum, inv) => sum + (inv.current_price * inv.quantity), 0);

    return {
      expenses: expenses || [],
      investments: investments || [],
      goals: goals || [],
      summary: {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        portfolioValue
      },
      timeframe: {
        start: startDate,
        end: endDate,
        period: timeframe
      }
    };
  }

  /**
   * Elabora i dati grezzi per il report
   */
  processData(rawData: ReportData): ProcessedReportData {
    // Spending by category
    const spendingByCategory: Record<string, number> = {};
    rawData.expenses
      .filter(e => e.type === 'Expense')
      .forEach(expense => {
        const category = expense.category || 'Other';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + expense.amount;
      });

    // Spending trends (monthly)
    const spendingTrends = this.calculateMonthlyTrends(rawData.expenses);

    // Savings rate
    const savingsRate = rawData.summary.totalIncome > 0
      ? ((rawData.summary.totalIncome - rawData.summary.totalExpenses) / rawData.summary.totalIncome) * 100
      : 0;

    // Portfolio metrics (simplified)
    const portfolioMetrics = this.calculatePortfolioMetrics(rawData.investments);

    // Goal progress
    const goalProgress = (rawData.goals || []).map(goal => ({
      id: goal.id,
      name: goal.name || goal.title || 'Obiettivo',
      progress: goal.target_amount > 0
        ? ((goal.current_amount || 0) / goal.target_amount) * 100
        : 0,
      target: goal.target_amount || 0,
      current: goal.current_amount || 0
    }));

    return {
      ...rawData,
      spendingByCategory,
      spendingTrends,
      savingsRate,
      portfolioMetrics,
      goalProgress
    };
  }

  /**
   * Calcola trend mensili di spesa
   */
  private calculateMonthlyTrends(expenses: any[]): Array<{
    month: string;
    total: number;
    categories: Record<string, number>;
  }> {
    const monthly = new Map<string, { total: number; categories: Record<string, number> }>();

    expenses
      .filter(e => e.type === 'Expense')
      .forEach(expense => {
        const month = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
        const category = expense.category || 'Other';

        if (!monthly.has(month)) {
          monthly.set(month, { total: 0, categories: {} });
        }

        const monthData = monthly.get(month)!;
        monthData.total += expense.amount;
        monthData.categories[category] = (monthData.categories[category] || 0) + expense.amount;
      });

    return Array.from(monthly.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calcola metriche portafoglio semplificate
   */
  private calculatePortfolioMetrics(investments: any[]): any {
    if (investments.length === 0) {
      return {
        totalValue: 0,
        totalGain: 0,
        totalGainPercent: 0,
        assetCount: 0
      };
    }

    const totalValue = investments.reduce(
      (sum, inv) => sum + (inv.current_price * inv.quantity),
      0
    );
    
    const totalCost = investments.reduce(
      (sum, inv) => sum + (inv.purchase_price * inv.quantity),
      0
    );

    return {
      totalValue,
      totalGain: totalValue - totalCost,
      totalGainPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      assetCount: investments.length
    };
  }

  /**
   * Converte timeframe string in date
   */
  private parseTimeframe(timeframe: string): { startDate: string; endDate: string } {
    const endDate = new Date();
    let startDate = new Date();

    if (timeframe === 'monthly' || timeframe === '1M') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (timeframe === 'quarterly' || timeframe === '3M') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (timeframe === 'annual' || timeframe === '1Y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (timeframe.startsWith('custom-')) {
      // Custom timeframe format: "custom-YYYY-MM-DD:YYYY-MM-DD"
      const dates = timeframe.replace('custom-', '').split(':');
      if (dates.length === 2) {
        startDate = new Date(dates[0]);
        endDate = new Date(dates[1]);
      }
    } else {
      // Default: last month
      startDate.setMonth(startDate.getMonth() - 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
}



