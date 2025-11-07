// Real Data Connector - Integrazione completa con multiple API finanziarie
import { StockDataAPI } from '@/ai/data-sources/StockDataAPI';
import { CryptoDataAPI } from '@/ai/data-sources/CryptoDataAPI';
import { ETFDataAPI } from '@/ai/data-sources/ETFDataAPI';
import { apiService } from '@/services/api-service';
import { fetchCryptoPrice, fetchStockPrice } from '@/lib/marketData';
import { supabase } from '@/integrations/supabase/client';
import type { Timeframe, HistoricalDataPoint } from '@/lib/ai-chart-generator';

// Types
export interface MarketDataEnriched {
  symbol: string;
  price: number;
  change24h: number;
  volume?: number;
  marketCap?: number;
  timestamp: string;
  // Enriched data
  fundamentals?: Fundamentals;
  news?: FinancialNews[];
  technicalAnalysis?: TechnicalAnalysis;
  peers?: PeerComparison[];
}

export interface Fundamentals {
  peRatio?: number;
  marketCap?: number;
  dividendYield?: number;
  earningsPerShare?: number;
  revenue?: number;
  profitMargin?: number;
  debtToEquity?: number;
  sector?: string;
  industry?: string;
}

export interface TechnicalAnalysis {
  rsi?: number; // Relative Strength Index
  macd?: { signal: number; histogram: number };
  movingAverages?: {
    sma50?: number;
    sma200?: number;
  };
  support?: number;
  resistance?: number;
  trend?: 'bullish' | 'bearish' | 'neutral';
}

export interface PeerComparison {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  similarity?: number; // 0-1 score
}

export interface FinancialNews {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  impactScore?: number;
  relatedSymbol?: string;
}

export interface MarketDataResult {
  timestamp: string;
  data: MarketDataEnriched[];
  metadata: {
    symbols: string[];
    period: string;
    source: 'multiple_apis';
    enriched: boolean;
  };
}

