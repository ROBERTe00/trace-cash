import { useState, useEffect } from 'react';
import { fetchAssetPrice, MarketPrice } from '@/lib/marketData';

export function useLivePrice(symbol: string | undefined, type: string | undefined, enabled = true) {
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
        const result = await fetchAssetPrice(symbol, type);
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
  }, [symbol, type, enabled]);

  return { price, loading, error };
}
