import { useFinancialData } from '@/hooks/useFinancialData';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketItem {
  symbol: string;
  price: number;
  change24h: number;
  type: 'stock' | 'crypto';
}

export function MarketOverviewWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useFinancialData({
    symbols: {
      stocks: ['SWDA.MI', 'EIMI.MI', 'IUSQ.MI'],
      crypto: ['BTC', 'ETH', 'SOL']
    },
    refetchInterval: 1000 * 60 * 5, // 5 minuti
    enabled: true
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    console.log('[MarketOverviewWidget] Render - isLoading:', isLoading, 'data:', !!data, 'stocks:', Object.keys(data?.stocks || {}).length, 'crypto:', Object.keys(data?.crypto || {}).length, 'error:', !!error);
  }, [isLoading, data, error]);

  // Combine stocks and crypto into a single list
  const marketItems: MarketItem[] = [
    ...Object.entries(data?.stocks || {}).map(([symbol, stock]) => ({
      symbol,
      price: stock.price,
      change24h: stock.change24h,
      type: 'stock' as const
    })),
    ...Object.entries(data?.crypto || {}).map(([symbol, crypto]) => ({
      symbol,
      price: crypto.price,
      change24h: crypto.change24h,
      type: 'crypto' as const
    }))
  ];

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Market Overview</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Market Overview</h3>
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
  if (marketItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Market Overview</h3>
              <p className="text-xs text-muted-foreground">Tempo reale</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
            title="Aggiorna dati"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {error ? 'Errore nel caricamento dei dati di mercato' : 'Caricamento dati di mercato...'}
          </p>
          {error && (
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs text-primary hover:underline"
            >
              Riprova
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-lg"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <BarChart3 className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold">Market Overview</h3>
            <p className="text-xs text-muted-foreground">Tempo reale</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Aggiorna dati"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Market Items */}
      <div className="space-y-2">
        <AnimatePresence>
          {marketItems.map((item, index) => {
            const isPositive = item.change24h >= 0;
            const changeColor = isPositive 
              ? 'text-green-400' 
              : 'text-red-400';
            const bgGradient = isPositive
              ? 'from-green-500/20 to-emerald-500/10'
              : 'from-red-500/20 to-rose-500/10';

            return (
              <motion.div
                key={item.symbol}
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
                  hover:shadow-lg hover:shadow-purple-500/10
                  hover:scale-[1.02]
                `}
              >
                {/* Background glow effect */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100
                  bg-gradient-to-r ${bgGradient}
                  blur-xl transition-opacity duration-300
                `} />

                <div className="relative flex items-center justify-between">
                  {/* Left: Symbol & Type */}
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${item.type === 'crypto' 
                        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                        : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                      }
                      group-hover:scale-110 transition-transform
                    `}>
                      {item.type === 'crypto' ? (
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-base">{item.symbol}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {item.type === 'crypto' ? 'Crypto' : 'ETF'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Change */}
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg mb-1">
                      €{item.price.toLocaleString('it-IT', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    <div className={`flex items-center gap-1 justify-end text-sm font-medium ${changeColor}`}>
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini progress bar showing change magnitude */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
                  <motion.div
                    className={`h-full ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.abs(item.change24h) * 10)}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="pt-2 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Stocks</div>
            <div className="text-sm font-semibold">
              {Object.keys(data?.stocks || {}).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Crypto</div>
            <div className="text-sm font-semibold">
              {Object.keys(data?.crypto || {}).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Aggiornato</div>
            <div className="text-sm font-semibold text-green-400">Live</div>
          </div>
        </div>
      </div>
    </div>
  );
}