// AlphaVantage API wrapper
class AlphaVantageAPI {
  private apiKey: string;
  private baseURL = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ALPHAVANTAGE_API_KEY || '';
  }

  async getTimeSeries(symbol: string, period: string): Promise<HistoricalDataPoint[]> {
    if (!this.apiKey) {
      console.warn('[AlphaVantageAPI] No API key provided');
      return [];
    }

    try {
      const stockDataAPI = new StockDataAPI();
      const timeframe = this.periodToTimeframe(period);
      return await stockDataAPI.getHistoricalData(symbol, timeframe);
    } catch (error) {
      console.error(`[AlphaVantageAPI] Error for ${symbol}:`, error);
      return [];
    }
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    if (!this.apiKey) return null;

    try {
      // AlphaVantage OVERVIEW endpoint
      const response = await fetch(
        `${this.baseURL}?function=OVERVIEW&symbol=${symbol.replace(/\.MI$|\.US$/, '')}&apikey=${this.apiKey}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data['Error Message'] || data['Note']) return null;

      return {
        peRatio: data['PERatio'] ? parseFloat(data['PERatio']) : undefined,
        marketCap: data['MarketCapitalization'] ? parseFloat(data['MarketCapitalization']) : undefined,
        dividendYield: data['DividendYield'] ? parseFloat(data['DividendYield']) : undefined,
        earningsPerShare: data['EPS'] ? parseFloat(data['EPS']) : undefined,
        revenue: data['RevenueTTM'] ? parseFloat(data['RevenueTTM']) : undefined,
        profitMargin: data['ProfitMargin'] ? parseFloat(data['ProfitMargin']) : undefined,
        debtToEquity: data['DebtToEquity'] ? parseFloat(data['DebtToEquity']) : undefined,
        sector: data['Sector'],
        industry: data['Industry']
      };
    } catch (error) {
      console.error(`[AlphaVantageAPI] Fundamentals error for ${symbol}:`, error);
      return null;
    }
  }

  private periodToTimeframe(period: string): Timeframe {
    const mapping: Record<string, Timeframe> = {
      '1d': '1D',
      '1w': '1W',
      '1m': '1M',
      '3m': '3M',
      '6m': '6M',
      '1y': '1Y',
      'all': 'ALL'
    };
    return mapping[period.toLowerCase()] || '1M';
  }
}

// CoinGecko API wrapper
class CoinGeckoAPI {
  private baseURL = 'https://api.coingecko.com/api/v3';

  async getHistoricalData(symbol: string, period: string): Promise<HistoricalDataPoint[]> {
    try {
      const cryptoDataAPI = new CryptoDataAPI();
      const timeframe = this.periodToTimeframe(period);
      return await cryptoDataAPI.getHistoricalData(symbol, timeframe);
    } catch (error) {
      console.error(`[CoinGeckoAPI] Error for ${symbol}:`, error);
      return [];
    }
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    try {
      const cryptoIdMap: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        SOL: 'solana',
        XRP: 'ripple',
        ADA: 'cardano',
        DOGE: 'dogecoin',
        DOT: 'polkadot',
        MATIC: 'matic-network',
        AVAX: 'avalanche-2',
        LINK: 'chainlink',
        UNI: 'uniswap',
        ATOM: 'cosmos',
        LTC: 'litecoin'
      };

      const cryptoId = cryptoIdMap[symbol.toUpperCase()] || symbol.toLowerCase();
      
      const response = await fetch(
        `${this.baseURL}/coins/${cryptoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const marketData = data.market_data;

      return {
        marketCap: marketData?.market_cap?.eur,
        profitMargin: undefined, // Crypto doesn't have traditional fundamentals
        sector: 'Cryptocurrency',
        industry: data.categories?.[0] || 'Digital Asset'
      };
    } catch (error) {
      console.error(`[CoinGeckoAPI] Fundamentals error for ${symbol}:`, error);
      return null;
    }
  }

  private periodToTimeframe(period: string): Timeframe {
    const mapping: Record<string, Timeframe> = {
      '1d': '1D',
      '1w': '1W',
      '1m': '1M',
      '3m': '3M',
      '6m': '6M',
      '1y': '1Y',
      'all': 'ALL'
    };
    return mapping[period.toLowerCase()] || '1M';
  }
}

// News API wrapper
class NewsAPI {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_NEWS_API_KEY || '';
  }

  async getRelatedNews(symbol: string, limit: number = 5): Promise<FinancialNews[]> {
    try {
      // Use Supabase edge function for news
      const { data, error } = await supabase.functions.invoke('fetch-filtered-news', {
        body: { query: symbol, limit }
      });

      if (error || !data?.news) {
        return [];
      }

      return data.news.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        impactScore: article.impactScore,
        relatedSymbol: symbol
      }));
    } catch (error) {
      console.error(`[NewsAPI] Error fetching news for ${symbol}:`, error);
      return [];
    }
  }
}

// Economic Data API wrapper
class EconomicDataAPI {
  private baseURL = 'https://api.stlouisfed.org/fred'; // FRED API for economic data

  async getEconomicIndicators(): Promise<any[]> {
    // TODO: Implement economic indicators (GDP, inflation, etc.)
    // Requires FRED API key or alternative
    return [];
  }
}

// Main RealDataConnector class
export class RealDataConnector {
  private apis: {
    stocks: AlphaVantageAPI;
    crypto: CoinGeckoAPI;
    etf: ETFDataAPI;
    news: NewsAPI;
    economic: EconomicDataAPI;
  };

  constructor() {
    const alphaVantageKey = import.meta.env.VITE_ALPHAVANTAGE_API_KEY || '';
    const newsApiKey = import.meta.env.VITE_NEWS_API_KEY || '';

    this.apis = {
      stocks: new AlphaVantageAPI(alphaVantageKey),
      crypto: new CoinGeckoAPI(),
      etf: new ETFDataAPI(),
      news: new NewsAPI(newsApiKey),
      economic: new EconomicDataAPI()
    };
  }

