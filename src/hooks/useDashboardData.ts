import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export function useDashboardData() {
  // Fetch all expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['dashboard-expenses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    if (!expensesData) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Current month data
    const currentMonthData = expensesData.filter((expense: any) => {
      const date = new Date(expense.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Previous month data
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthData = expensesData.filter((expense: any) => {
      const date = new Date(expense.date);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });

    // Calculate totals
    const totalIncome = currentMonthData
      .filter((e: any) => e.type === 'Income')
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const totalExpenses = currentMonthData
      .filter((e: any) => e.type === 'Expense')
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const previousIncome = previousMonthData
      .filter((e: any) => e.type === 'Income')
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const previousExpenses = previousMonthData
      .filter((e: any) => e.type === 'Expense')
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // Calculate changes
    const incomeChange = previousIncome > 0 
      ? ((totalIncome - previousIncome) / previousIncome) * 100 
      : 0;

    const expensesChange = previousExpenses > 0 
      ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 
      : 0;

    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryBreakdown = currentMonthData
      .filter((e: any) => e.type === 'Expense')
      .reduce((acc: Record<string, number>, e: any) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {});

    // Generate monthly trends for last 6 months
    const generateMonthlyTrend = (type: 'Income' | 'Expense') => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        const monthData = expensesData.filter((e: any) => {
          const expenseDate = new Date(e.date);
          return e.type === type && expenseDate >= monthStart && expenseDate <= monthEnd;
        });
        
        const total = monthData.reduce((sum: number, e: any) => sum + e.amount, 0);
        
        months.push({
          month: targetDate.toLocaleDateString('it-IT', { month: 'short' }),
          value: total
        });
      }
      return months;
    };

    const monthlyIncomeTrend = generateMonthlyTrend('Income');
    const monthlyExpensesTrend = generateMonthlyTrend('Expense');
    
    // Generate savings trend
    const monthlySavingsTrend = monthlyIncomeTrend.map((income, index) => ({
      month: income.month,
      value: income.value - monthlyExpensesTrend[index].value
    }));

    return {
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      incomeChange,
      expensesChange,
      categoryBreakdown,
      currentMonthData,
      previousMonthData,
      monthlyIncomeTrend,
      monthlyExpensesTrend,
      monthlySavingsTrend,
    };
  }, [expensesData]);

  return {
    metrics,
    expenses: expensesData || [],
    isLoading: expensesLoading,
  };
}

