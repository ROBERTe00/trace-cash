// React hook for financial data integration
import { useQuery } from '@tanstack/react-query';
import { financialDataIntegration } from '@/integrations/financial-data';
import type { FinancialDataResult } from '@/integrations/financial-data';

interface UseFinancialDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  symbols?: {
    stocks?: string[];
    crypto?: string[];
  };
}

/**
 * Hook to fetch all financial data (stocks, crypto, news, forex) simultaneously
 */
export function useFinancialData(options: UseFinancialDataOptions = {}) {
  const {
    enabled = true,
    refetchInterval = 1000 * 60 * 15, // 15 minutes
    symbols = {},
  } = options;

  return useQuery<FinancialDataResult>({
    queryKey: ['financial-data', symbols],
    queryFn: async () => {
      console.log('[useFinancialData] Query started, enabled:', enabled);
      
      // Timeout wrapper (30 seconds for multiple API calls)
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout after 30s')), 30000)
      );

      const dataPromise = (async () => {
        const data = await financialDataIntegration.initializeDataConnections();
        
        // Override with custom symbols if provided
        if (symbols.stocks && symbols.stocks.length > 0) {
          data.stocks = await financialDataIntegration.fetchStockData(symbols.stocks);
        }
        
        if (symbols.crypto && symbols.crypto.length > 0) {
          data.crypto = await financialDataIntegration.fetchCryptoData(symbols.crypto);
        }
        
        console.log('[useFinancialData] Data fetched:', {
          stocks: Object.keys(data.stocks || {}).length,
          crypto: Object.keys(data.crypto || {}).length,
          news: data.news?.length || 0,
          forex: data.forex?.length || 0
        });
        
        return data;
      })();

      return await Promise.race([dataPromise, timeoutPromise]);
    },
    enabled,
    refetchInterval,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch only stock/ETF data
 */
export function useStockData(symbols: string[] = ['SWDA.MI', 'EIMI.MI', 'IUSQ.MI'], enabled = true) {
  return useQuery({
    queryKey: ['stock-data', symbols],
    queryFn: () => financialDataIntegration.fetchStockData(symbols),
    enabled,
    refetchInterval: 1000 * 60 * 10, // 10 minutes
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}

/**
 * Hook to fetch only crypto data
 */
export function useCryptoData(symbols: string[] = ['BTC', 'ETH', 'SOL'], enabled = true) {
  return useQuery({
    queryKey: ['crypto-data', symbols],
    queryFn: () => financialDataIntegration.fetchCryptoData(symbols),
    enabled,
    refetchInterval: 1000 * 60 * 5, // 5 minutes (crypto moves fast)
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
}

/**
 * Hook to fetch financial news
 */
export function useFinancialNews(enabled = true) {
  return useQuery({
    queryKey: ['financial-news'],
    queryFn: () => financialDataIntegration.fetchFinancialNews(),
    enabled,
    refetchInterval: 1000 * 60 * 60, // 1 hour
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook to fetch forex rates
 */
export function useForexRates(currencies: string[] = ['EUR', 'USD', 'GBP', 'JPY'], enabled = true) {
  return useQuery({
    queryKey: ['forex-rates', currencies],
    queryFn: () => financialDataIntegration.fetchForexRates(currencies),
    enabled,
    refetchInterval: 1000 * 60 * 30, // 30 minutes
    staleTime: 1000 * 60 * 15,
    retry: 2,
  });
}

