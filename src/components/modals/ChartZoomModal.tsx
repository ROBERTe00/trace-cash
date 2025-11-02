import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Download, Minimize2 } from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

interface ChartZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: 'line' | 'doughnut' | 'bar';
  chartData: any;
  chartOptions: any;
  title: string;
}

export function ChartZoomModal({ 
  isOpen, 
  onClose, 
  chartType, 
  chartData, 
  chartOptions,
  title 
}: ChartZoomModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [zoom, setZoom] = useState(1);
  
  const periods = [
    { value: '7d', label: '7 giorni' },
    { value: '30d', label: '30 giorni' },
    { value: '3m', label: '3 mesi' },
    { value: '6m', label: '6 mesi' },
    { value: '1y', label: '1 anno' },
  ];
  
  const handleDownload = () => {
    // TODO: Implementare download grafico come PNG/SVG
    console.log('Download chart:', { chartType, selectedPeriod });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto bg-[#1A1A1A] border border-white/10">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-white">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(z => Math.min(2, z + 0.2))}
                className="hover:bg-white/10"
              >
                <ZoomIn className="w-5 h-5 text-purple-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                className="hover:bg-white/10"
              >
                <ZoomOut className="w-5 h-5 text-purple-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="hover:bg-white/10"
              >
                <Download className="w-5 h-5 text-purple-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedPeriod(value)}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                selectedPeriod === value 
                  ? 'bg-purple-600 text-white' 
                  : 'glass-card hover:bg-white/10 text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Large Chart */}
        <div className="h-[500px] flex items-center justify-center" style={{ transform: `scale(${zoom})` }}>
          {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
          {chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
        </div>
        
        {/* Zoom Indicator */}
        <div className="mt-4 text-center text-sm text-gray-400">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </DialogContent>
    </Dialog>
  );
}
