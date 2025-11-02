// Financial Data Integration Service
// Centralized service for fetching financial data from multiple providers
import { apiService } from '@/services/api-service';
import { fetchCryptoPrice, fetchStockPrice } from '@/lib/marketData';
import { getExchangeRate } from '@/lib/currencyConverter';
import { supabase } from '@/integrations/supabase/client';

interface ProviderConfig {
  stocks: 'AlphaVantage' | 'YahooFinance';
  crypto: 'CoinGecko' | 'API';
  forex: 'ExchangeRate';
  news: 'NewsAPI';
}

interface FinancialNews {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  impactScore?: number;
}

interface ForexRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

interface StockData {
  symbol: string;
  price: number;
  change24h: number;
  volume?: number;
  lastUpdate: string;
}

interface FinancialDataResult {
  stocks: Record<string, StockData>;
  crypto: Record<string, StockData>;
  forex?: ForexRate[];
  news: FinancialNews[];
}

class FinancialDataIntegration {
  private providers: ProviderConfig;
  private alphaVantageKey: string;

  constructor() {
    this.providers = {
      stocks: 'AlphaVantage', // API gratuita (500 calls/day)
      crypto: 'CoinGecko',     // API gratuita
      forex: 'ExchangeRate',  // API gratuita
      news: 'NewsAPI'
    };
    
    this.alphaVantageKey = import.meta.env.VITE_ALPHAVANTAGE_API_KEY || '';
  }

  /**
   * Initialize data connections to all providers simultaneously
   */
  async initializeDataConnections(): Promise<FinancialDataResult> {
    console.log('[FinancialData] Initializing connections to all providers...');
    
    // Connessione simultanea a multiple API
    const [stocks, crypto, news, forex] = await Promise.all([
      this.fetchStockData(),
      this.fetchCryptoData(),
      this.fetchFinancialNews(),
      this.fetchForexRates(['EUR', 'USD', 'GBP', 'JPY']).catch(() => null)
    ]);

    return { stocks, crypto, news, forex: forex || undefined };
  }

  /**
   * Fetch stock/ETF data using AlphaVantage or fallback to Yahoo Finance
   * Example for European ETFs on Italian Stock Exchange
   */
  async fetchStockData(
    symbols: string[] = ['SWDA.MI', 'EIMI.MI', 'IUSQ.MI']
  ): Promise<Record<string, StockData>> {
    console.log(`[FinancialData] Fetching stock data for: ${symbols.join(', ')}`);

    if (this.providers.stocks === 'AlphaVantage' && this.alphaVantageKey) {
      try {
        return await this.fetchAlphaVantageStocks(symbols);
      } catch (error) {
        console.warn('[FinancialData] AlphaVantage failed, falling back to API service:', error);
      }
    }

    // Fallback: Use API service (which falls back to Yahoo Finance)
    try {
      const prices = await apiService.getMarketData(symbols, 'stocks');
      
      return Object.entries(prices).reduce((acc, [symbol, data]) => {
        acc[symbol] = {
          symbol: data.symbol,
          price: data.price,
          change24h: data.change24h,
          lastUpdate: data.lastUpdate,
        };
        return acc;
      }, {} as Record<string, StockData>);
    } catch (error) {
      console.error('[FinancialData] Stock data fetch failed:', error);
      return {};
    }
  }

