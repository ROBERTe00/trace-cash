// Supabase Edge Function: get-benchmark
// Fetches monthly series from Yahoo Finance, normalizes to 100, pads/trims to requested months

interface ReqBody {
  ids: string[];
  months: number;
  customSymbols?: string[];
}

const MAP: Record<string, { symbol: string; label: string }> = {
  SP500:      { symbol: '^GSPC',      label: 'S&P 500' },
  MSCI_WORLD: { symbol: 'URTH',       label: 'MSCI World (URTH)' },
  NASDAQ100:  { symbol: 'QQQ',        label: 'NASDAQ 100 (QQQ)' },
  FTSE_MIB:   { symbol: 'FTSEMIB.MI', label: 'FTSE MIB' },
  GOLD:       { symbol: 'GC=F',       label: 'Gold' },
  BTC:        { symbol: 'BTC-USD',    label: 'Bitcoin' },
  CUSTOM:     { symbol: '',           label: 'Custom' },
};

const fetchYahooMonthly = async (symbol: string, months: number): Promise<number[]> => {
  const range = months <= 12 ? '1y' : months <= 36 ? '3y' : '5y';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1mo&range=${range}`;
  const res = await fetch(url, { headers: { 'cache-control': 'no-store' } });
  if (!res.ok) return [];
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const adj = result?.indicators?.adjclose?.[0]?.adjclose as number[] | undefined;
  const close = result?.indicators?.quote?.[0]?.close as number[] | undefined;
  const raw = (adj && adj.length ? adj : close) || [];
  const filtered = raw.filter((v: unknown) => typeof v === 'number' && isFinite(v as number)) as number[];
  if (!filtered.length) return [];
  const base = filtered[0] || 1;
  const norm = filtered.map(p => (p / (base || 1)) * 100);
  const pad = months - norm.length;
  return pad > 0 ? [...norm, ...Array(pad).fill(norm[norm.length - 1])] : norm.slice(-months);
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, apikey',
        'access-control-max-age': '86400',
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { ids = [], months = 12, customSymbols = [] } = body as ReqBody;
    const targets = ids.map((id, idx) => {
      if (id === 'CUSTOM') {
        const sym = customSymbols[idx] || customSymbols[0] || '';
        return { id, symbol: sym, label: sym || 'Custom' };
      }
      const m = MAP[id];
      return { id, symbol: m?.symbol || '', label: m?.label || id };
    }).filter(t => t.symbol);

    const out: { id: string; label: string; data: number[] }[] = [];
    for (const t of targets) {
      try {
        const data = await fetchYahooMonthly(t.symbol, months);
        if (data.length) out.push({ id: t.id, label: t.label, data });
      } catch {}
    }

    return new Response(JSON.stringify({ series: out }), {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, apikey',
        'cache-control': 'public, max-age=3600',
      },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ series: [], error: String(e) }), {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization, apikey',
      },
      status: 200,
    });
  }
}

// Deno deploy entry
// @ts-ignore - Supabase edge runtime expects default export
addEventListener('fetch', (event: any) => {
  event.respondWith(handler(event.request));
});


