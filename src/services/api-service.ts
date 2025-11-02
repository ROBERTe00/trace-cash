// API Service for market data from mymoney.ai
import type { MarketPrice } from '@/lib/marketData';
import { fetchAssetPrice } from '@/lib/marketData';

interface MarketDataRequest {
  symbols: string[];
  type: 'stocks' | 'crypto' | 'etf';
}

interface MarketDataResponse {
  [symbol: string]: {
    price: number;
    change24h?: number;
    volume?: number;
    marketCap?: number;
    lastUpdate: string;
  };
}

class ApiService {
  private baseURL: string;
  private cache: Map<string, { data: MarketDataResponse; timestamp: number }>;
  private cacheTTL: number = 60000; // 1 minute cache

  constructor() {
    this.baseURL = import.meta.env.VITE_MYMONEY_API_URL || 'https://api.mymoney.ai';
    this.cache = new Map();
  }

  private getCacheKey(symbols: string[], type: string): string {
    return `${type}-${symbols.sort().join(',')}`;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTTL;
  }

  private async getFallbackData(symbols: string[], type: string): Promise<Record<string, MarketPrice>> {
    console.log(`[ApiService] Using fallback for ${type}: ${symbols.join(', ')}`);
    
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

  async getMarketData(
    symbols: string[], 
    type: 'stocks' | 'crypto' | 'etf' = 'stocks'
  ): Promise<Record<string, MarketPrice>> {
    if (!symbols || symbols.length === 0) {
      return {};
    }

    const cacheKey = this.getCacheKey(symbols, type);

    // Check cache
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log(`[ApiService] Cache hit for ${cacheKey}`);
      
      // Convert response format to MarketPrice format
      return Object.entries(cached.data).reduce((acc, [symbol, data]) => {
        acc[symbol] = {
          symbol: symbol.toUpperCase(),
          price: data.price,
          change24h: data.change24h || 0,
          lastUpdate: data.lastUpdate,
        };
        return acc;
      }, {} as Record<string, MarketPrice>);
    }

    try {
      const response = await fetch(`${this.baseURL}/market-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, type })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data: MarketDataResponse = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`[ApiService] Fetched fresh data for ${cacheKey}`);

      // Convert response format to MarketPrice format
      return Object.entries(data).reduce((acc, [symbol, marketData]) => {
        acc[symbol] = {
          symbol: symbol.toUpperCase(),
          price: marketData.price,
          change24h: marketData.change24h || 0,
          lastUpdate: marketData.lastUpdate || new Date().toISOString(),
        };
        return acc;
      }, {} as Record<string, MarketPrice>);

    } catch (error) {
      console.error('[ApiService] Market data fetch failed:', error);
      const fallbackData = await this.getFallbackData(symbols, type);
      
      // Cache fallback data too (shorter TTL)
      this.cache.set(cacheKey, {
        data: Object.entries(fallbackData).reduce((acc, [symbol, price]) => {
          acc[symbol] = {
            price: price.price,
            change24h: price.change24h,
            lastUpdate: price.lastUpdate,
          };
          return acc;
        }, {} as MarketDataResponse),
        timestamp: Date.now()
      });

      return fallbackData;
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
    console.log('[ApiService] Cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();

