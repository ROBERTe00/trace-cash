import { useMemo } from "react";
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
  Filler,
} from "chart.js";

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
  Filler
);

interface AllocationItem {
  label: string;
  value: number;
  color: string;
}

interface InvestmentsPremiumProps {
  totalValue: number;
  totalReturn: number;
  annualReturnPct: number;
  dividends: number;
  allocation: AllocationItem[];
  growthSeries: number[];
  benchmarkSeries: number[];
}

export default function InvestmentsPremium({
  totalValue,
  totalReturn,
  annualReturnPct,
  dividends,
  allocation,
  growthSeries,
  benchmarkSeries,
}: InvestmentsPremiumProps) {
  const allocationData = useMemo(
    () => ({
      labels: allocation.map((a) => a.label),
      datasets: [
        {
          data: allocation.map((a) => a.value),
          backgroundColor: allocation.map((a) => a.color),
          borderWidth: 0,
        },
      ],
    }),
    [allocation]
  );

  const growthData = useMemo(
    () => ({
      labels: [
        "Gen",
        "Feb",
        "Mar",
        "Apr",
        "Mag",
        "Giu",
        "Lug",
        "Ago",
        "Set",
        "Ott",
        "Nov",
        "Dic",
      ],
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

  const benchmarkData = useMemo(
    () => ({
      labels: [
        "Gen",
        "Feb",
        "Mar",
        "Apr",
        "Mag",
        "Giu",
        "Lug",
        "Ago",
        "Set",
        "Ott",
        "Nov",
        "Dic",
      ],
      datasets: [
        {
          label: "Il Tuo Portafoglio",
          data: benchmarkSeries,
          borderColor: "#7B2FF7",
          backgroundColor: "transparent",
          borderWidth: 3,
          tension: 0.4,
        },
        {
          label: "S&P 500",
          data: [
            100, 102.1, 104.3, 101.8, 106.2, 108.5, 111.2, 109.8, 112.4, 115.1,
            113.5, 116.3,
          ],
          borderColor: "#00D4AA",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
        },
      ],
    }),
    [benchmarkSeries]
  );

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
          <button className="px-6 py-3 glass-card hover:bg-white/10 transition-all hover-lift">
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
            <div className="text-2xl font-bold text-purple-400 mb-2">Moderato</div>
            <div className="text-sm text-gray-400">Bilanciato tra crescita e stabilità</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Volatilità</span>
                <span className="text-sm font-semibold text-green-400">14.2%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded">
                <div className="h-1.5 bg-purple-500 rounded" style={{ width: "65%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Sharpe Ratio</span>
                <span className="text-sm font-semibold text-green-400">1.45</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded">
                <div className="h-1.5 bg-green-500 rounded" style={{ width: "80%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Max Drawdown</span>
                <span className="text-sm font-semibold text-orange-400">-8.3%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded">
                <div className="h-1.5 bg-orange-500 rounded" style={{ width: "35%" }} />
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
              <select className="bg-white/5 border border-gray-700 rounded-xl px-3 py-1 text-sm">
                <option>1 Anno</option>
                <option>3 Anni</option>
                <option>5 Anni</option>
                <option>Dall'inizio</option>
              </select>
            </div>
          </div>
          <div className="h-[300px]">
            <Chart type="line" data={growthData} options={commonOptions} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">VS Benchmark</h3>
            <div className="flex gap-2">
              <select className="bg-white/5 border border-gray-700 rounded-xl px-3 py-1 text-sm">
                <option>S&P 500</option>
                <option>MSCI World</option>
                <option>NASDAQ</option>
                <option>Personalizzato</option>
              </select>
            </div>
          </div>
          <div className="h-[300px]">
            <Chart type="line" data={benchmarkData} options={commonOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}


