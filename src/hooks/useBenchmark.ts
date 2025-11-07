import { useEffect, useState } from 'react';
import { saveCache, loadCache } from '@/lib/offlineCache';
import { supabase } from '@/integrations/supabase/client';

export type BenchmarkId = 'SP500' | 'MSCI_WORLD' | 'NASDAQ100' | 'FTSE_MIB' | 'GOLD' | 'BTC' | 'CUSTOM';

const MAP: Record<BenchmarkId, { symbol: string; label: string }> = {
  SP500:      { symbol: '^GSPC',        label: 'S&P 500' },
  MSCI_WORLD: { symbol: 'URTH',         label: 'MSCI World (URTH)' },
  NASDAQ100:  { symbol: 'QQQ',          label: 'NASDAQ 100 (QQQ)' },
  FTSE_MIB:   { symbol: 'FTSEMIB.MI',   label: 'FTSE MIB' },
  GOLD:       { symbol: 'GC=F',         label: 'Gold' },
  BTC:        { symbol: 'BTC-USD',      label: 'Bitcoin' },
  CUSTOM:     { symbol: '',             label: 'Custom' },
};

export function useBenchmark(opts: { ids: BenchmarkId[]; months: number; customSymbols?: string[] }) {
  const { ids, months, customSymbols = [] } = opts;
  const [series, setSeries] = useState<{ id: string; label: string; data: number[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const key = `benchmarks:${ids.join(',')}:${months}:${customSymbols.join(',')}`;
    const cached = loadCache<typeof series>(key);
    if (cached) setSeries(cached);

    const fetchYahooMonthly = async (symbol: string, monthsBack: number): Promise<number[]> => {
      const range = monthsBack <= 12 ? '1y' : monthsBack <= 36 ? '3y' : '5y';
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1mo&range=${range}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Yahoo fetch failed: ${res.status}`);
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      const adj = result?.indicators?.adjclose?.[0]?.adjclose as number[] | undefined;
      const close = result?.indicators?.quote?.[0]?.close as number[] | undefined;
      const raw = (adj && adj.length ? adj : close) || [];
      const filtered = raw.filter((v: any) => typeof v === 'number' && isFinite(v));
      const take = Math.min(filtered.length, monthsBack);
      return filtered.slice(filtered.length - take);
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try edge function first
        let results: { id: string; label: string; data: number[] }[] = [];
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('get-benchmark', {
            body: { ids, months, customSymbols }
          });
          if (fnError) {
            console.warn('[Benchmark] Edge function error:', fnError);
            setError(fnError.message || 'Errore funzione benchmark');
          }
          results = fnData?.series || [];
          if (results.length) {
            console.log('[Benchmark] Edge series loaded:', results.map(s => ({ id: s.id, len: s.data?.length })));
          }
        } catch (e) {
          console.warn('[Benchmark] Edge invoke failed:', e);
          setError((e as Error)?.message || 'Invocazione benchmark fallita');
        }

        if (!results.length) {
          console.log('[Benchmark] Falling back to Yahoo client fetch');
          const targets = ids.map((id, idx) => {
            if (id === 'CUSTOM') {
              const sym = customSymbols[idx] || customSymbols[0] || '';
              return { id, symbol: sym, label: sym || 'Custom' };
            }
            const m = MAP[id];
            return { id, symbol: m.symbol, label: m.label };
          }).filter(t => t.symbol);

          results = [];
          for (const t of targets) {
            try {
              const prices = await fetchYahooMonthly(t.symbol, months);
              if (!prices || !prices.length) continue;
              const base = prices[0] || 1;
              const norm = prices.map((p: number) => (p / (base || 1)) * 100);
              const pad = months - norm.length;
              const data = pad > 0 ? [...norm, ...Array(pad).fill(norm[norm.length - 1])] : norm.slice(-months);
              results.push({ id: t.id, label: t.label, data });
            } catch {}
          }
          console.log('[Benchmark] Fallback series:', results.map(s => ({ id: s.id, len: s.data?.length })));
        }
        if (mounted) {
          if (!results.length) {
            const fallbackMsg = 'Benchmark non disponibile. Ritenta più tardi o scegli un altro indice.';
            console.warn('[Benchmark] Nessun dato disponibile dopo fallback');
            setError(prev => prev ?? fallbackMsg);
            setSeries([]);
          } else {
            setSeries(results);
            saveCache(key, results);
          }
        }
      } catch (err) {
        // offline: keep cached
        console.warn('[Benchmark] Unexpected error:', err);
        if (mounted) {
          setError((err as Error)?.message || 'Errore sconosciuto caricando benchmark');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [ids, months, customSymbols]);

  return { series, loading, error };
}


