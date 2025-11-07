export interface AssetSuggestion {
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
}

export const POPULAR_CRYPTOS: AssetSuggestion[] = [
  { symbol: "BTC", name: "Bitcoin", type: "Crypto" },
  { symbol: "ETH", name: "Ethereum", type: "Crypto" },
  { symbol: "BNB", name: "Binance Coin", type: "Crypto" },
  { symbol: "SOL", name: "Solana", type: "Crypto" },
  { symbol: "XRP", name: "Ripple", type: "Crypto" },
  { symbol: "ADA", name: "Cardano", type: "Crypto" },
  { symbol: "AVAX", name: "Avalanche", type: "Crypto" },
  { symbol: "DOT", name: "Polkadot", type: "Crypto" },
  { symbol: "MATIC", name: "Polygon", type: "Crypto" },
  { symbol: "LINK", name: "Chainlink", type: "Crypto" },
  { symbol: "UNI", name: "Uniswap", type: "Crypto" },
  { symbol: "ATOM", name: "Cosmos", type: "Crypto" },
  { symbol: "LTC", name: "Litecoin", type: "Crypto" },
  { symbol: "BCH", name: "Bitcoin Cash", type: "Crypto" },
  { symbol: "XLM", name: "Stellar", type: "Crypto" },
  { symbol: "DOGE", name: "Dogecoin", type: "Crypto" },
  { symbol: "SHIB", name: "Shiba Inu", type: "Crypto" },
  { symbol: "PEPE", name: "Pepe", type: "Crypto" },
  { symbol: "FLOKI", name: "Floki Inu", type: "Crypto" },
  { symbol: "APT", name: "Aptos", type: "Crypto" },
  { symbol: "ARB", name: "Arbitrum", type: "Crypto" },
  { symbol: "OP", name: "Optimism", type: "Crypto" },
  { symbol: "IMX", name: "Immutable X", type: "Crypto" },
  { symbol: "LDO", name: "Lido DAO", type: "Crypto" },
  { symbol: "MKR", name: "Maker", type: "Crypto" },
  { symbol: "AAVE", name: "Aave", type: "Crypto" },
  { symbol: "CRV", name: "Curve DAO", type: "Crypto" },
  { symbol: "USDT", name: "Tether", type: "Crypto" },
  { symbol: "USDC", name: "USD Coin", type: "Crypto" },
  { symbol: "DAI", name: "Dai", type: "Crypto" },
  { symbol: "FTM", name: "Fantom", type: "Crypto" },
  { symbol: "NEAR", name: "Near Protocol", type: "Crypto" },
  { symbol: "ALGO", name: "Algorand", type: "Crypto" },
  { symbol: "VET", name: "VeChain", type: "Crypto" },
  { symbol: "ICP", name: "Internet Computer", type: "Crypto" },
];

