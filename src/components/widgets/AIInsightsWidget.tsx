import { Bot, RefreshCw } from "lucide-react";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useState, useEffect } from "react";

export function AIInsightsWidget() {
  const { insights, isLoading, refetchInsights } = useAIInsights();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('[AIInsightsWidget] Render - isLoading:', isLoading, 'insights:', insights?.length || 0);
  }, [isLoading, insights]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchInsights();
    setIsRefreshing(false);
  };

  if (isLoading || !insights || insights.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            Insights AI
          </h3>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl bg-white/5">
          <Bot className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
          <p className="text-sm font-medium text-white mb-1">
            {isLoading ? 'Generando insights...' : 'Nessun insight disponibile'}
          </p>
          {!isLoading && (
            <button
              onClick={handleRefresh}
              className="mt-3 text-xs text-purple-400 hover:text-purple-300 hover:underline"
            >
              Genera insights
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          Insights AI
        </h3>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
          title="Aggiorna insights"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-3">
        {insights.slice(0, 2).map((insight, idx) => (
          <div 
            key={idx}
            className={`p-3 border rounded-lg ${
              insight.type === 'positive' 
                ? 'bg-green-500/10 border-green-500/20' 
                : insight.type === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-blue-500/10 border-blue-500/20'
            }`}
          >
            <div className={`text-sm font-medium ${
              insight.type === 'positive' ? 'text-green-400' :
              insight.type === 'warning' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {insight.title}
            </div>
            <div className="text-xs text-gray-300 mt-1">{insight.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
