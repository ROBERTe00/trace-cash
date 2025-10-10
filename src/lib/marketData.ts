// Market data API integration for live crypto and stock prices

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const YAHOO_FINANCE_PROXY = "https://query1.finance.yahoo.com/v8/finance/chart";

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: string;
}

// Map common crypto symbols to CoinGecko IDs
const cryptoIdMap: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
};

export const fetchCryptoPrice = async (symbol: string): Promise<MarketPrice | null> => {
  try {
    const cryptoId = cryptoIdMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${cryptoId}&vs_currencies=eur,usd&include_24hr_change=true`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const coinData = data[cryptoId];

    if (!coinData) return null;

    return {
      symbol: symbol.toUpperCase(),
      price: coinData.eur || coinData.usd || 0,
      change24h: coinData.eur_24h_change || coinData.usd_24h_change || 0,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching crypto price:", error);
    return null;
  }
};

export const fetchMultipleCryptoPrices = async (
  symbols: string[]
): Promise<Record<string, MarketPrice>> => {
  const uniqueSymbols = [...new Set(symbols)];
  const results: Record<string, MarketPrice> = {};

  await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      const price = await fetchCryptoPrice(symbol);
      if (price) {
        results[symbol.toUpperCase()] = price;
      }
    })
  );

  return results;
};

// Check if a symbol is likely a crypto
export const isCryptoSymbol = (symbol: string): boolean => {
  const upperSymbol = symbol.toUpperCase();
  return upperSymbol in cryptoIdMap || symbol.length <= 5;
};

// Fetch stock/ETF price from Yahoo Finance
export const fetchStockPrice = async (symbol: string): Promise<MarketPrice | null> => {
  try {
    const response = await fetch(
      `${YAHOO_FINANCE_PROXY}/${symbol}?interval=1d&range=1d`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) return null;

    const price = result.meta?.regularMarketPrice;
    const previousClose = result.meta?.chartPreviousClose;
    const change24h = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      price: price || 0,
      change24h,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching stock price:", error);
    return null;
  }
};

// Auto-detect and fetch price for any symbol
export const fetchAssetPrice = async (symbol: string, category: string): Promise<MarketPrice | null> => {
  if (category === "Crypto" || isCryptoSymbol(symbol)) {
    return fetchCryptoPrice(symbol);
  } else if (category === "ETF" || category === "Stocks") {
    return fetchStockPrice(symbol);
  }
  return null;
};

// Fetch all asset prices
export const fetchAllAssetPrices = async (
  assets: Array<{ symbol?: string; category: string }>
): Promise<Record<string, MarketPrice>> => {
  const results: Record<string, MarketPrice> = {};

  await Promise.all(
    assets
      .filter((asset) => asset.symbol)
      .map(async (asset) => {
        const price = await fetchAssetPrice(asset.symbol!, asset.category);
        if (price) {
          results[asset.symbol!.toUpperCase()] = price;
        }
      })
  );

  return results;
};
