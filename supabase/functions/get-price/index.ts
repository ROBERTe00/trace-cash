// Supabase Edge Function: get-price
// Fetch current stock/ETF prices (Yahoo) server-side to avoid CORS. Returns EUR-convertible payload.

interface ReqBody {
  symbols: string[];
  type?: 'stocks' | 'etf';
}

type OutMap = Record<string, {
  price: number;
  currency: string;
  change24h?: number;
  lastUpdate: string;
}>;

const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart';

async function fetchOne(symbol: string): Promise<{ price: number; currency: string; change24h?: number; lastUpdate: string } | null> {
  try {
    const url = `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { 'cache-control': 'no-store' } });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const price = Number(result.meta?.regularMarketPrice) || 0;
    const prev = Number(result.meta?.chartPreviousClose) || 0;
    const change24h = prev ? ((price - prev) / prev) * 100 : 0;
    const currency = String(result.meta?.currency || 'USD');
    return { price, currency, change24h, lastUpdate: new Date().toISOString() };
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const { symbols = [] } = (await req.json()) as ReqBody;
    const out: OutMap = {};
    for (const s of symbols) {
      const r = await fetchOne(s);
      if (r) out[s.toUpperCase()] = r;
    }
    return new Response(JSON.stringify({ data: out }), {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=60',
      },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ data: {}, error: String(e) }), {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      status: 200,
    });
  }
}

// Deno entry
// @ts-ignore
addEventListener('fetch', (event: any) => {
  event.respondWith(handler(event.request));
});


