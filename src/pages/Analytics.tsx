import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { Download, RefreshCw, TrendingUp, TrendingDown, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

export default function Analytics() {
  const { expenses } = useExpenses();
  const [selectedPeriod, setSelectedPeriod] = useState("Oggi");
  const [selectedCategory, setSelectedCategory] = useState("Tutte le Categorie");
  const [selectedComparison, setSelectedComparison] = useState("Comparazione Periodi");

  // Calculate metrics
  const totalIncome = expenses
    .filter((e) => e.type === "Income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "Expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netWorth = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netWorth / totalIncome) * 100) : 0;
  const healthScore = Math.min(100, Math.max(0, savingsRate + 30)); // Simulated

  // Prepare chart data
  const wealthTimelineData = {
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    datasets: [{
      label: 'Net Worth',
      data: [28000, 29500, 31000, 32500, 33500, 34500, 35500, 36000, 35800, 36075, 36500, 37000],
      borderColor: '#7B2FF7',
      backgroundColor: 'rgba(123, 47, 247, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
    }]
  };

  const expenseDistributionData = {
    labels: ['Casa', 'Cibo', 'Trasporti', 'Intrattenimento', 'Shopping', 'Altro'],
    datasets: [{
      data: [35, 23, 12, 8, 15, 7],
      backgroundColor: [
        '#7B2FF7', '#00D4AA', '#FF6B35', '#FFD166', '#118AB2', '#06D6A0'
      ],
      borderWidth: 0
    }]
  };

  const cashFlowData = {
    labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
    datasets: [
      {
        label: 'Entrate',
        data: [2800, 2800, 2800, 2800, 2800, 2800],
        backgroundColor: '#00D4AA',
        borderRadius: 6
      },
      {
        label: 'Uscite',
        data: [1876, 1923, 1789, 1654, 1923, 1820],
        backgroundColor: '#FF6B35',
        borderRadius: 6
      }
    ]
  };

  const categoryComparisonData = {
    labels: ['Casa', 'Cibo', 'Trasporti', 'Intrattenimento', 'Shopping', 'Salute'],
    datasets: [
      {
        label: 'Le tue Spese',
        data: [35, 23, 12, 8, 15, 7],
        backgroundColor: 'rgba(123, 47, 247, 0.2)',
        borderColor: '#7B2FF7',
        borderWidth: 2
      },
      {
        label: 'Media Nazionale',
        data: [32, 28, 15, 12, 18, 5],
        backgroundColor: 'rgba(0, 212, 170, 0.2)',
        borderColor: '#00D4AA',
        borderWidth: 2
      }
    ]
  };

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

  const handleExport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('export-analytics-report', {
        body: { period: selectedPeriod, category: selectedCategory, comparison: selectedComparison }
      });
      if (error) throw error;
      toast.success('Report esportato con successo');
    } catch (e) {
      console.error(e);
      toast.error('Errore durante export report');
    }
  };

  const handleRefresh = async () => {
    try {
      // Se in futuro useremo query key per expenses, qui potremmo invalidare. Per ora re-render.
      setSelectedPeriod((p) => p);
      toast.success('Dati aggiornati');
    } catch (e) {
      console.error(e);
      toast.error('Errore durante aggiornamento dati');
    }
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
          <Button onClick={handleExport} className="glass-card hover:bg-white/10 border border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
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
              <div className="text-2xl font-bold mt-1 text-green-400">€{netWorth.toLocaleString('it-IT')}</div>
            </div>
            <div className="trend-badge trend-up">
              <TrendingUp className="w-3 h-3" />
              12.4%
            </div>
          </div>
          <div className="text-sm text-gray-400">Crescita annuale</div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Cash Flow</div>
              <div className="text-2xl font-bold mt-1 text-green-400">€{netWorth.toLocaleString('it-IT')}</div>
            </div>
            <div className="trend-badge trend-up">
              <TrendingUp className="w-3 h-3" />
              5.2%
            </div>
          </div>
          <div className="text-sm text-gray-400">Mensile positivo</div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Risparmio</div>
              <div className="text-2xl font-bold mt-1 text-purple-400">{savingsRate.toFixed(1)}%</div>
            </div>
            <div className="trend-badge trend-down">
              <TrendingDown className="w-3 h-3" />
              2.1%
            </div>
          </div>
          <div className="text-sm text-gray-400">Del reddito mensile</div>
        </div>
        
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Health Score</div>
              <div className="text-2xl font-bold mt-1 text-green-400">{Math.round(healthScore)}/100</div>
            </div>
            <div className="trend-badge trend-up">
              <TrendingUp className="w-3 h-3" />
              8%
            </div>
          </div>
          <div className="text-sm text-gray-400">Livello Esperto</div>
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
          <div className="h-[300px]">
            <Chart type="line" data={wealthTimelineData} options={chartOptions} />
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
          <div className="h-[300px]">
            <Chart 
              type="doughnut" 
              data={expenseDistributionData} 
              options={{
                ...chartOptions,
                cutout: '60%'
              }} 
            />
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
          <div className="h-[300px]">
            <Chart type="bar" data={cashFlowData} options={chartOptions} />
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
          <div className="h-[300px]">
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
                  strokeDashoffset="98" 
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="65" textAnchor="middle" className="text-2xl font-bold fill-white">70%</text>
              </svg>
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-400">Ottimo Risparmio</div>
            <div className="text-gray-400 text-sm">Above 60% benchmark</div>
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
                <span className="font-semibold text-green-400">{savingsRate.toFixed(0)}%</span>
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