  /**
   * Fetch stock data from AlphaVantage API
   */
  private async fetchAlphaVantageStocks(symbols: string[]): Promise<Record<string, StockData>> {
    const results: Record<string, StockData> = {};

    // AlphaVantage has rate limits, so we batch requests
    for (const symbol of symbols.slice(0, 5)) { // Limit to 5 to avoid rate limits
      try {
        // Remove exchange suffix for AlphaVantage (e.g., SWDA.MI -> SWDA)
        // Note: AlphaVantage might need different symbol format
        const cleanSymbol = symbol.replace(/\.MI$/, '');
        
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${this.alphaVantageKey}`
        );

        if (!response.ok) continue;

        const data = await response.json();
        
        // Check for API error messages
        if (data['Error Message'] || data['Note']) {
          console.warn(`[FinancialData] AlphaVantage API error for ${symbol}:`, data['Error Message'] || data['Note']);
          continue;
        }

        const quote = data['Global Quote'];

        if (quote && quote['05. price']) {
          const price = parseFloat(quote['05. price']);
          const previousClose = parseFloat(quote['08. previous close']) || price;
          const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;

          results[symbol.toUpperCase()] = {
            symbol: symbol.toUpperCase(),
            price,
            change24h: changePercent,
            volume: parseInt(quote['06. volume']) || undefined,
            lastUpdate: quote['07. latest trading day'] || new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error(`[FinancialData] AlphaVantage error for ${symbol}:`, error);
      }

      // Small delay to respect rate limits (5 calls per minute for free tier)
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds between calls
      }
    }

    return results;
  }

  /**
   * Fetch crypto data using CoinGecko or API service
   */
  async fetchCryptoData(
    symbols: string[] = ['BTC', 'ETH', 'SOL']
  ): Promise<Record<string, StockData>> {
    console.log(`[FinancialData] Fetching crypto data for: ${symbols.join(', ')}`);

    if (this.providers.crypto === 'CoinGecko') {
      try {
        const prices = await Promise.all(
          symbols.map(symbol => fetchCryptoPrice(symbol, 'EUR'))
        );

        return prices.reduce((acc, price, index) => {
          if (price) {
            acc[symbols[index].toUpperCase()] = {
              symbol: price.symbol,
              price: price.price,
              change24h: price.change24h,
              lastUpdate: price.lastUpdate,
            };
          }
          return acc;
        }, {} as Record<string, StockData>);
      } catch (error) {
        console.warn('[FinancialData] CoinGecko failed, using API service:', error);
      }
    }

    // Fallback to API service
    try {
      const prices = await apiService.getMarketData(symbols, 'crypto');
      
      return Object.entries(prices).reduce((acc, [symbol, data]) => {
        acc[symbol] = {
          symbol: data.symbol,
          price: data.price,
          change24h: data.change24h,
          lastUpdate: data.lastUpdate,
        };
        return acc;
      }, {} as Record<string, StockData>);
    } catch (error) {
      console.error('[FinancialData] Crypto data fetch failed:', error);
      return {};
    }
  }

  /**
   * Fetch forex exchange rates
   */
  async fetchForexRates(
    currencies: string[] = ['EUR', 'USD', 'GBP', 'JPY']
  ): Promise<ForexRate[]> {
    console.log(`[FinancialData] Fetching forex rates for: ${currencies.join(', ')}`);

    try {
      const baseCurrency = 'EUR';
      const rates: ForexRate[] = [];

      for (const currency of currencies) {
        if (currency === baseCurrency) continue;

        try {
          const rate = await getExchangeRate(baseCurrency, currency);
          rates.push({
            from: baseCurrency,
            to: currency,
            rate,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error(`[FinancialData] Forex error for ${currency}:`, error);
        }
      }

      return rates;
    } catch (error) {
      console.error('[FinancialData] Forex fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch financial news from NewsAPI (via Supabase edge function)
   */
  async fetchFinancialNews(): Promise<FinancialNews[]> {
    console.log('[FinancialData] Fetching financial news...');

    try {
      const { data, error } = await supabase.functions.invoke('fetch-filtered-news');

      if (error) {
        console.error('[FinancialData] News fetch error:', error);
        return [];
      }

      const articles = data?.news || [];
      
      return articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        impactScore: article.impactScore,
      }));
    } catch (error) {
      console.error('[FinancialData] News fetch failed:', error);
      return [];
    }
  }

  /**
   * Update provider configuration
   */
  setProvider(service: keyof ProviderConfig, provider: string): void {
    if (service in this.providers) {
      (this.providers as any)[service] = provider;
      console.log(`[FinancialData] Provider for ${service} set to ${provider}`);
    }
  }

  /**
   * Get current provider configuration
   */
  getProviders(): ProviderConfig {
    return { ...this.providers };
  }
}

// Export singleton instance
export const financialDataIntegration = new FinancialDataIntegration();

// Export types
export type { FinancialDataResult, FinancialNews, ForexRate, StockData, ProviderConfig };

