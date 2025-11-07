// ETF Data API - Fetches historical ETF data (extends StockDataAPI)
import { StockDataAPI } from './StockDataAPI';
import type { Timeframe, HistoricalDataPoint } from '@/lib/ai-chart-generator';

export class ETFDataAPI extends StockDataAPI {
  /**
   * ETF-specific historical data fetching
   * Uses same API as stocks but may include ETF-specific processing
   */
  async getHistoricalData(symbol: string, timeframe: Timeframe): Promise<HistoricalDataPoint[]> {
    // ETF use same API as stocks, but we can add ETF-specific logic here
    const data = await super.getHistoricalData(symbol, timeframe);
    
    // Could add ETF-specific processing here (e.g., dividend adjustments)
    return data.map(point => ({
      ...point,
      label: point.label?.replace(/\.MI$/, ' ETF') || symbol
    }));
  }
}



