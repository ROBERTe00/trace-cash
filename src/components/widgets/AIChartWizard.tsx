import { useState } from 'react';
import { Bot, BarChart3, PieChart, LineChart, TrendingUp, Sparkles } from 'lucide-react';

type ChartType = 'line' | 'bar' | 'doughnut' | 'area';

interface ChartConfig {
  type: ChartType;
  prompt: string;
  loading: boolean;
}

export function AIChartWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<ChartConfig>({
    type: 'line',
    prompt: '',
    loading: false
  });
  
  const chartTypes = [
    { id: 'line', icon: LineChart, label: 'Linea', desc: 'Mostra trend nel tempo' },
    { id: 'bar', icon: BarChart3, label: 'Barre', desc: 'Confronto tra categorie' },
    { id: 'doughnut', icon: PieChart, label: 'Torta', desc: 'Distribuzione percentuale' },
    { id: 'area', icon: TrendingUp, label: 'Area', desc: 'Cumulativo nel tempo' },
  ];
  
  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;
    
    setConfig(prev => ({ ...prev, loading: true }));
    
    // Simula chiamata AI (TODO: implementare con vera API)
    setTimeout(() => {
      setConfig(prev => ({ ...prev, loading: false }));
      setStep(3);
    }, 2000);
  };
  
  return (
    <div className="space-y-4">
      {/* Step 1: Scegli tipo */}
      {step === 1 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Crea Grafico Personalizzato
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {chartTypes.map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => {
                  setConfig(prev => ({ ...prev, type: id as ChartType }));
                  setStep(2);
                }}
                className={`p-4 glass-card text-left hover:border-purple-500 transition-all rounded-xl group ${
                  config.type === id ? 'border-2 border-purple-500' : ''
                }`}
              >
                <Icon className="w-6 h-6 mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-medium mb-1">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 2: Prompt AI */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              Descrivi il tuo grafico
            </h3>
            <button 
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Indietro
            </button>
          </div>
          
          <div className="space-y-3">
            <textarea
              placeholder="Es: Mostrami le spese per categoria degli ultimi 3 mesi come grafico a torta..."
              className="w-full min-h-[120px] glass-card p-4 rounded-xl resize-none border-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={config.prompt}
              onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={config.loading || !config.prompt.trim()}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {config.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Genera con AI</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="text-xs text-gray-400 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <strong>Suggerimento:</strong> Descrivi cosa vuoi visualizzare (es: "spese per categoria ultimo mese") 
              e il tipo di grafico. L'AI farà il resto!
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-semibold text-lg">Grafico Generato!</h3>
          <p className="text-sm text-gray-400">Il tuo grafico è stato creato con successo</p>
          <div className="flex gap-2 justify-center">
            <button 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
            >
              Visualizza
            </button>
            <button 
              onClick={() => {
                setStep(1);
                setConfig({ type: 'line', prompt: '', loading: false });
              }}
              className="px-4 py-2 glass-card hover:bg-white/10 rounded-lg text-sm"
            >
              Crea altro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
