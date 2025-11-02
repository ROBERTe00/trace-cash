import { useForexRates } from '@/hooks/useFinancialData';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Equal
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ForexRatesWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: rates, isLoading, error, refetch } = useForexRates(['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD'], true);

  useEffect(() => {
    console.log('[ForexRatesWidget] Render - isLoading:', isLoading, 'rates:', rates?.length || 0, 'error:', !!error);
  }, [isLoading, rates, error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state
  if (isLoading && !rates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Forex Rates</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !rates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Forex Rates</h3>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Errore nel caricamento</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!rates || rates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Forex Rates</h3>
          </div>
        </div>
        <div className="text-center py-8">
          <Globe className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
        </div>
      </div>
    );
  }

  // Calculate previous rates for comparison (mock - in real app would fetch historical)
  const getPreviousRate = (currentRate: number) => {
    // Simulate small variation (±2%)
    const variation = (Math.random() - 0.5) * 0.04;
    return currentRate * (1 + variation);
  };

  const formatCurrency = (code: string) => {
    const flags: Record<string, string> = {
      'USD': '🇺🇸',
      'GBP': '🇬🇧',
      'JPY': '🇯🇵',
      'CHF': '🇨🇭',
      'CAD': '🇨🇦',
      'EUR': '🇪🇺'
    };
    return flags[code] || '💱';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 via-emerald-600 to-teal-500 flex items-center justify-center shadow-lg"
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Globe className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold">Forex Rates</h3>
            <p className="text-xs text-muted-foreground">Base: EUR</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Aggiorna tassi"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Rates List */}
      <div className="space-y-2">
        <AnimatePresence>
          {rates.map((rate, index) => {
            const previousRate = getPreviousRate(rate.rate);
            const change = ((rate.rate - previousRate) / previousRate) * 100;
            const isPositive = change >= 0;
            const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
            const bgGradient = isPositive
              ? 'from-green-500/20 to-emerald-500/10'
              : 'from-red-500/20 to-rose-500/10';

            return (
              <motion.div
                key={`${rate.from}-${rate.to}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  group relative overflow-hidden
                  p-4 rounded-xl
                  bg-gradient-to-r ${bgGradient}
                  border border-white/10
                  hover:border-white/20
                  transition-all duration-300
                  hover:shadow-lg hover:shadow-green-500/10
                  hover:scale-[1.02]
                `}
              >
                {/* Background glow */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100
                  bg-gradient-to-r ${bgGradient}
                  blur-xl transition-opacity duration-300
                `} />

                <div className="relative flex items-center justify-between">
                  {/* Left: Currency Pair */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">{formatCurrency(rate.to)}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-base">
                        {rate.from} / {rate.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tasso di cambio
                      </div>
                    </div>
                  </div>

                  {/* Right: Rate & Change */}
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg mb-1">
                      {rate.rate.toLocaleString('it-IT', { 
                        minimumFractionDigits: 4, 
                        maximumFractionDigits: 4 
                      })}
                    </div>
                    <div className={`flex items-center gap-1 justify-end text-sm font-medium ${changeColor}`}>
                      {Math.abs(change) < 0.01 ? (
                        <Equal className="w-4 h-4 text-gray-400" />
                      ) : isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>
                        {Math.abs(change) < 0.01 ? '0.00' : `${isPositive ? '+' : ''}${change.toFixed(2)}`}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
                  <motion.div
                    className={`h-full ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.abs(change) * 100)}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {rates.length} valute • Aggiornato {new Date().toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

