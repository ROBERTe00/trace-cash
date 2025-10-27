import { Line } from 'react-chartjs-2';
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export function WealthTrendWidget() {
  const { metrics, isLoading } = useDashboardData();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!metrics?.monthlySavingsTrend) {
    return (
      <div className="text-center py-8 text-gray-400">
        Nessun dato disponibile
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Andamento Patrimoniale</h3>
        <select className="bg-transparent text-sm border border-gray-700 rounded-lg px-2 py-1">
          <option>30g</option>
          <option>3m</option>
          <option>1a</option>
        </select>
      </div>
      <div className="h-40">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
