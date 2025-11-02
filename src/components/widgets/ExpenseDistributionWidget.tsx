import { Doughnut } from 'react-chartjs-2';
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ChartZoomModal } from "@/components/modals/ChartZoomModal";

export function ExpenseDistributionWidget() {
  const [showZoom, setShowZoom] = useState(false);
  const { metrics, isLoading, error } = useDashboardData();

  useEffect(() => {
    console.log('[ExpenseDistributionWidget] Render - isLoading:', isLoading, 'metrics:', !!metrics, 'breakdown:', metrics?.categoryBreakdown ? Object.keys(metrics.categoryBreakdown).length : 0, 'error:', !!error);
  }, [isLoading, metrics, error]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!metrics?.categoryBreakdown || Object.keys(metrics.categoryBreakdown).length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Distribuzione Spese</h3>
          <button
            onClick={() => setShowZoom(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 pointer-events-none"
            title="Espandi grafico"
          >
            <Maximize2 className="w-4 h-4 text-purple-400" />
          </button>
        </div>
        <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl bg-white/5 mb-4">
          <div className="text-center">
            <div className="text-4xl mb-3">🥧</div>
            <p className="text-sm font-medium text-white mb-1">Nessuna distribuzione</p>
            <p className="text-xs text-gray-400">Aggiungi spese per vedere la distribuzione</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="text-center py-2 text-gray-400 text-xs">
            Nessuna categoria disponibile
          </div>
        </div>
      </div>
    );
  }

  const categories = Object.entries(metrics.categoryBreakdown)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const chartData = {
    labels: categories.map(([cat]) => cat),
    datasets: [{
      data: categories.map(([, val]) => val),
      backgroundColor: [
        '#7B2FF7',
        '#00D4AA',
        '#FF6B35',
        '#FFD166',
        '#118AB2'
      ],
      borderWidth: 0,
      hoverOffset: 8
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
    cutout: '65%'
  };

  const total = categories.reduce((sum, [, val]) => sum + (val as number), 0);
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Distribuzione Spese</h3>
        <button
          onClick={() => setShowZoom(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Espandi grafico"
        >
          <Maximize2 className="w-4 h-4 text-purple-400" />
        </button>
      </div>
      <div className="h-40 mb-4">
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="space-y-2 text-sm">
        {categories.slice(0, 2).map(([cat, val], idx) => {
          const percent = ((val as number / total) * 100).toFixed(0);
          const color = ['bg-purple-500', 'bg-green-500'][idx] || 'bg-blue-500';
          return (
            <div key={cat} className="flex justify-between items-center hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${color} rounded`}></div>
                <span>{cat}</span>
              </div>
              <span className="font-semibold">{percent}%</span>
            </div>
          );
        })}
      </div>
      
      <ChartZoomModal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        chartType="doughnut"
        chartData={chartData}
        chartOptions={options}
        title="Distribuzione Spese - Vista Dettagliata"
      />
    </>
  );
}
