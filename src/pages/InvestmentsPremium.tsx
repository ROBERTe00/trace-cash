import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { registerChartJS } from "@/lib/chartRegistry";

// Register Chart.js components (centralized)
registerChartJS();

interface AllocationItem {
  label: string;
  value: number;
  color: string;
}

interface RiskMetrics {
  volatilityAnnualPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number; // negativo
}

interface InvestmentsPremiumProps {
  totalValue: number;
  totalReturn: number;
  annualReturnPct: number;
  dividends: number;
  allocation: AllocationItem[];
  growthSeries: number[];
  benchmarkSeries: { id: string; label: string; data: number[] }[];
  benchmarkLoading?: boolean; // Stato di caricamento del benchmark
  benchmarkError?: string | null;
  selectedBenchmarks?: string[]; // ID dei benchmark selezionati
  onAddClick?: () => void;
  risk?: RiskMetrics;
  timeframeMonths?: number;
  onTimeframeChange?: (m: number) => void;
  onBenchmarkChange?: (ids: string[], customSymbols?: string[]) => void;
  hasPortfolioData?: boolean;
}

export default function InvestmentsPremium({
  totalValue,
  totalReturn,
  annualReturnPct,
  dividends,
  allocation,
  growthSeries,
  benchmarkSeries,
  benchmarkLoading,
  benchmarkError,
  selectedBenchmarks,
  onAddClick,
  risk,
  timeframeMonths,
  onTimeframeChange,
  onBenchmarkChange,
  hasPortfolioData,
}: InvestmentsPremiumProps) {
  const allocationData = useMemo(
    () => {
      if (!allocation || allocation.length === 0) {
        return {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [],
            borderWidth: 0,
          }],
        };
      }
      return {
        labels: allocation.map((a) => a.label),
        datasets: [
          {
            data: allocation.map((a) => a.value),
            backgroundColor: allocation.map((a) => a.color),
            borderWidth: 0,
          },
        ],
      };
    },
    [allocation]
  );

  const growthData = useMemo(
    () => ({
      labels: growthSeries.map((_, idx) => `M${idx + 1}`),
      datasets: [
        {
          label: "Portafoglio",
          data: growthSeries,
          borderColor: "#7B2FF7",
          backgroundColor: "rgba(123, 47, 247, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    [growthSeries]
  );

  const benchmarkData = useMemo(() => {
    if (!growthSeries || growthSeries.length === 0) {
      return { labels: [], datasets: [] };
    }
    const labels = growthSeries.map((_, i) => `M${i + 1}`);
    const first = growthSeries[0] || 1;
    const portfolioNorm = growthSeries.map(v => (v / (first || 1)) * 100);
    const portfolioDs = {
      label: "Portafoglio",
      data: portfolioNorm,
      borderColor: "#7B2FF7",
      backgroundColor: "transparent",
      borderWidth: 3,
      tension: 0.35,
    };
    const targetLength = growthSeries.length;
    const benchDatasets = (benchmarkSeries || []).map((s, idx) => {
      let data = s.data || [];
      if (data.length > targetLength) data = data.slice(-targetLength);
      if (data.length < targetLength) {
        const last = data[data.length - 1] ?? 100;
        data = [...data, ...Array(targetLength - data.length).fill(last)];
      }
      return {
        label: s.label || s.id,
        data,
        borderColor: ["#00D4AA","#FF6B35","#FFD166","#118AB2","#9B59B6","#E74C3C"][idx % 6],
        backgroundColor: "transparent",
        borderWidth: 2,
        tension: 0.35,
      };
    });
    return { labels, datasets: [portfolioDs, ...benchDatasets] };
  }, [growthSeries, benchmarkSeries]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "rgba(255, 255, 255, 0.7)" },
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "rgba(255, 255, 255, 0.7)" },
      },
      x: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "rgba(255, 255, 255, 0.7)" },
      },
    },
  } as const;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-green-400 bg-clip-text text-transparent">
            Portafoglio Investimenti
          </h1>
          <p className="text-gray-400 text-lg">Gestisci e ottimizza i tuoi investimenti</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onAddClick} className="px-6 py-3 glass-card hover:bg-white/10 transition-all hover-lift">
            <i className="fas fa-plus mr-2" /> Nuovo Investimento
          </button>
          <button className="px-6 py-3 glass-card hover:bg-white/10 transition-all hover-lift">
            <i className="fas fa-robot mr-2" /> AI Rebalancing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Valore Portafoglio</div>
              <div className="text-2xl font-bold mt-1 text-green-400">
                €{totalValue.toLocaleString("it-IT")}
              </div>
            </div>
            <div className="trend-badge trend-up">
              <i className="fas fa-arrow-up" /> 12.4%
            </div>
          </div>
          <div className="text-sm text-gray-400">
            +€{Math.max(totalReturn, 0).toLocaleString("it-IT")} dall'inizio
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Rendimento Totale</div>
              <div className="text-2xl font-bold mt-1 text-green-400">
                €{totalReturn.toLocaleString("it-IT")}
              </div>
            </div>
            <div className="trend-badge trend-up">
              <i className="fas fa-chart-line" /> 23.1%
            </div>
          </div>
          <div className="text-sm text-gray-400">Dall'inizio investimenti</div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Rendimento Annuo</div>
              <div className="text-2xl font-bold mt-1 text-purple-400">
                {annualReturnPct.toFixed(1)}%
              </div>
            </div>
            <div className="trend-badge trend-up">
              <i className="fas fa-trophy" /> Top 25%
            </div>
          </div>
          <div className="text-sm text-gray-400">VS 11.2% benchmark</div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-gray-400 text-sm">Dividendi</div>
              <div className="text-2xl font-bold mt-1 text-green-400">
                €{dividends.toLocaleString("it-IT")}
              </div>
            </div>
            <div className="trend-badge trend-up">
              <i className="fas fa-money-bill-wave" /> 8.2%
            </div>
          </div>
          <div className="text-sm text-gray-400">Yield: 2.75%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="glass-card p-6 xl:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Asset Allocation</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <i className="fas fa-expand" />
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <Chart
              type="doughnut"
              data={allocationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: "65%",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {allocation.map((a) => (
              <div
                key={a.label}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: a.color }}
                  />
                  <span className="text-sm">{a.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-400">{a.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Profilo di Rischio</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <i className="fas fa-info-circle" />
              </button>
            </div>
          </div>
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {risk ? (risk.sharpeRatio >= 1.5 ? 'Aggressivo' : risk.sharpeRatio >= 0.8 ? 'Moderato' : 'Conservativo') : '—'}
            </div>
            <div className="text-sm text-gray-400">Classificazione stimata in base a volatilità e Sharpe</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Volatilità Annua</span>
                <span className="text-sm font-semibold text-green-400">{risk ? `${risk.volatilityAnnualPct.toFixed(1)}%` : '—'}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded">
                <div className="h-1.5 bg-purple-500 rounded" style={{ width: `${Math.min(100, risk ? risk.volatilityAnnualPct : 0)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Sharpe Ratio</span>
                <span className="text-sm font-semibold text-green-400">{risk ? risk.sharpeRatio.toFixed(2) : '—'}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded">
                <div className="h-1.5 bg-green-500 rounded" style={{ width: `${Math.min(100, (risk ? risk.sharpeRatio * 25 : 0))}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Max Drawdown</span>
                <span className="text-sm font-semibold text-orange-400">{risk ? `${risk.maxDrawdownPct.toFixed(1)}%` : '—'}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded">
                <div className="h-1.5 bg-orange-500 rounded" style={{ width: `${Math.min(100, Math.abs(risk ? risk.maxDrawdownPct : 0))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Crescita Portafoglio</h3>
            <div className="flex gap-2">
              <select
                className="bg-white/5 border border-gray-700 rounded-xl px-3 py-1 text-sm"
                value={timeframeMonths ?? 12}
                onChange={(e) => onTimeframeChange?.(parseInt(e.target.value, 10))}
              >
                <option value={12}>1 Anno</option>
                <option value={36}>3 Anni</option>
                <option value={60}>5 Anni</option>
              </select>
            </div>
          </div>
          <div className="h-[300px]">
            {!hasPortfolioData || growthSeries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-6">
                Nessun dato sufficiente per calcolare la crescita del portafoglio.
              </div>
            ) : (
              <Chart type="line" data={growthData} options={commonOptions} />
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">VS Benchmark</h3>
            <div className="flex gap-2">
              <select
                multiple
                className="bg-white/5 border border-gray-700 rounded-xl px-3 py-1 text-sm min-w-[180px] h-[96px]"
                value={selectedBenchmarks || ['SP500']}
                onChange={(e) => {
                  const ids = Array.from(e.target.selectedOptions).map(o => o.value);
                  onBenchmarkChange?.(ids);
                }}
              >
                <option value="SP500">S&P 500</option>
                <option value="MSCI_WORLD">MSCI World</option>
                <option value="NASDAQ100">NASDAQ 100</option>
                <option value="FTSE_MIB">FTSE MIB</option>
                <option value="GOLD">Gold</option>
                <option value="BTC">Bitcoin</option>
                <option value="CUSTOM">Custom…</option>
              </select>
            </div>
          </div>
          <div className="h-[300px]">
            {benchmarkLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="text-sm">Caricamento benchmark...</span>
                </div>
              </div>
            ) : benchmarkError ? (
              <div className="flex items-center justify-center h-full text-center text-sm text-amber-300 px-6">
                {benchmarkError}
              </div>
            ) : benchmarkData.datasets.length === 0 || growthSeries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nessun dato disponibile per il benchmark selezionato
              </div>
            ) : (
              <Chart type="line" data={benchmarkData} options={commonOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




