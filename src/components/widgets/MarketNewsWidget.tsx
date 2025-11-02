import { useFinancialNews } from '@/hooks/useFinancialData';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  RefreshCw, 
  Newspaper,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function MarketNewsWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: news, isLoading, error, refetch } = useFinancialNews(true);

  useEffect(() => {
    console.log('[MarketNewsWidget] Render - isLoading:', isLoading, 'news:', news?.length || 0, 'error:', !!error);
  }, [isLoading, news, error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state
  if (isLoading && !news) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Financial News</h3>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !news) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold">Financial News</h3>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
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

  // Empty state - show header always, content conditionally
  if (!news || news.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Financial News</h3>
              <p className="text-xs text-muted-foreground">Caricamento news...</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
            title="Aggiorna news"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-center py-8">
          <Newspaper className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {error ? 'Errore nel caricamento delle news' : 'Nessuna news disponibile al momento'}
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

  // Filter high impact news (impact score >= 6)
  const highImpactNews = news.filter(article => (article.impactScore || 0) >= 6);
  const displayedNews = highImpactNews.length > 0 ? highImpactNews : news.slice(0, 3);

  const getImpactColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 8) return 'text-red-400';
    if (score >= 6) return 'text-orange-400';
    return 'text-blue-400';
  };

  const getImpactBadge = (score?: number) => {
    if (!score || score < 6) return null;
    if (score >= 8) return '🔥 Critico';
    if (score >= 6) return '⚠️ Alto';
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 flex items-center justify-center shadow-lg"
            animate={{ 
              rotate: [0, -5, 5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Newspaper className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold">Financial News</h3>
            <p className="text-xs text-muted-foreground">
              {highImpactNews.length > 0 ? `${highImpactNews.length} high-impact` : 'Ultime news'}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Aggiorna news"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* News Items */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {displayedNews.map((article, index) => {
            const impactScore = article.impactScore || 0;
            const impactColor = getImpactColor(impactScore);
            const impactBadge = getImpactBadge(impactScore);
            const isHighImpact = impactScore >= 6;

            return (
              <motion.a
                key={`${article.url}-${index}`}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  group block p-4 rounded-xl
                  bg-gradient-to-r ${isHighImpact 
                    ? 'from-orange-500/20 to-red-500/10 border border-orange-500/30' 
                    : 'from-blue-500/20 to-cyan-500/10 border border-blue-500/20'
                  }
                  hover:border-white/30
                  transition-all duration-300
                  hover:shadow-lg hover:shadow-blue-500/10
                  hover:scale-[1.02]
                  cursor-pointer
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="flex items-start gap-2 mb-2">
                      <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </h4>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>

                    {/* Description */}
                    {article.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {article.publishedAt 
                            ? new Date(article.publishedAt).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Recent'
                          }
                        </span>
                      </div>
                      {article.source && (
                        <span className="text-muted-foreground">• {article.source}</span>
                      )}
                      {impactBadge && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${impactColor} bg-current/10`}>
                          {impactBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Impact Score */}
                  {impactScore > 0 && (
                    <div className={`flex-shrink-0 text-right ${impactColor}`}>
                      <div className="text-lg font-bold">{impactScore}</div>
                      <div className="text-xs opacity-70">Impact</div>
                    </div>
                  )}
                </div>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {news.length > displayedNews.length && (
        <div className="pt-2 border-t border-white/10 text-center">
          <p className="text-xs text-muted-foreground">
            Mostrati {displayedNews.length} di {news.length} articoli
          </p>
        </div>
      )}
    </div>
  );
}

