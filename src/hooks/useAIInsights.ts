import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAIInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    console.log('[useAIInsights] Fetching insights');
    setIsLoading(true);
    try {
      // Timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 15s')), 15000)
      );

      const dataPromise = supabase.functions.invoke('generate-ai-insights', {
        body: { scope: 'dashboard' }
      });

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]);
      
      if (error) {
        console.error('[useAIInsights] Error fetching insights:', error);
        setInsights([]);
      } else if (data) {
        const insightsData = data.insights || [];
        console.log(`[useAIInsights] Fetched ${insightsData.length} insights`);
        setInsights(insightsData);
      } else {
        console.log('[useAIInsights] No data returned');
        setInsights([]);
      }
    } catch (error) {
      console.error('[useAIInsights] Exception:', error);
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { 
    console.log('[useAIInsights] Component mounted, fetching insights');
    fetchInsights(); 
  }, [fetchInsights]);
  
  return { insights, isLoading, refetchInsights: fetchInsights };
}

