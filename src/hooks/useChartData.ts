// Chart Data Hook - Dynamic chart data from real sources
import { useMemo, useEffect, useState } from 'react';
import { useExpenses } from './useExpenses';
import { useInvestments } from './useInvestments';
import { useFinancialGoals } from './useFinancialGoals';
import { eventBus, Events } from '@/core/event-system';
import type { Expense } from './useExpenses';

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    [key: string]: any;
  }>;
}

/**
 * Hook for Net Worth Chart - Calculates from expenses and investments
 */
export function useNetWorthChart(timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL' = '1M') {
  const { data: expenses } = useExpenses();
  const { data: investments } = useInvestments();
  const [chartData, setChartData] = useState<TimeSeriesData | null>(null);

  // Calculate net worth over time
  const netWorthData = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;

    const days = timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : 730;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Group expenses by date
    const expensesByDate = new Map<string, number>();
    const incomeByDate = new Map<string, number>();

    expenses
      .filter((e: Expense) => new Date(e.date) >= startDate)
      .forEach((expense: Expense) => {
        const dateKey = expense.date.split('T')[0];
        if (expense.type === 'Expense') {
          expensesByDate.set(dateKey, (expensesByDate.get(dateKey) || 0) + expense.amount);
        } else {
          incomeByDate.set(dateKey, (incomeByDate.get(dateKey) || 0) + expense.amount);
        }
      });

    // Calculate cumulative net worth
    const dates = Array.from(new Set([...expensesByDate.keys(), ...incomeByDate.keys()])).sort();
    let runningBalance = 0;
    const dataPoints: ChartDataPoint[] = [];

    dates.forEach(date => {
      const income = incomeByDate.get(date) || 0;
      const expense = expensesByDate.get(date) || 0;
      runningBalance += (income - expense);
      
      dataPoints.push({
        label: new Date(date).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
        value: runningBalance,
        timestamp: date
      });
    });

    // Add investment value if available
    const totalInvestments = investments?.reduce((sum, inv) => {
      return sum + ((inv.quantity || 0) * (inv.current_price || 0));
    }, 0) || 0;

    return {
      labels: dataPoints.map(d => d.label),
      datasets: [{
        label: 'Net Worth',
        data: dataPoints.map(d => d.value + totalInvestments),
        borderColor: '#7B2FF7',
        backgroundColor: 'rgba(123, 47, 247, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  }, [expenses, investments, timeframe]);

  // Listen to data changes
  useEffect(() => {
    const unsubscribe = eventBus.on(Events.TRANSACTION_CREATED, () => {
      // Trigger recalculation
      if (netWorthData) {
        setChartData(netWorthData);
      }
    });

    return unsubscribe;
  }, [netWorthData]);

  useEffect(() => {
    setChartData(netWorthData);
  }, [netWorthData]);

  return {
    chartData,
    isLoading: !expenses && !investments,
    isEmpty: !chartData || chartData.labels.length === 0
  };
}

/**
 * Hook for Spending Chart - Aggregates expenses by category
 */
export function useSpendingChart() {
  const { data: expenses } = useExpenses();

  const chartData = useMemo<TimeSeriesData | null>(() => {
    if (!expenses || expenses.length === 0) return null;

    const categoryTotals = new Map<string, number>();
    
    expenses
      .filter((e: Expense) => e.type === 'Expense')
      .forEach((expense: Expense) => {
        const category = expense.category || 'Other';
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + expense.amount);
      });

    const categories = Array.from(categoryTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    const colors = [
      '#7B2FF7', '#00D4AA', '#FF6B35', '#FFD166',
      '#118AB2', '#9B59B6', '#E74C3C', '#3498DB'
    ];

    return {
      labels: categories.map(([cat]) => cat),
      datasets: [{
        label: 'Spese',
        data: categories.map(([, val]) => val),
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }, [expenses]);

  return {
    chartData,
    isLoading: !expenses,
    isEmpty: !chartData || chartData.labels.length === 0
  };
}

/**
 * Hook for Income vs Expenses Chart
 */
export function useIncomeExpensesChart(timeframe: '1M' | '3M' | '6M' | '1Y' = '1M') {
  const { data: expenses } = useExpenses();

  const chartData = useMemo<TimeSeriesData | null>(() => {
    if (!expenses || expenses.length === 0) return null;

    const days = timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Group by month
    const monthlyData = new Map<string, { income: number; expenses: number }>();

    expenses
      .filter((e: Expense) => new Date(e.date) >= startDate)
      .forEach((expense: Expense) => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { income: 0, expenses: 0 });
        }

        const data = monthlyData.get(monthKey)!;
        if (expense.type === 'Income') {
          data.income += expense.amount;
        } else {
          data.expenses += expense.amount;
        }
      });

    const sortedMonths = Array.from(monthlyData.keys()).sort();
    const monthLabels = sortedMonths.map(key => {
      const [year, month] = key.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
    });

    return {
      labels: monthLabels,
      datasets: [
        {
          label: 'Entrate',
          data: sortedMonths.map(key => monthlyData.get(key)!.income),
          backgroundColor: 'rgba(0, 212, 170, 0.8)',
          borderColor: '#00D4AA',
          borderWidth: 2
        },
        {
          label: 'Spese',
          data: sortedMonths.map(key => monthlyData.get(key)!.expenses),
          backgroundColor: 'rgba(255, 107, 53, 0.8)',
          borderColor: '#FF6B35',
          borderWidth: 2
        }
      ]
    };
  }, [expenses, timeframe]);

  return {
    chartData,
    isLoading: !expenses,
    isEmpty: !chartData || chartData.labels.length === 0
  };
}

/**
 * Hook for Portfolio Allocation Chart
 */
export function usePortfolioAllocationChart() {
  const { data: investments } = useInvestments();

  const chartData = useMemo<TimeSeriesData | null>(() => {
    if (!investments || investments.length === 0) return null;

    const allocation = new Map<string, number>();

    investments.forEach(inv => {
      const type = inv.type || 'Other';
      const value = (inv.quantity || 0) * (inv.current_price || 0);
      allocation.set(type, (allocation.get(type) || 0) + value);
    });

    const entries = Array.from(allocation.entries())
      .filter(([, value]) => value > 0)
      .sort(([, a], [, b]) => b - a);

    const colors = [
      '#7B2FF7', '#00D4AA', '#FF6B35', '#FFD166',
      '#118AB2', '#9B59B6', '#E74C3C', '#3498DB'
    ];

    return {
      labels: entries.map(([type]) => type),
      datasets: [{
        label: 'Allocazione',
        data: entries.map(([, value]) => value),
        backgroundColor: colors.slice(0, entries.length),
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  }, [investments]);

  return {
    chartData,
    isLoading: !investments,
    isEmpty: !chartData || chartData.labels.length === 0
  };
}