  /**
   * Get market data for multiple symbols with enrichment
   */
  async getMarketData(
    symbols: string[],
    period: string = '1y'
  ): Promise<MarketDataResult> {
    console.log(`[RealDataConnector] Fetching market data for ${symbols.length} symbols...`);

    const data = await Promise.all(
      symbols.map(symbol => this.fetchSymbolData(symbol, period))
    );

    return {
      timestamp: new Date().toISOString(),
      data: data.filter((item): item is MarketDataEnriched => item !== null),
      metadata: {
        symbols,
        period,
        source: 'multiple_apis',
        enriched: true
      }
    };
  }

  /**
   * Fetch data for a single symbol
   */
  async fetchSymbolData(
    symbol: string,
    period: string
  ): Promise<MarketDataEnriched | null> {
    try {
      let priceData: { price: number; change24h: number; volume?: number; lastUpdate: string };
      let historicalData: HistoricalDataPoint[] = [];

      // Determine data source and fetch base data
      if (this.isCrypto(symbol)) {
        const cryptoPrice = await fetchCryptoPrice(symbol, 'EUR');
        if (!cryptoPrice) return null;
        
        priceData = {
          price: cryptoPrice.price,
          change24h: cryptoPrice.change24h,
          lastUpdate: cryptoPrice.lastUpdate
        };

        historicalData = await this.apis.crypto.getHistoricalData(symbol, period);
      } else if (this.isETF(symbol)) {
        historicalData = await this.apis.etf.getHistoricalData(symbol, period);
        const stockPrice = await fetchStockPrice(symbol, 'EUR');
        
        if (!stockPrice) return null;

        priceData = {
          price: stockPrice.price,
          change24h: stockPrice.change24h,
          lastUpdate: stockPrice.lastUpdate
        };
      } else {
        // Stock
        historicalData = await this.apis.stocks.getTimeSeries(symbol, period);
        const stockPrice = await fetchStockPrice(symbol, 'EUR');
        
        if (!stockPrice) return null;

        priceData = {
          price: stockPrice.price,
          change24h: stockPrice.change24h,
          lastUpdate: stockPrice.lastUpdate
        };
      }

      // Enrich with additional data (parallel fetching)
      const [fundamentals, news, technicalAnalysis, peers] = await Promise.all([
        this.getFundamentals(symbol),
        this.getRelatedNews(symbol),
        this.getTechnicalAnalysis(historicalData),
        this.getPeerComparison(symbol)
      ]);

      return {
        symbol: symbol.toUpperCase(),
        price: priceData.price,
        change24h: priceData.change24h,
        volume: priceData.volume,
        timestamp: priceData.lastUpdate,
        fundamentals,
        news,
        technicalAnalysis,
        peers
      };
    } catch (error) {
      console.error(`[RealDataConnector] Failed to fetch data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get fundamentals for a symbol
   */
  private async getFundamentals(symbol: string): Promise<Fundamentals | undefined> {
    try {
      if (this.isCrypto(symbol)) {
        return await this.apis.crypto.getFundamentals(symbol) || undefined;
      } else {
        return await this.apis.stocks.getFundamentals(symbol) || undefined;
      }
    } catch (error) {
      console.warn(`[RealDataConnector] Fundamentals fetch failed for ${symbol}:`, error);
      return undefined;
    }
  }

  /**
   * Get related news for a symbol
   */
  private async getRelatedNews(symbol: string): Promise<FinancialNews[]> {
    try {
      return await this.apis.news.getRelatedNews(symbol, 5);
    } catch (error) {
      console.warn(`[RealDataConnector] News fetch failed for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Calculate technical analysis indicators
   */
  private async getTechnicalAnalysis(
    historicalData: HistoricalDataPoint[]
  ): Promise<TechnicalAnalysis | undefined> {
    if (historicalData.length < 14) return undefined; // Need at least 14 points for RSI

    try {
      const prices = historicalData.map(d => d.price).filter((p): p is number => p !== undefined && p !== null);
      
      if (prices.length < 14) return undefined;

      // Calculate RSI (Relative Strength Index)
      const rsi = this.calculateRSI(prices);

      // Calculate MACD
      const macd = this.calculateMACD(prices);

      // Calculate Moving Averages
      const sma50 = prices.length >= 50 
        ? prices.slice(-50).reduce((sum, p) => sum + p, 0) / 50 
        : undefined;
      const sma200 = prices.length >= 200
        ? prices.slice(-200).reduce((sum, p) => sum + p, 0) / 200
        : undefined;

      // Determine trend
      const trend = this.determineTrend(prices, sma50, sma200);

      // Calculate support and resistance
      const support = Math.min(...prices.slice(-20));
      const resistance = Math.max(...prices.slice(-20));

      return {
        rsi,
        macd,
        movingAverages: { sma50, sma200 },
        support,
        resistance,
        trend
      };
    } catch (error) {
      console.warn('[RealDataConnector] Technical analysis calculation failed:', error);
      return undefined;
    }
  }

  /**
   * Get peer comparison
   */
  private async getPeerComparison(symbol: string): Promise<PeerComparison[]> {
    try {
      // Define peer groups (could be enhanced with sector/industry matching)
      const peerGroups: Record<string, string[]> = {
        'BTC': ['ETH', 'SOL', 'XRP'],
        'ETH': ['BTC', 'SOL', 'ADA'],
        'TSLA': ['AAPL', 'MSFT', 'GOOGL'],
        'AAPL': ['MSFT', 'GOOGL', 'AMZN'],
        'MSFT': ['AAPL', 'GOOGL', 'AMZN'],
        'GOOGL': ['MSFT', 'AAPL', 'META'],
        'AMZN': ['AAPL', 'MSFT', 'META'],
        'META': ['GOOGL', 'AAPL', 'AMZN']
      };

      const peers = peerGroups[symbol.toUpperCase()] || [];
      if (peers.length === 0) return [];

      // Fetch peer prices
      const peerData = await Promise.all(
        peers.map(async (peerSymbol) => {
          const isCrypto = this.isCrypto(peerSymbol);
          const price = isCrypto 
            ? await fetchCryptoPrice(peerSymbol, 'EUR')
            : await fetchStockPrice(peerSymbol, 'EUR');

          if (!price) return null;

          return {
            symbol: peerSymbol.toUpperCase(),
            name: peerSymbol, // Could fetch real name
            price: price.price,
            change24h: price.change24h,
            similarity: 0.8 // Placeholder - could calculate based on correlation
          };
        })
      );

      return peerData.filter((p): p is PeerComparison => p !== null);
    } catch (error) {
      console.warn(`[RealDataConnector] Peer comparison failed for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50; // Neutral

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD
   */
  private calculateMACD(prices: number[]): { signal: number; histogram: number } | undefined {
    if (prices.length < 26) return undefined;

    const ema12 = this.calculateEMA(prices.slice(-12), 12);
    const ema26 = this.calculateEMA(prices.slice(-26), 26);
    const macdLine = ema12 - ema26;

    // Signal line (9-period EMA of MACD)
    const signal = ema12 * 0.2 + ema26 * 0.8; // Simplified
    const histogram = macdLine - signal;

    return { signal, histogram };
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Determine trend from prices and moving averages
   */
  private determineTrend(
    prices: number[],
    sma50?: number,
    sma200?: number
  ): 'bullish' | 'bearish' | 'neutral' {
    const currentPrice = prices[prices.length - 1];
    
    if (sma50 && sma200) {
      if (currentPrice > sma50 && sma50 > sma200) return 'bullish';
      if (currentPrice < sma50 && sma50 < sma200) return 'bearish';
    }

    // Simple trend based on recent prices
    const recent = prices.slice(-5);
    const older = prices.slice(-10, -5);
    
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.02) return 'bullish';
      if (recentAvg < olderAvg * 0.98) return 'bearish';
    }

    return 'neutral';
  }

  /**
   * Check if symbol is cryptocurrency
   */
  private isCrypto(symbol: string): boolean {
    const cryptoList = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'LTC', 'USDT', 'BNB'];
    return cryptoList.includes(symbol.toUpperCase());
  }

  /**
   * Check if symbol is ETF
   */
  private isETF(symbol: string): boolean {
    // Common ETF patterns
    return symbol.includes('.MI') || 
           symbol.includes('ETF') || 
           ['SWDA', 'EIMI', 'IUSQ'].includes(symbol.toUpperCase());
  }
}

// Export singleton instance
export const realDataConnector = new RealDataConnector();



