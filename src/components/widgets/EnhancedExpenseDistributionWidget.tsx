// Enhanced Expense Distribution Widget - Uses real data
import { Doughnut } from 'react-chartjs-2';
import { useSpendingChart } from '@/hooks/useChartData';
import { registerChartJS } from '@/lib/chartRegistry';

// Register Chart.js components (centralized)
registerChartJS();
import { Skeleton } from '@/components/ui/skeleton';
import { Maximize2, Download, FileDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { Modal } from '@/components/modals/ModalSystem';
import { Button } from '@/components/ui/button';
import { exportChartAsPNG, exportChartAsPDF, exportChartDataAsCSV } from '@/lib/chartExport';

export function EnhancedExpenseDistributionWidget() {
  const [showZoom, setShowZoom] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { chartData, isLoading, isEmpty } = useSpendingChart();

  const handleExportPNG = async () => {
    if (chartRef.current) {
      await exportChartAsPNG(chartRef.current, 'expense-distribution.png');
    }
  };

  const handleExportPDF = async () => {
    if (chartRef.current) {
      await exportChartAsPDF(chartRef.current, 'expense-distribution.pdf', {
        title: 'Expense Distribution'
      });
    }
  };

  const handleExportCSV = () => {
    if (chartData) {
      exportChartDataAsCSV(chartData.labels, chartData.datasets, 'expense-distribution.csv');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (isEmpty) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Distribuzione Spese</h3>
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
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: €${context.parsed.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  const categories = chartData
    ? chartData.labels.map((label, index) => ({
        label,
        value: chartData.datasets[0].data[index],
        color: Array.isArray(chartData.datasets[0].backgroundColor)
          ? chartData.datasets[0].backgroundColor[index]
          : chartData.datasets[0].backgroundColor || '#7B2FF7'
      }))
    : [];

  const total = categories.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Distribuzione Spese</h3>
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
      <div ref={chartRef} className="h-40 mb-4">
        {chartData && <Doughnut data={chartData} options={options} />}
      </div>
      <div className="space-y-2 text-sm">
        {categories.slice(0, 3).map((cat, idx) => {
          const percent = ((cat.value / total) * 100).toFixed(0);
          return (
            <div key={cat.label} className="flex justify-between items-center hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.label}</span>
              </div>
              <span className="font-semibold">{percent}%</span>
            </div>
          );
        })}
      </div>

      {/* Zoom Modal */}
      <Modal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        title="Distribuzione Spese - Vista Dettagliata"
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
            {chartData && <Doughnut data={chartData} options={{ ...options, maintainAspectRatio: true }} />}
          </div>
          <div className="space-y-2 text-sm">
            {categories.map((cat) => {
              const percent = ((cat.value / total) * 100).toFixed(1);
              return (
                <div key={cat.label} className="flex justify-between items-center p-2 hover:bg-white/5 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">€{cat.value.toFixed(2)}</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
}

