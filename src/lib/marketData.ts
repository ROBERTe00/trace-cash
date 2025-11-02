// Market data API integration for live crypto and stock prices
import { convertCurrency } from "./currencyConverter";
import { apiService } from "@/services/api-service";

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

export const fetchCryptoPrice = async (symbol: string, targetCurrency: string = 'EUR'): Promise<MarketPrice | null> => {
  try {
    const cryptoId = cryptoIdMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${cryptoId}&vs_currencies=eur,usd&include_24hr_change=true`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const coinData = data[cryptoId];

    if (!coinData) return null;

    // Prefer EUR if targeting EUR, otherwise use USD and convert
    let price = coinData.eur || 0;
    let change24h = coinData.eur_24h_change || 0;

    // If EUR not available or target is different, use USD and convert
    if (!coinData.eur && coinData.usd && targetCurrency === 'EUR') {
      price = await convertCurrency(coinData.usd, 'USD', 'EUR');
      change24h = coinData.usd_24h_change || 0;
      console.log(`💱 [Crypto] Converted ${symbol}: $${coinData.usd} → ${price.toFixed(2)} EUR`);
    } else if (coinData.eur && targetCurrency !== 'EUR') {
      price = await convertCurrency(coinData.eur, 'EUR', targetCurrency);
      console.log(`💱 [Crypto] Converted ${symbol}: €${coinData.eur} → ${price.toFixed(2)} ${targetCurrency}`);
    }

    return {
      symbol: symbol.toUpperCase(),
      price,
      change24h,
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
export const fetchStockPrice = async (symbol: string, targetCurrency: string = 'EUR'): Promise<MarketPrice | null> => {
  try {
    const response = await fetch(
      `${YAHOO_FINANCE_PROXY}/${symbol}?interval=1d&range=1d`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) return null;

    let price = result.meta?.regularMarketPrice || 0;
    const previousClose = result.meta?.chartPreviousClose;
    const change24h = previousClose ? ((price - previousClose) / previousClose) * 100 : 0;
    const stockCurrency = result.meta?.currency || 'USD';

    // Convert to target currency if needed
    if (stockCurrency !== targetCurrency) {
      price = await convertCurrency(price, stockCurrency, targetCurrency);
      console.log(`💱 [Stock] ${symbol}: ${result.meta?.regularMarketPrice} ${stockCurrency} → ${price.toFixed(2)} ${targetCurrency}`);
    }

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
export const fetchAssetPrice = async (symbol: string, type: string): Promise<MarketPrice | null> => {
  if (type === "Crypto" || isCryptoSymbol(symbol)) {
    return fetchCryptoPrice(symbol);
  } else if (type === "ETF" || type === "Stock") {
    return fetchStockPrice(symbol);
  }
  return null;
};

// Fetch all asset prices
export const fetchAllAssetPrices = async (
  assets: Array<{ symbol?: string; type: string }>
): Promise<Record<string, MarketPrice>> => {
  const results: Record<string, MarketPrice> = {};

  await Promise.all(
    assets
      .filter((asset) => asset.symbol)
      .map(async (asset) => {
        const price = await fetchAssetPrice(asset.symbol!, asset.type);
        if (price) {
          results[asset.symbol!.toUpperCase()] = price;
        }
      })
  );

  return results;
};

// Enhanced fetch function that tries API service first, then falls back
export const fetchMarketDataViaAPI = async (
  symbols: string[],
  type: 'stocks' | 'crypto' | 'etf' = 'stocks'
): Promise<Record<string, MarketPrice>> => {
  try {
    // Try API service first
    const apiData = await apiService.getMarketData(symbols, type);
    
    // If we got data for all symbols, return it
    const missingSymbols = symbols.filter(
      s => !apiData[s.toUpperCase()]
    );
    
    if (missingSymbols.length === 0) {
      return apiData;
    }

    // Fetch missing symbols using fallback
    console.log(`[MarketData] Fetching ${missingSymbols.length} missing symbols via fallback`);
    const fallbackData = await Promise.all(
      missingSymbols.map(async (symbol) => {
        const assetType = type === 'crypto' ? 'Crypto' : type === 'etf' ? 'ETF' : 'Stock';
        const price = await fetchAssetPrice(symbol, assetType);
        return price ? { [symbol.toUpperCase()]: price } : {};
      })
    ).then(results => 
      results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    );

    return { ...apiData, ...fallbackData };
  } catch (error) {
    console.error('[MarketData] API service failed, using full fallback:', error);
    // Full fallback
    return Promise.all(
      symbols.map(async (symbol) => {
        const assetType = type === 'crypto' ? 'Crypto' : type === 'etf' ? 'ETF' : 'Stock';
        const price = await fetchAssetPrice(symbol, assetType);
        return price ? { [symbol.toUpperCase()]: price } : {};
      })
    ).then(results => 
      results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    );
  }
};
