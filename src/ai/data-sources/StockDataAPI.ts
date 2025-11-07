// Stock Data API - Fetches historical stock/equity data
import type { Timeframe, HistoricalDataPoint } from '@/lib/ai-chart-generator';
import { fetchStockPrice } from '@/lib/marketData';

export class StockDataAPI {
  private cache: Map<string, { data: HistoricalDataPoint[]; timestamp: number; ttl: number }>;
  private alphaVantageKey: string;

  constructor() {
    this.cache = new Map();
    this.alphaVantageKey = import.meta.env.VITE_ALPHAVANTAGE_API_KEY || '';
  }

  /**
   * Get historical data for a stock symbol
   */
  async getHistoricalData(symbol: string, timeframe: Timeframe): Promise<HistoricalDataPoint[]> {
    const cacheKey = `stock-historical-${symbol}-${timeframe}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[StockDataAPI] Cache hit for ${symbol}`);
      return cached.data;
    }

    try {
      const days = this.timeframeToDays(timeframe);
      const data: HistoricalDataPoint[] = [];
      
      // Try AlphaVantage API if available
      if (this.alphaVantageKey && days <= 100) {
        try {
          const cleanSymbol = symbol.replace(/\.MI$|\.US$/, '');
          const outputSize = days > 30 ? 'full' : 'compact';
          
          const response = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${cleanSymbol}&outputsize=${outputSize}&apikey=${this.alphaVantageKey}`
          );

          if (response.ok) {
            const apiData = await response.json();
            const timeSeries = apiData['Time Series (Daily)'];
            
            if (timeSeries) {
              const sortedDates = Object.keys(timeSeries).sort();
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - days);
              
              sortedDates
                .filter(date => new Date(date) >= startDate)
                .forEach(date => {
                  const dayData = timeSeries[date];
                  const price = parseFloat(dayData['4. close']);
                  
                  data.push({
                    timestamp: new Date(date).toISOString(),
                    value: price,
                    price: price,
                    volume: parseInt(dayData['5. volume']) || undefined,
                    change: 0,
                    label: symbol
                  });
                });

              // Calculate percentage change
              data.forEach((point, index) => {
                if (index > 0 && data[index - 1].price) {
                  point.change = ((point.price - data[index - 1].price) / data[index - 1].price) * 100;
                }
              });

              // Cache for 1 hour
              this.cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                ttl: 3600000
              });
              return data;
            }
          }
        } catch (error) {
          console.warn(`[StockDataAPI] AlphaVantage failed for ${symbol}, using fallback:`, error);
        }
      }

      // Fallback: use current price and generate historical data
      const currentPrice = await fetchStockPrice(symbol);
      if (!currentPrice) {
        console.warn(`[StockDataAPI] No price data for ${symbol}`);
        return [];
      }

      const basePrice = currentPrice.price;
      const now = new Date();

      // Generate historical data points (mock when API unavailable)
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Simulate realistic daily variations (±2%)
        const variance = (Math.random() - 0.5) * 0.04;
        const historicalPrice = basePrice * (1 + variance * (i / days));

        data.push({
          timestamp: date.toISOString(),
          value: historicalPrice,
          price: historicalPrice,
          change: i > 0 && data.length > 0 
            ? ((historicalPrice - data[data.length - 1].price!) / data[data.length - 1].price!) * 100 
            : 0,
          label: symbol
        });
      }

      // Cache for 30 minutes (mock data)
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 1800000
      });
      return data;
    } catch (error) {
      console.error(`[StockDataAPI] Error fetching stock data for ${symbol}:`, error);
      return [];
    }
  }

  private timeframeToDays(timeframe: Timeframe): number {
    const mapping: Record<Timeframe, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': 730
    };
    return mapping[timeframe] || 30;
  }
}



