// Enhanced Wealth Trend Widget - Uses real data from useChartData hook
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useNetWorthChart } from '@/hooks/useChartData';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
import { Skeleton } from '@/components/ui/skeleton';
import { Maximize2, Download, FileDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { Modal } from '@/components/modals/ModalSystem';
import { Button } from '@/components/ui/button';
import { exportChartAsPNG, exportChartAsPDF, exportChartDataAsCSV } from '@/lib/chartExport';

export function EnhancedWealthTrendWidget() {
  const [showZoom, setShowZoom] = useState(false);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartData, isLoading, isEmpty } = useNetWorthChart(timeframe);

  const handleExportPNG = async () => {
    if (chartRef.current) {
      await exportChartAsPNG(chartRef.current, `net-worth-${timeframe.toLowerCase()}.png`);
    }
  };

  const handleExportPDF = async () => {
    if (chartRef.current) {
      await exportChartAsPDF(chartRef.current, `net-worth-${timeframe.toLowerCase()}.pdf`, {
        title: `Net Worth Trend - ${timeframe}`
      });
    }
  };

  const handleExportCSV = () => {
    if (chartData) {
      exportChartDataAsCSV(
        chartData.labels,
        chartData.datasets,
        `net-worth-${timeframe.toLowerCase()}.csv`
      );
    }
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Andamento Patrimoniale</h3>
          <select
            className="bg-transparent text-sm border border-gray-700 rounded-lg px-2 py-1"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
          >
            <option value="1M">30g</option>
            <option value="3M">3m</option>
            <option value="6M">6m</option>
            <option value="1Y">1a</option>
            <option value="ALL">Tutto</option>
          </select>
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: (context: any) => {
            return `€${context.parsed.y.toFixed(2)}`;
          }
        }
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
          <select
            className="bg-transparent text-sm border border-gray-700 rounded-lg px-2 py-1"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
          >
            <option value="1M">30g</option>
            <option value="3M">3m</option>
            <option value="6M">6m</option>
            <option value="1Y">1a</option>
            <option value="ALL">Tutto</option>
          </select>
          <div className="flex gap-1">
            <button
              onClick={handleExportPNG}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Export PNG"
            >
              <Download className="w-4 h-4 text-purple-400" />
            </button>
            <button
              onClick={() => setShowZoom(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Espandi grafico"
            >
              <Maximize2 className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>
      </div>
      <div ref={chartRef} className="h-40">
        {chartData && <Line data={chartData} options={options} />}
      </div>

      {/* Zoom Modal */}
      <Modal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        title="Andamento Patrimoniale - Vista Dettagliata"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPNG}>
              <Download className="w-4 h-4 mr-2" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileDown className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
          <div className="h-96">
            {chartData && <Line data={chartData} options={{ ...options, maintainAspectRatio: true }} />}
          </div>
        </div>
      </Modal>
    </>
  );
}