export const POPULAR_ETFS: AssetSuggestion[] = [
  { symbol: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", type: "ETF", exchange: "XETRA" },
  { symbol: "CSPX.L", name: "iShares Core S&P 500 UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "SWDA.L", name: "iShares Core MSCI World UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", type: "ETF", exchange: "AMS" },
  { symbol: "EQQQ.L", name: "Invesco EQQQ Nasdaq-100 UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "VUSA.L", name: "Vanguard S&P 500 UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "AGGH.MI", name: "iShares Core Global Aggregate Bond UCITS ETF", type: "ETF", exchange: "BIT" },
  { symbol: "IEMA.L", name: "iShares Core MSCI Emerging Markets IMI UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "EMIM.L", name: "iShares MSCI EM IMI UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "WTCH.L", name: "iShares MSCI World Information Technology Sector UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "IS3N.DE", name: "iShares NASDAQ 100 UCITS ETF", type: "ETF", exchange: "XETRA" },
  { symbol: "VEUR.AS", name: "Vanguard FTSE Developed Europe UCITS ETF", type: "ETF", exchange: "AMS" },
  { symbol: "IBTA.MI", name: "iShares € Corp Bond UCITS ETF", type: "ETF", exchange: "BIT" },
  { symbol: "IEGA.L", name: "iShares € Govt Bond UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "IEAG.L", name: "iShares Core € Govt Bond UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "TDIV.L", name: "iShares S&P 500 Info Tech Sector UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "EIMI.L", name: "iShares Core MSCI EM IMI UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "IDVY.L", name: "iShares Euro Dividend UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "VHYL.L", name: "Vanguard FTSE All-World High Div Yield UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "WSML.L", name: "iShares MSCI World Small Cap UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "RBOT.L", name: "iShares Automation & Robotics UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "HEAL.L", name: "iShares Healthcare Innovation UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "SPXP.L", name: "Invesco S&P 500 UCITS ETF", type: "ETF", exchange: "LSE" },
  { symbol: "XMWO.DE", name: "Xtrackers MSCI World UCITS ETF", type: "ETF", exchange: "XETRA" },
  { symbol: "JPGL.L", name: "JPMorgan Global Equity Multi-Factor UCITS ETF", type: "ETF", exchange: "LSE" },
];

export const POPULAR_STOCKS: AssetSuggestion[] = [
  { symbol: "AAPL", name: "Apple Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Stock", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stock", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "Stock", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "Stock", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "PYPL", name: "PayPal Holdings", type: "Stock", exchange: "NASDAQ" },
  { symbol: "ADBE", name: "Adobe Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "CRM", name: "Salesforce Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "INTC", name: "Intel Corporation", type: "Stock", exchange: "NASDAQ" },
  { symbol: "CSCO", name: "Cisco Systems", type: "Stock", exchange: "NASDAQ" },
  { symbol: "IBM", name: "IBM Corporation", type: "Stock", exchange: "NYSE" },
  { symbol: "ORCL", name: "Oracle Corporation", type: "Stock", exchange: "NYSE" },
  { symbol: "QCOM", name: "Qualcomm Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "SPOT", name: "Spotify Technology", type: "Stock", exchange: "NYSE" },
  { symbol: "UBER", name: "Uber Technologies", type: "Stock", exchange: "NYSE" },
  { symbol: "ABNB", name: "Airbnb Inc.", type: "Stock", exchange: "NASDAQ" },
  { symbol: "KO", name: "The Coca-Cola Company", type: "Stock", exchange: "NYSE" },
  { symbol: "MCD", name: "McDonald's Corporation", type: "Stock", exchange: "NYSE" },
  { symbol: "NKE", name: "Nike Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "SBUX", name: "Starbucks Corporation", type: "Stock", exchange: "NASDAQ" },
  { symbol: "DIS", name: "The Walt Disney Company", type: "Stock", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "HD", name: "The Home Depot", type: "Stock", exchange: "NYSE" },
  { symbol: "TGT", name: "Target Corporation", type: "Stock", exchange: "NYSE" },
  { symbol: "COST", name: "Costco Wholesale", type: "Stock", exchange: "NASDAQ" },
  { symbol: "BAC", name: "Bank of America", type: "Stock", exchange: "NYSE" },
  { symbol: "WFC", name: "Wells Fargo", type: "Stock", exchange: "NYSE" },
  { symbol: "GS", name: "Goldman Sachs", type: "Stock", exchange: "NYSE" },
  { symbol: "MS", name: "Morgan Stanley", type: "Stock", exchange: "NYSE" },
  { symbol: "AXP", name: "American Express", type: "Stock", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", type: "Stock", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group", type: "Stock", exchange: "NYSE" },
  { symbol: "ABBV", name: "AbbVie Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "TMO", name: "Thermo Fisher Scientific", type: "Stock", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil", type: "Stock", exchange: "NYSE" },
  { symbol: "CVX", name: "Chevron Corporation", type: "Stock", exchange: "NYSE" },
  { symbol: "BA", name: "Boeing Company", type: "Stock", exchange: "NYSE" },
  { symbol: "CAT", name: "Caterpillar Inc.", type: "Stock", exchange: "NYSE" },
  { symbol: "GE", name: "General Electric", type: "Stock", exchange: "NYSE" },
  { symbol: "SAP", name: "SAP SE", type: "Stock", exchange: "XETRA" },
  { symbol: "ASML", name: "ASML Holding", type: "Stock", exchange: "AMS" },
  { symbol: "NESN.SW", name: "Nestlé S.A.", type: "Stock", exchange: "SIX" },
  { symbol: "MC.PA", name: "LVMH", type: "Stock", exchange: "EPA" },
  { symbol: "OR.PA", name: "L'Oréal", type: "Stock", exchange: "EPA" },
  { symbol: "SAN.PA", name: "Sanofi", type: "Stock", exchange: "EPA" },
  { symbol: "VOW3.DE", name: "Volkswagen", type: "Stock", exchange: "XETRA" },
  { symbol: "SIE.DE", name: "Siemens AG", type: "Stock", exchange: "XETRA" },
];

export const ALL_ASSETS = [...POPULAR_CRYPTOS, ...POPULAR_ETFS, ...POPULAR_STOCKS];

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export function searchAssets(
  query: string,
  limit = 20,
  filterType?: 'ETF' | 'Crypto' | 'Stock' | 'Cash'
): AssetSuggestion[] {
  const q = norm(query);
  const pool = filterType
    ? ALL_ASSETS.filter(a => a.type === filterType)
    : ALL_ASSETS;

  if (!q || q.length < 2) {
    if (filterType === 'ETF') return POPULAR_ETFS.slice(0, limit);
    if (filterType === 'Crypto') return POPULAR_CRYPTOS.slice(0, limit);
    if (filterType === 'Stock') return POPULAR_STOCKS.slice(0, limit);
    const mix = [
      ...POPULAR_ETFS.slice(0, Math.ceil(limit/3)),
      ...POPULAR_CRYPTOS.slice(0, Math.ceil(limit/3)),
      ...POPULAR_STOCKS.slice(0, Math.ceil(limit/3)),
    ];
    const seen = new Set<string>();
    return mix.filter(a => (seen.has(a.symbol) ? false : (seen.add(a.symbol), true))).slice(0, limit);
  }

  type Scored = AssetSuggestion & { _score: number };
  const scored: Scored[] = pool.map(a => {
    const sym = norm(a.symbol);
    const nm = norm(a.name);
    let s = 0;
    if (sym === q || nm === q) s += 100;
    if (sym.startsWith(q)) s += 60;
    if (nm.startsWith(q)) s += 40;
    if (sym.includes(q)) s += 25;
    if (nm.includes(q)) s += 15;
    if (filterType && a.type === filterType) s += 5;
    return { ...a, _score: s };
  }).filter(a => a._score > 0);

  scored.sort((a, b) => b._score - a._score);
  const seen = new Set<string>();
  const result: AssetSuggestion[] = [];
  for (const a of scored) {
    if (!seen.has(a.symbol)) {
      seen.add(a.symbol);
      result.push({ symbol: a.symbol, name: a.name, type: a.type, exchange: a.exchange });
      if (result.length >= limit) break;
    }
  }
  return result;
}

// Basic classification logic for symbol/name -> type
export function classifyAsset(symbol?: string, name?: string): 'ETF' | 'Crypto' | 'Stock' | null {
  const sym = (symbol || '').toUpperCase();
  const nm = (name || '').toLowerCase();
  if (!sym && !nm) return null;
  // Exact lists
  if (POPULAR_CRYPTOS.some(a => a.symbol.toUpperCase() === sym) || nm.includes('coin') || nm.includes('token') || nm.includes('crypto')) {
    return 'Crypto';
  }
  if (
    POPULAR_ETFS.some(a => a.symbol.toUpperCase() === sym) ||
    nm.includes('ucits etf') || nm.endsWith('etf') || nm.includes('ucits') ||
    (sym.includes('.') && nm.includes('etf'))
  ) {
    return 'ETF';
  }
  if (POPULAR_STOCKS.some(a => a.symbol.toUpperCase() === sym)) {
    return 'Stock';
  }
  // Heuristics: exchange suffix (e.g., .L, .DE) spesso è equity/etf; se nome non parla di etf -> Stock
  if (sym.includes('.') && !nm.includes('etf')) return 'Stock';
  return null;
}