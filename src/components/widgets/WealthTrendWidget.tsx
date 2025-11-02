import { Line } from 'react-chartjs-2';
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ChartZoomModal } from "@/components/modals/ChartZoomModal";

export function WealthTrendWidget() {
  const [showZoom, setShowZoom] = useState(false);
  const { metrics, isLoading, error } = useDashboardData();

  useEffect(() => {
    console.log('[WealthTrendWidget] Render - isLoading:', isLoading, 'metrics:', !!metrics, 'trend:', metrics?.monthlySavingsTrend?.length || 0, 'error:', !!error);
  }, [isLoading, metrics, error]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!metrics?.monthlySavingsTrend || metrics.monthlySavingsTrend.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Andamento Patrimoniale</h3>
          <div className="flex items-center gap-2">
            <select className="bg-transparent text-sm border border-gray-700 rounded-lg px-2 py-1">
              <option>30g</option>
              <option>3m</option>
              <option>1a</option>
            </select>
          </div>
        </div>
        <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-white/5">
          <div className="text-center">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-sm font-medium text-white mb-1">Nessun trend disponibile</p>
            <p className="text-xs text-gray-400">Aggiungi transazioni per vedere il trend</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: metrics.monthlySavingsTrend.map(d => d.month),
    datasets: [{
      label: 'Patrimonio',
      data: metrics.monthlySavingsTrend.map(d => d.value),
      borderColor: '#7B2FF7',
      backgroundColor: 'rgba(123, 47, 247, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#7B2FF7',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 3
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { 
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value: any) {
            return '€' + (value / 1000).toFixed(1) + 'k';
          }
        }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Andamento Patrimoniale</h3>
        <div className="flex items-center gap-2">
          <select className="bg-transparent text-sm border border-gray-700 rounded-lg px-2 py-1">
            <option>30g</option>
            <option>3m</option>
            <option>1a</option>
          </select>
          <button
            onClick={() => setShowZoom(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Espandi grafico"
          >
            <Maximize2 className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>
      <div className="h-40">
        <Line data={chartData} options={options} />
      </div>
      
      <ChartZoomModal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        chartType="line"
        chartData={chartData}
        chartOptions={options}
        title="Andamento Patrimoniale - Vista Dettagliata"
      />
    </>
  );
}
