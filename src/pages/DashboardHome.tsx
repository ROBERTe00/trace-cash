import { useEffect, useState, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import Sortable from 'sortablejs';
import { Edit, Settings, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Widget Components
import { FinancialHealthWidget } from "@/components/widgets/FinancialHealthWidget";
import { WealthTrendWidget } from "@/components/widgets/WealthTrendWidget";
import { ExpenseDistributionWidget } from "@/components/widgets/ExpenseDistributionWidget";
import { EnhancedWealthTrendWidget } from "@/components/widgets/EnhancedWealthTrendWidget";
import { EnhancedExpenseDistributionWidget } from "@/components/widgets/EnhancedExpenseDistributionWidget";
import { AIInsightsWidget } from "@/components/widgets/AIInsightsWidget";
import { EnhancedAIInsightsWidget } from "@/components/widgets/EnhancedAIInsightsWidget";
import { IncomeExpensesChartWidget } from "@/components/widgets/IncomeExpensesChartWidget";
import { RecentTransactionsWidget } from "@/components/widgets/RecentTransactionsWidget";
import { EnhancedRecentTransactionsWidget } from "@/components/widgets/EnhancedRecentTransactionsWidget";
import { SavingsRateWidget } from "@/components/widgets/SavingsRateWidget";
import { GoalsWidget } from "@/components/widgets/GoalsWidget";
import { QuickUploadWidget } from "@/components/widgets/QuickUploadWidget";
import { AIChartWizard } from "@/components/widgets/AIChartWizard";
import { MarketOverviewWidget } from "@/components/widgets/MarketOverviewWidget";
import { MarketNewsWidget } from "@/components/widgets/MarketNewsWidget";
import { ForexRatesWidget } from "@/components/widgets/ForexRatesWidget";

// API functions
import { saveWidgetLayout, loadWidgetLayout } from "@/lib/widgetApi";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WidgetConfig {
  [key: string]: {
    name: string;
    description: string;
    icon: string;
    size: 'single' | 'double';
    component: React.FC<any>;
  };
}

export default function DashboardHome() {
  const [editMode, setEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  // Initialize with default widgets to ensure they show immediately
  const [activeWidgets, setActiveWidgets] = useState<string[]>(['financial-health', 'wealth-trend', 'expense-distribution']);
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  // Widget definitions
  const availableWidgets: WidgetConfig = {
    'financial-health': {
      name: 'Saldo Principale',
      description: 'Il tuo saldo e health score',
      icon: '💚',
      size: 'double',
      component: FinancialHealthWidget
    },
    'wealth-trend': {
      name: 'Andamento Patrimoniale',
      description: 'Trend del tuo patrimonio',
      icon: '📈',
      size: 'single',
      component: EnhancedWealthTrendWidget // Using enhanced version with real data and export
    },
    'expense-distribution': {
      name: 'Distribuzione Spese',
      description: 'Come spendi i tuoi soldi',
      icon: '🥧',
      size: 'single',
      component: EnhancedExpenseDistributionWidget // Using enhanced version with real data and export
    },
    'ai-insights': {
      name: 'Insights AI',
      description: 'Suggerimenti intelligenti',
      icon: '🤖',
      size: 'single',
      component: EnhancedAIInsightsWidget // Using enhanced version with real-time updates
    },
    'income-expenses-chart': {
      name: 'Entrate vs Spese',
      description: 'Confronto mensile entrate e spese',
      icon: '📊',
      size: 'single',
      component: IncomeExpensesChartWidget
    },
    'recent-transactions': {
      name: 'Transazioni Recenti',
      description: 'Le tue ultime transazioni',
      icon: '💸',
      size: 'single',
      component: EnhancedRecentTransactionsWidget // Using enhanced version with real-time updates
    },
    'savings-rate': {
      name: 'Tasso di Risparmio',
      description: 'Quanto risparmi mensilmente',
      icon: '💰',
      size: 'single',
      component: SavingsRateWidget
    },
    'goals': {
      name: 'Obiettivi Finanziari',
      description: 'Traccia i tuoi obiettivi',
      icon: '🎯',
      size: 'single',
      component: GoalsWidget
    },
    'quick-upload': {
      name: 'Carica Documenti',
      description: 'PDF, CSV, foto estratti',
      icon: '📄',
      size: 'single',
      component: QuickUploadWidget
    },
    'ai-chart-builder': {
      name: 'Crea Grafico Personalizzato',
      description: 'Con AI assistant',
      icon: '✨',
      size: 'double',
      component: AIChartWizard
    },
    'market-overview': {
      name: 'Market Overview',
      description: 'Prezzi stocks e crypto in tempo reale',
      icon: '📊',
      size: 'single',
      component: MarketOverviewWidget
    },
    'market-news': {
      name: 'Financial News',
      description: 'Ultime news finanziarie ad alto impatto',
      icon: '📰',
      size: 'single',
      component: MarketNewsWidget
    },
    'forex-rates': {
      name: 'Forex Rates',
      description: 'Tassi di cambio principali',
      icon: '💱',
      size: 'single',
      component: ForexRatesWidget
    }
  };

  // Load layout from backend
  useEffect(() => {
    let isMounted = true;
    
    const loadLayout = async () => {
      try {
        setIsLoadingLayout(true);
        
        // Use Promise.race to timeout the operation (3 seconds max)
        const saved = await Promise.race([
          loadWidgetLayout(),
          new Promise<null>((resolve) => 
            setTimeout(() => {
              console.warn('[DashboardHome] Layout loading timeout, using default widgets');
              resolve(null);
            }, 3000)
          )
        ]);

        if (!isMounted) return;

        if (saved && saved.widget_order && Array.isArray(saved.widget_order) && saved.widget_order.length > 0) {
          // Filter out invalid widget IDs
          const widgetKeys = Object.keys(availableWidgets);
          const validWidgets = saved.widget_order.filter((id: string) => {
            return widgetKeys.includes(id);
          });
          if (validWidgets.length > 0) {
            setActiveWidgets(validWidgets);
          }
          // If no valid widgets, keep defaults (already set in useState)
        }
        // If no saved layout, defaults are already set in useState
      } catch (error) {
        if (!isMounted) return;
        console.error('[DashboardHome] Errore nel caricamento del layout:', error);
        // Keep defaults on error (already set in useState)
      } finally {
        if (isMounted) {
          setIsLoadingLayout(false);
        }
      }
    };
    
    loadLayout();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize drag and drop
  useEffect(() => {
    if (gridRef.current && editMode) {
      sortableRef.current = Sortable.create(gridRef.current, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          const newOrder = Array.from(gridRef.current!.children).map(child => {
            const widgetElement = child.querySelector('.widget');
            return widgetElement?.getAttribute('data-widget-id') || '';
          }).filter(Boolean);
          setActiveWidgets(newOrder);
          saveLayout(newOrder);
        }
      });
    }
    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
      }
    };
  }, [editMode, activeWidgets]);

  const saveLayout = async (widgets?: string[]) => {
    const widgetsToSave = widgets || activeWidgets;
    try {
      await saveWidgetLayout(widgetsToSave);
    } catch (error) {
      console.error('Errore nel salvataggio del layout:', error);
    }
  };

  const removeWidget = (widgetId: string) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId);
    setActiveWidgets(newWidgets);
    saveLayout(newWidgets);
    showNotificationMessage('Widget rimosso');
  };

  const addWidget = (widgetId: string) => {
    if (!activeWidgets.includes(widgetId)) {
      const newWidgets = [...activeWidgets, widgetId];
      setActiveWidgets(newWidgets);
      saveLayout(newWidgets);
      setShowWidgetLibrary(false);
      showNotificationMessage(`Widget "${availableWidgets[widgetId].name}" aggiunto!`);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      showNotificationMessage('Layout salvato!');
    } else {
      showNotificationMessage('Modalità modifica attiva');
    }
  };

  const showNotificationMessage = (message: string) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const getAvailableWidgets = () => {
    return Object.entries(availableWidgets).filter(([id]) => !activeWidgets.includes(id));
  };

  return (
    <div className={`min-h-screen bg-[#0F0F0F] text-white antialiased ${editMode ? 'edit-mode' : ''}`}>
      <style>{`
        .edit-mode {
          position: relative;
        }
        
        .edit-mode::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 95%, rgba(123, 47, 247, 0.1) 100%);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 10;
          opacity: 0.3;
        }
        
        .edit-mode .widget {
          cursor: grab;
          border: 2px dashed rgba(123, 47, 247, 0.3);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .edit-mode .widget:hover {
          border: 2px dashed #7B2FF7;
          transform: scale(1.02);
        }
        
        .edit-mode .widget:active {
          cursor: grabbing;
          transform: scale(1.05) rotate(2deg);
        }
        
        .sortable-ghost {
          opacity: 0.4;
          transform: scale(0.95);
          background: rgba(123, 47, 247, 0.1);
        }
        
        .widget-actions {
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .widget:hover .widget-actions {
          opacity: 1;
        }
      `}</style>

      {/* Navigation - removed (already in App.tsx) */}
      
      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-8 animate-[fadeIn_0.5s_ease-in-out]">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">La Tua Dashboard</h1>
              <p className="text-gray-400">Tutto sotto il tuo controllo</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowWidgetLibrary(true)}
                className="px-4 py-2 glass-card hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Aggiungi Widget
              </button>
              <button 
                onClick={toggleEditMode}
                className={`px-4 py-2 glass-card hover:bg-white/10 transition-all flex items-center gap-2 ${editMode ? 'bg-purple-600' : ''}`}
              >
                <Edit className="w-4 h-4" />
                {editMode ? 'Salva' : 'Personalizza'}
              </button>
            </div>
          </div>

          {/* Widgets Grid */}
          <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {isLoadingLayout ? (
              <div className="col-span-3 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-4">Caricamento dashboard...</p>
              </div>
            ) : activeWidgets.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">Nessun widget ancora</h3>
                <p className="text-gray-400 mb-4">Clicca "Aggiungi Widget" per iniziare</p>
                <button 
                  onClick={() => setShowWidgetLibrary(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Aggiungi il primo widget
                </button>
              </div>
            ) : (
              activeWidgets.map(widgetId => {
                const widgetConfig = availableWidgets[widgetId];
                if (!widgetConfig) {
                  console.warn(`[DashboardHome] Widget config not found for: ${widgetId}`);
                  return null;
                }
                
                const Component = widgetConfig.component;
                
                // Render widget with error handling
                return (
                  <div 
                    key={widgetId}
                    className={widgetConfig.size === 'double' ? 'lg:col-span-2' : ''}
                  >
                    <div className="widget interactive-widget glass-card p-6 relative animate-[fadeIn_0.5s_ease-in-out] min-h-[200px]" data-widget-id={widgetId}>
                      {(editMode || true) && (
                        <div className="widget-actions absolute top-4 right-4 flex gap-2 z-10">
                          <button 
                            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm hover:bg-white/20 transition-all" 
                            onClick={(e) => {
                              e.stopPropagation();
                              showNotificationMessage(`Configurazione per: ${widgetConfig.name}`);
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button 
                            className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-sm hover:bg-red-500/30 transition-all" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeWidget(widgetId);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {(() => {
                        try {
                          console.log(`[DashboardHome] Rendering widget: ${widgetId}`);
                          return <Component />;
                        } catch (error) {
                          console.error(`[DashboardHome] Error rendering widget ${widgetId}:`, error);
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              <p className="text-sm">Errore nel widget: {widgetConfig.name}</p>
                              <p className="text-xs mt-2">{String(error)}</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Widget Library Modal */}
      <AnimatePresence>
        {showWidgetLibrary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-[10px] flex items-center justify-center z-50 p-4"
            onClick={() => setShowWidgetLibrary(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A1A] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Aggiungi Widget</h2>
                <button 
                  onClick={() => setShowWidgetLibrary(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAvailableWidgets().map(([id, widget]) => (
                    <button
                      key={id}
                      onClick={() => addWidget(id)}
                      className="glass-card p-4 text-center hover:border-purple-500 transition-all"
                    >
                      <div className="text-2xl mb-3 text-purple-400">
                        {widget.icon}
                      </div>
                      <div className="font-semibold mb-2">{widget.name}</div>
                      <div className="text-xs text-gray-400">{widget.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 glass-card p-4 max-w-sm z-50 border border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-purple-400">ℹ️</span>
              <div className="text-sm">{showNotification}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}