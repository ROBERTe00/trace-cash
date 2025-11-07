import { useState, useMemo, useRef } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useInvestments } from "@/hooks/useInvestments";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useNetWorthChart, useSpendingChart, useIncomeExpensesChart, usePortfolioAllocationChart } from "@/hooks/useChartData";
import { Download, RefreshCw, TrendingUp, TrendingDown, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chart } from "react-chartjs-2";
import { exportChartAsPNG, exportChartAsPDF, exportChartDataAsCSV } from "@/lib/chartExport";
import { startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears, eachMonthOfInterval, format, parseISO } from "date-fns";
import { registerChartJS } from "@/lib/chartRegistry";

// Register Chart.js components (centralized)
registerChartJS();

export default function Analytics() {
  const { expenses } = useExpenses();
  const { investments, totalValue: totalInvestmentsValue } = useInvestments();
  const { goals } = useFinancialGoals();
  const [selectedPeriod, setSelectedPeriod] = useState("30 Giorni");
  const [selectedCategory, setSelectedCategory] = useState("Tutte le Categorie");
  const [selectedComparison, setSelectedComparison] = useState("Comparazione Periodi");

  // Chart refs for export
  const wealthChartRef = useRef<HTMLDivElement>(null);
  const expenseChartRef = useRef<HTMLDivElement>(null);
  const cashFlowChartRef = useRef<HTMLDivElement>(null);
  const categoryChartRef = useRef<HTMLDivElement>(null);

  // Get filtered expenses based on period
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case "Oggi":
        startDate = startOfDay(now);
        break;
      case "7 Giorni":
        startDate = startOfDay(subDays(now, 7));
        break;
      case "30 Giorni":
        startDate = startOfDay(subDays(now, 30));
        break;
      case "3 Mesi":
        startDate = startOfDay(subMonths(now, 3));
        break;
      case "1 Anno":
        startDate = startOfDay(subYears(now, 1));
        break;
      default:
        return expenses;
    }
    
    return expenses.filter((e) => {
      const expenseDate = parseISO(e.date);
      return expenseDate >= startDate && expenseDate <= endOfDay(now);
    });
  }, [expenses, selectedPeriod]);

  // Calculate metrics from filtered data
  const totalIncome = useMemo(() => {
    return filteredExpenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netWorth = useMemo(() => {
    return totalIncome - totalExpensesAmount + totalInvestmentsValue;
  }, [totalIncome, totalExpensesAmount, totalInvestmentsValue]);

  const savingsRate = useMemo(() => {
    return totalIncome > 0 ? ((totalIncome - totalExpensesAmount) / totalIncome) * 100 : 0;
  }, [totalIncome, totalExpensesAmount]);

  const healthScore = useMemo(() => {
    // Calculate based on multiple factors
    let score = 50; // Base score
    
    // Savings rate contribution (max 30 points)
    if (savingsRate > 20) score += 30;
    else if (savingsRate > 10) score += 20;
    else if (savingsRate > 5) score += 10;
    else if (savingsRate < 0) score -= 20;
    
    // Expenses vs income (max 20 points)
    const expenseRatio = totalIncome > 0 ? totalExpensesAmount / totalIncome : 1;
    if (expenseRatio < 0.7) score += 20;
    else if (expenseRatio < 0.85) score += 10;
    else if (expenseRatio > 1) score -= 20;
    
    // Goals progress (max 20 points)
    const activeGoals = goals?.filter(g => g.status === 'active') || [];
    if (activeGoals.length > 0) {
      const avgProgress = activeGoals.reduce((sum, g) => {
        return sum + (g.current_amount / g.target_amount) * 100;
      }, 0) / activeGoals.length;
      score += Math.min(20, avgProgress / 5);
    }
    
    return Math.min(100, Math.max(0, score));
  }, [savingsRate, totalIncome, totalExpensesAmount, goals]);
  
  // Calculate growth percentage (vs previous period)
  const growthPercentage = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
    
    switch (selectedPeriod) {
      case "Oggi":
        currentStart = startOfDay(now);
        currentEnd = endOfDay(now);
        previousStart = startOfDay(subDays(now, 1));
        previousEnd = endOfDay(subDays(now, 1));
        break;
      case "7 Giorni":
        currentStart = startOfDay(subDays(now, 7));
        currentEnd = endOfDay(now);
        previousStart = startOfDay(subDays(now, 14));
        previousEnd = endOfDay(subDays(now, 7));
        break;
      case "30 Giorni":
        currentStart = startOfDay(subDays(now, 30));
        currentEnd = endOfDay(now);
        previousStart = startOfDay(subDays(now, 60));
        previousEnd = endOfDay(subDays(now, 30));
        break;
      default:
        return 0;
    }
    
    const currentNet = expenses
      .filter((e) => {
        const d = parseISO(e.date);
        return d >= currentStart && d <= currentEnd;
      })
      .reduce((sum, e) => sum + (e.type === "Income" ? e.amount : -e.amount), 0);
    
    const previousNet = expenses
      .filter((e) => {
        const d = parseISO(e.date);
        return d >= previousStart && d <= previousEnd;
      })
      .reduce((sum, e) => sum + (e.type === "Income" ? e.amount : -e.amount), 0);
    
    if (previousNet === 0) return 0;
    return ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
  }, [expenses, selectedPeriod]);

  // Use real chart data hooks
  const timeframe = useMemo(() => {
    switch (selectedPeriod) {
      case "7 Giorni": return '1M' as const;
      case "30 Giorni": return '1M' as const;
      case "3 Mesi": return '3M' as const;
      case "1 Anno": return '1Y' as const;
      default: return '1M' as const;
    }
  }, [selectedPeriod]);
  
  const { chartData: wealthTimelineData } = useNetWorthChart(timeframe);
  const { chartData: expenseDistributionData } = useSpendingChart();
  const { chartData: cashFlowData } = useIncomeExpensesChart(timeframe);
  const { chartData: portfolioAllocationData } = usePortfolioAllocationChart();

  // Calculate category comparison (real vs benchmark)
  const categoryComparisonData = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) return null;
    
    const categoryTotals = new Map<string, number>();
    filteredExpenses
      .filter((e) => e.type === "Expense")
      .forEach((e) => {
        const cat = e.category || "Altro";
        categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + e.amount);
      });
    
    const categories = Array.from(categoryTotals.keys()).slice(0, 6);
    const total = Array.from(categoryTotals.values()).reduce((sum, v) => sum + v, 0);
    
    // Calculate percentages
    const userPercentages = categories.map(cat => {
      const amount = categoryTotals.get(cat) || 0;
      return total > 0 ? (amount / total) * 100 : 0;
    });
    
    // Benchmark data (Italian averages - simplified)
    const benchmarks: Record<string, number> = {
      "Casa": 32,
      "Cibo": 28,
      "Trasporti": 15,
      "Intrattenimento": 12,
      "Shopping": 18,
      "Salute": 5,
      "Altro": 10
    };
    
    const benchmarkPercentages = categories.map(cat => benchmarks[cat] || 10);
    
    return {
      labels: categories,
    datasets: [
      {
        label: 'Le tue Spese',
          data: userPercentages,
        backgroundColor: 'rgba(123, 47, 247, 0.2)',
        borderColor: '#7B2FF7',
        borderWidth: 2
      },
      {
        label: 'Media Nazionale',
          data: benchmarkPercentages,
        backgroundColor: 'rgba(0, 212, 170, 0.2)',
        borderColor: '#00D4AA',
        borderWidth: 2
      }
    ]
  };
  }, [filteredExpenses]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    }
  };

  const periods = ["Oggi", "7 Giorni", "30 Giorni", "3 Mesi", "1 Anno", "Personalizzato"];

  const handleExport = async (format: 'pdf' | 'png' | 'csv') => {
    try {
      if (format === 'csv') {
        // Export all chart data as CSV
        if (cashFlowData) {
          exportChartDataAsCSV(
            cashFlowData.labels,
            cashFlowData.datasets,
            `analytics-cashflow-${new Date().toISOString().split('T')[0]}.csv`
          );
          toast.success('CSV esportato con successo');
        }
      } else if (format === 'pdf') {
        // Export all charts as PDF
        const charts = [
          { element: wealthChartRef.current, title: 'Andamento Patrimoniale' },
          { element: expenseChartRef.current, title: 'Distribuzione Spese' },
          { element: cashFlowChartRef.current, title: 'Analisi Cash Flow' },
          { element: categoryChartRef.current, title: 'Confronto Categorie' }
        ].filter(chart => chart.element);
        
        if (charts.length > 0) {
          // Export first chart as example (can be enhanced to export all)
          if (charts[0].element) {
            await exportChartAsPDF(
              charts[0].element as HTMLElement,
              `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
              { title: charts[0].title, backgroundColor: '#0F0F0F' }
            );
            toast.success('PDF esportato con successo');
          }
        }
      } else {
        // Export as PNG
        if (wealthChartRef.current) {
          await exportChartAsPNG(
            wealthChartRef.current as HTMLElement,
            `analytics-wealth-${new Date().toISOString().split('T')[0]}.png`,
            { backgroundColor: '#0F0F0F', scale: 2 }
          );
          toast.success('Immagine esportata con successo');
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Errore durante export');
    }
  };

  const handleRefresh = () => {
    // Force refetch by toggling period (triggers recalculation)
    const current = selectedPeriod;
    setSelectedPeriod("");
    setTimeout(() => setSelectedPeriod(current), 10);
      toast.success('Dati aggiornati');
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white antialiased">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 fade-in px-6 pt-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-gray-400 text-lg">Analisi approfondite e insights intelligenti</p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => handleExport('pdf')} className="glass-card hover:bg-white/10 border border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => handleExport('csv')} className="glass-card hover:bg-white/10 border border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleRefresh} className="glass-card hover:bg-white/10 border border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna Dati
          </Button>
        </div>
      </div>

      {/* Time Period Filters */}
      <div className="glass-card p-6 mb-8 fade-in mx-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`filter-pill ${selectedPeriod === period ? 'active' : ''}`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <div className="flex gap-3">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 focus:border-purple-500"
            >
              <option>Tutte le Categorie</option>
              <option>Entrate</option>
              <option>Uscite</option>
              <option>Investimenti</option>
            </select>
            
            <select 
              value={selectedComparison}
              onChange={(e) => setSelectedComparison(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 focus:border-purple-500"
            >
              <option>Comparazione Periodi</option>
              <option>Trend Mensile</option>
              <option>Benchmark</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 fade-in px-6">
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Net Worth</div>
              <div className="text-2xl font-bold mt-1 text-green-400">€{netWorth.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
            <div className={`trend-badge ${growthPercentage >= 0 ? 'trend-up' : 'trend-down'}`}>
              {growthPercentage >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(growthPercentage).toFixed(1)}%
            </div>
          </div>
          <div className="text-sm text-gray-400">Crescita periodo</div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Cash Flow</div>
              <div className="text-2xl font-bold mt-1 text-green-400">€{(totalIncome - totalExpensesAmount).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
            <div className={`trend-badge ${(totalIncome - totalExpensesAmount) >= 0 ? 'trend-up' : 'trend-down'}`}>
              {(totalIncome - totalExpensesAmount) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {savingsRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-sm text-gray-400">Periodo selezionato</div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Risparmio</div>
              <div className="text-2xl font-bold mt-1 text-purple-400">{savingsRate.toFixed(1)}%</div>
            </div>
            <div className={`trend-badge ${savingsRate >= 20 ? 'trend-up' : savingsRate >= 10 ? 'trend-up' : 'trend-down'}`}>
              {savingsRate >= 20 ? <TrendingUp className="w-3 h-3" /> : savingsRate >= 10 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {savingsRate >= 20 ? 'Ottimo' : savingsRate >= 10 ? 'Buono' : 'Migliorabile'}
            </div>
          </div>
          <div className="text-sm text-gray-400">Del reddito</div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Health Score</div>
              <div className="text-2xl font-bold mt-1 text-green-400">{Math.round(healthScore)}/100</div>
            </div>
            <div className={`trend-badge ${healthScore >= 80 ? 'trend-up' : healthScore >= 60 ? 'trend-up' : 'trend-down'}`}>
              {healthScore >= 80 ? <TrendingUp className="w-3 h-3" /> : healthScore >= 60 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {healthScore >= 80 ? 'Eccellente' : healthScore >= 60 ? 'Buono' : 'Migliorabile'}
            </div>
          </div>
          <div className="text-sm text-gray-400">Salute Finanziaria</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 px-6">
        {/* Wealth Timeline Chart */}
        <div className="glass-card p-6 fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Andamento Patrimoniale</h3>
            <Button variant="ghost" size="icon" className="hover:bg-white/5">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div ref={wealthChartRef} className="h-[300px]">
            {wealthTimelineData ? (
            <Chart type="line" data={wealthTimelineData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="glass-card p-6 fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Distribuzione Spese</h3>
            <Button variant="ghost" size="icon" className="hover:bg-white/5">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div ref={expenseChartRef} className="h-[300px]">
            {expenseDistributionData ? (
            <Chart 
              type="doughnut" 
              data={expenseDistributionData} 
              options={{
                ...chartOptions,
                cutout: '60%'
              }} 
            />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </div>

        {/* Cash Flow Analysis */}
        <div className="glass-card p-6 fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Analisi Cash Flow</h3>
            <Button variant="ghost" size="icon" className="hover:bg-white/5">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div ref={cashFlowChartRef} className="h-[300px]">
            {cashFlowData ? (
              <Chart type="bar" data={cashFlowData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </div>

        {/* Category Comparison */}
        <div className="glass-card p-6 fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Confronto Categorie</h3>
            <Button variant="ghost" size="icon" className="hover:bg-white/5">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div ref={categoryChartRef} className="h-[300px]">
            {categoryComparisonData ? (
              <Chart 
                type="radar" 
                data={categoryComparisonData} 
                options={{
                  ...chartOptions,
                  scales: {
                    r: {
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      ticks: { 
                        color: 'rgba(255, 255, 255, 0.7)',
                        backdropColor: 'transparent'
                      },
                      angleLines: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 px-6">
        {/* Savings Efficiency */}
        <div className="glass-card p-6 fade-in">
          <h3 className="text-xl font-semibold mb-6">Efficienza Risparmio</h3>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <svg className="w-32 h-32" viewBox="0 0 120 120">
                <circle 
                  className="text-gray-700" 
                  strokeWidth="8" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="52" 
                  cx="60" 
                  cy="60"
                />
                <circle 
                  className="text-green-400" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="52" 
                  cx="60" 
                  cy="60" 
                  strokeDasharray="326.56" 
                  strokeDashoffset={326.56 * (1 - Math.min(savingsRate, 100) / 100)} 
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="65" textAnchor="middle" className="text-2xl font-bold fill-white">{Math.round(Math.min(savingsRate, 100))}%</text>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-orange-400'}`}>
              {savingsRate >= 20 ? 'Ottimo Risparmio' : savingsRate >= 10 ? 'Buon Risparmio' : 'Risparmio da Migliorare'}
            </div>
            <div className="text-gray-400 text-sm">
              {savingsRate >= 20 ? 'Above 20% benchmark' : savingsRate >= 10 ? 'Near 10% benchmark' : 'Below 10% benchmark'}
            </div>
          </div>
        </div>

        {/* Spending Trends */}
        <div className="glass-card p-6 fade-in">
          <h3 className="text-xl font-semibold mb-6">Trend di Spesa</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>🍕 Cibo & Dining</span>
                <span className="text-orange-400">+15%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill bg-orange-500" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>🛍️ Shopping</span>
                <span className="text-green-400">-8%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill bg-purple-500" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>🚗 Trasporti</span>
                <span className="text-green-400">-12%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill bg-green-500" style={{ width: '28%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="glass-card p-6 fade-in">
          <h3 className="text-xl font-semibold mb-6">Confronto Benchmark</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Il tuo Risparmio</span>
                <span className="font-semibold text-green-400">{Math.round(savingsRate)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill bg-green-500" style={{ width: `${savingsRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Media Nazionale</span>
                <span className="text-gray-400">22%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill bg-gray-400" style={{ width: '22%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Top 10%</span>
                <span className="text-purple-400">58%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill bg-purple-500" style={{ width: '58%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights & Recommendations */}
      <div className="glass-card p-6 fade-in mx-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">AI Insights & Raccomandazioni</h3>
            <p className="text-gray-400 text-sm">Analisi intelligente basata sui tuoi dati</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="insight-card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <div className="font-semibold text-purple-400 mb-1">Opportunità di Investimento</div>
                <div className="text-sm text-gray-300">Basato sul tuo cash flow positivo, considera di investire €500 in ETF diversificati</div>
              </div>
            </div>
            <button className="mt-3 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-all text-sm">
              Esplora Investimenti
            </button>
          </div>
          
          <div className="insight-card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-green-400 mb-1">Trend Positivo Rilevato</div>
                <div className="text-sm text-gray-300">Le tue spese per intrattenimento sono diminuite del 25% questo mese</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="trend-badge trend-up">Miglioramento</span>
              <span className="text-xs text-gray-400">Rispetto al mese scorso</span>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <div>
                <div className="font-semibold text-orange-400 mb-1">Attenzione Necessaria</div>
                <div className="text-sm text-gray-300">Le spese per delivery food sono aumentate del 40% - considera un budget</div>
              </div>
            </div>
            <button className="mt-3 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-all text-sm">
              Imposta Budget
            </button>
          </div>
          
          <div className="insight-card">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <div className="font-semibold text-green-400 mb-1">Obiettivo Raggiungibile</div>
                <div className="text-sm text-gray-300">Puoi raggiungere il tuo obiettivo di €10k in 14 mesi con l'attuale tasso di risparmio</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="trend-badge trend-up">14 mesi</span>
              <span className="text-xs text-gray-400">Tempo stimato</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

