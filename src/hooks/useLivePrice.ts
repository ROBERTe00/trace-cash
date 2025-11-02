import { useState, useEffect } from 'react';
import { fetchAssetPrice, MarketPrice } from '@/lib/marketData';
import { apiService } from '@/services/api-service';

export function useLivePrice(symbol: string | undefined, type: string | undefined, enabled = true, useApi = true) {
  const [price, setPrice] = useState<MarketPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol || !type || !enabled) {
      setPrice(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        let result: MarketPrice | null = null;

        // Try API service first if enabled
        if (useApi) {
          try {
            const assetType = type === 'Crypto' ? 'crypto' : type === 'ETF' ? 'etf' : 'stocks';
            const apiData = await apiService.getMarketData([symbol], assetType);
            result = apiData[symbol.toUpperCase()] || null;
            
            if (result) {
              console.log(`[useLivePrice] Got price from API for ${symbol}`);
            }
          } catch (apiError) {
            console.warn(`[useLivePrice] API service failed for ${symbol}, using fallback:`, apiError);
          }
        }

        // Fallback to existing method if API didn't return data
        if (!result) {
          result = await fetchAssetPrice(symbol, type);
          if (result) {
            console.log(`[useLivePrice] Got price from fallback for ${symbol}`);
          }
        }

        if (result) {
          setPrice(result);
        } else {
          setError('Prezzo non disponibile');
        }
      } catch (err) {
        setError('Errore nel recupero del prezzo');
        console.error('Error fetching price:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce: wait 500ms before fetching
    const timeoutId = setTimeout(fetchPrice, 500);

    return () => clearTimeout(timeoutId);
  }, [symbol, type, enabled, useApi]);

  return { price, loading, error };
}
