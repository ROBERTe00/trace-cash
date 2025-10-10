// Market data API integration for live crypto and stock prices

const COINGECKO_API = "https://api.coingecko.com/api/v3";

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
