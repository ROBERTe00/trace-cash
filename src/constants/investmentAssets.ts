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
];

export const POPULAR_STOCKS: AssetSuggestion[] = [
  { symbol: "AAPL", name: "Apple Inc.", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "Stocks", exchange: "NASDAQ" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", type: "Stocks", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "Stocks", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", type: "Stocks", exchange: "NYSE" },
];

export const ALL_ASSETS = [...POPULAR_CRYPTOS, ...POPULAR_ETFS, ...POPULAR_STOCKS];

export function searchAssets(query: string, limit = 10): AssetSuggestion[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  return ALL_ASSETS.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(lowerQuery) ||
      asset.name.toLowerCase().includes(lowerQuery)
  ).slice(0, limit);
}
