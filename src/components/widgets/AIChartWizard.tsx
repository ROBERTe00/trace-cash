import { useState, useRef } from 'react';
import { Bot, BarChart3, PieChart, LineChart, TrendingUp, Sparkles, AlertCircle, Lightbulb, Download, Save } from 'lucide-react';
import { Chart } from 'react-chartjs-2';
import { aiChartGenerator, exportChartAsImage, exportChartAsPDF, type Timeframe, type ChartType } from '@/lib/ai-chart-generator';
import { saveChartToDashboard } from '@/lib/widgetApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { registerChartJS } from '@/lib/chartRegistry';

// Register Chart.js components (centralized)
registerChartJS();

interface ChartConfig {
  type: ChartType;
  prompt: string;
  loading: boolean;
  data?: any;
  options?: any;
  aiInsights?: Array<{
    type: string;
    message: string;
    confidence: number;
    relevance: string;
  }>;
  error?: string;
}

export function AIChartWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<ChartConfig>({
    type: 'line',
    prompt: '',
    loading: false
  });
  const [savingChart, setSavingChart] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const chartTypes = [
    { id: 'line', icon: LineChart, label: 'Linea', desc: 'Mostra trend nel tempo' },
    { id: 'bar', icon: BarChart3, label: 'Barre', desc: 'Confronto tra categorie' },
    { id: 'doughnut', icon: PieChart, label: 'Torta', desc: 'Distribuzione percentuale' },
    { id: 'area', icon: TrendingUp, label: 'Area', desc: 'Cumulativo nel tempo' },
  ];
  
  // Helper functions per estrarre informazioni dal prompt
  const extractSymbolsFromPrompt = (prompt: string): string[] => {
    const symbols: string[] = [];
    
    // Pattern per crypto (BTC, ETH, SOL, etc.)
    const cryptoPattern = /\b(BTC|ETH|SOL|XRP|ADA|DOGE|DOT|MATIC|AVAX|LINK|UNI|ATOM|LTC)\b/gi;
    const cryptoMatches = prompt.match(cryptoPattern);
    if (cryptoMatches) {
      symbols.push(...cryptoMatches.map(s => s.toUpperCase()));
    }
    
    // Pattern per stock/ETF (SWDA.MI, AAPL, MSFT, etc.)
    const stockPattern = /\b([A-Z]{2,5}(\.MI|\.US)?)\b/g;
    const stockMatches = prompt.match(stockPattern);
    if (stockMatches) {
      symbols.push(...stockMatches);
    }
    
    return [...new Set(symbols)]; // Rimuove duplicati
  };

  const extractTimeframeFromPrompt = (prompt: string): Timeframe => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('oggi') || lowerPrompt.includes('today')) return '1D';
    if (lowerPrompt.includes('settimana') || lowerPrompt.includes('week') || lowerPrompt.includes('ultimi 7 giorni')) return '1W';
    if (lowerPrompt.includes('mese') || lowerPrompt.includes('month') || lowerPrompt.includes('ultimi 30 giorni')) return '1M';
    if (lowerPrompt.includes('3 mesi') || lowerPrompt.includes('3 months')) return '3M';
    if (lowerPrompt.includes('6 mesi') || lowerPrompt.includes('6 months')) return '6M';
    if (lowerPrompt.includes('anno') || lowerPrompt.includes('year') || lowerPrompt.includes('ultimo anno')) return '1Y';
    if (lowerPrompt.includes('tutti') || lowerPrompt.includes('all')) return 'ALL';
    
    return '1M'; // Default
  };

  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;
    
    setConfig(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Devi essere autenticato per generare grafici');
      }

      // Estrai simboli e timeframe dal prompt
      const symbols = extractSymbolsFromPrompt(config.prompt);
      const timeframe = extractTimeframeFromPrompt(config.prompt);
      
      console.log('[AIChartWizard] Generating chart:', {
        type: config.type,
        timeframe,
        symbols,
        prompt: config.prompt
      });

      // Determina dataSource
      let dataSource: 'stocks' | 'crypto' | 'etf' | 'user_data' | 'mixed' = 'user_data';
      if (symbols.length > 0) {
        const hasCrypto = symbols.some(s => !s.includes('.'));
        const hasStocks = symbols.some(s => s.includes('.') || s.match(/^[A-Z]{2,5}$/));
        dataSource = hasCrypto && hasStocks ? 'mixed' : hasCrypto ? 'crypto' : 'stocks';
      }

      // Genera grafico con AI
      const result = await aiChartGenerator.generateSmartChart({
        type: config.type,
        timeframe,
        symbols: symbols.length > 0 ? symbols : undefined,
        userId: user.id,
        dataSource,
        prompt: config.prompt
      });

      if (!result.success || !result.chartConfig) {
        throw new Error('Errore nella generazione del grafico');
      }

      // Aggiorna configurazione con dati reali
      setConfig(prev => ({ 
        ...prev, 
        loading: false, 
        data: result.chartConfig.data,
        options: result.chartConfig.options,
        aiInsights: result.aiInsights
      }));
      
      setStep(3);
      toast.success('Grafico generato con successo!');
    } catch (error) {
      console.error('[AIChartWizard] Error generating chart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setConfig(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      toast.error(`Errore: ${errorMessage}`);
    }
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
            
            <div className="text-xs text-gray-400 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-1">
              <strong>Suggerimenti:</strong>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Per dati personali: "spese per categoria ultimo mese"</li>
                <li>Per crypto: "BTC, ETH ultimi 3 mesi"</li>
                <li>Per stock: "SWDA.MI, EIMI.MI ultimo anno"</li>
                <li>Supporta: 1D, 1W, 1M, 3M, 6M, 1Y, ALL</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Preview */}
      {step === 3 && (
        <div className="space-y-4">
          {config.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">Errore</p>
                <p className="text-xs text-red-300 mt-1">{config.error}</p>
              </div>
            </div>
          )}

          {config.data && (
            <div 
              id="chart-export-container"
              ref={chartRef}
              className="h-64 glass-card p-3"
            >
              <Chart 
                type={config.type === 'area' ? 'line' : config.type} 
                data={config.data} 
                options={config.options} 
              />
            </div>
          )}

          {/* AI Insights */}
          {config.aiInsights && config.aiInsights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Insights AI
              </div>
              <div className="space-y-2">
                {config.aiInsights.slice(0, 3).map((insight, index) => (
                  <div 
                    key={index}
                    className="p-3 glass-card rounded-lg border-l-2 border-purple-500/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-300 flex-1">{insight.message}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        insight.relevance === 'high' ? 'bg-red-500/20 text-red-400' :
                        insight.relevance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              onClick={async () => {
                setSavingChart(true);
                try {
                  await saveChartToDashboard(
                    { data: config.data, options: config.options },
                    {
                      title: config.prompt || `Grafico ${config.type}`,
                      type: config.type,
                      timeframe: extractTimeframeFromPrompt(config.prompt),
                      symbols: extractSymbolsFromPrompt(config.prompt),
                      prompt: config.prompt
                    }
                  );
                  toast.success('Grafico salvato nella dashboard!');
                } catch (error) {
                  console.error('Error saving chart:', error);
                  toast.error('Errore nel salvataggio del grafico');
                } finally {
                  setSavingChart(false);
                }
              }}
              disabled={savingChart || !config.data}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingChart ? 'Salvando...' : 'Salva in Dashboard'}
            </button>
            
            <button
              onClick={async () => {
                try {
                  await exportChartAsImage('chart-export-container', `grafico-${Date.now()}.png`);
                  toast.success('Grafico esportato come immagine!');
                } catch (error) {
                  console.error('Error exporting image:', error);
                  toast.error('Errore nell\'export dell\'immagine');
                }
              }}
              disabled={!config.data}
              className="px-4 py-2 glass-card hover:bg-white/10 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PNG
            </button>
            
            <button
              onClick={async () => {
                try {
                  await exportChartAsPDF(
                    'chart-export-container',
                    config.prompt || `Grafico ${config.type}`,
                    `grafico-${Date.now()}.pdf`
                  );
                  toast.success('Grafico esportato come PDF!');
                } catch (error) {
                  console.error('Error exporting PDF:', error);
                  toast.error('Errore nell\'export del PDF');
                }
              }}
              disabled={!config.data}
              className="px-4 py-2 glass-card hover:bg-white/10 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
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
