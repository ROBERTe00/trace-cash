// AI Chart Generator Service
// Genera grafici intelligenti con analisi AI e dati real-time
import { StockDataAPI } from '@/ai/data-sources/StockDataAPI';
import { CryptoDataAPI } from '@/ai/data-sources/CryptoDataAPI';
import { ETFDataAPI } from '@/ai/data-sources/ETFDataAPI';
import { UserDataService } from '@/ai/data-sources/UserDataService';

export type ChartType = 'line' | 'bar' | 'doughnut' | 'area' | 'scatter';
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export interface ChartRequest {
  type: ChartType;
  timeframe: Timeframe;
  symbols?: string[];
  userId?: string;
  dataSource?: 'stocks' | 'crypto' | 'etf' | 'user_data' | 'mixed';
  prompt?: string; // Descrizione in linguaggio naturale
}

export interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  price?: number;
  volume?: number;
  change?: number;
  label?: string;
}

export interface PatternAnalysis {
  trends: Trend[];
  anomalies: Anomaly[];
  correlations: Correlation[];
  volatility: number;
  insights: ChartInsight[];
}

export interface Trend {
  direction: 'up' | 'down' | 'stable';
  strength: number; // percentuale
  confidence: number; // 0-1
  duration: string;
}

export interface Anomaly {
  type: 'spike' | 'drop' | 'volatility' | 'outlier';
  timestamp: string;
  value: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Correlation {
  symbols: string[];
  correlation: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
}

export interface ChartInsight {
  type: 'trend' | 'event' | 'warning' | 'opportunity';
  message: string;
  confidence: number;
  relevance: 'high' | 'medium' | 'low';
  timestamp?: string;
  data?: any;
}

export interface ChartConfig {
  type: ChartType;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
    }>;
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins?: {
      legend?: { display: boolean };
      tooltip?: { enabled: boolean };
      annotation?: any;
    };
    scales?: any;
  };
  annotations?: Array<{
    type: 'line' | 'point' | 'region';
    x: string | number;
    y?: number;
    label: string;
    color: string;
  }>;
}

export interface SmartChartResult {
  success: boolean;
  chartConfig: ChartConfig;
  data: HistoricalDataPoint[];
  aiInsights: ChartInsight[];
  patternAnalysis: PatternAnalysis;
  lastUpdated: string;
}

class AIChartGenerator {
  private dataSources: Map<string, StockDataAPI | CryptoDataAPI | ETFDataAPI | UserDataService>;
  private chartTemplates: Map<string, ChartConfig>;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor() {
    this.dataSources = new Map();
    this.chartTemplates = new Map();
    this.cache = new Map();
    this.initializeDataSources();
  }

  /**
   * Cache helper - salva dati con TTL
   */
  private cacheSet(key: string, data: any, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Cache helper - recupera dati se validi
   */
  private cacheGet(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private initializeDataSources() {
    // Inizializza i data source come istanze di classi
    this.dataSources.set('stocks', new StockDataAPI());
    this.dataSources.set('crypto', new CryptoDataAPI());
    this.dataSources.set('etf', new ETFDataAPI());
    this.dataSources.set('user_data', new UserDataService());
  }

  /**
   * Determina il tipo di data source basato sul simbolo
   */
  private determineDataSource(symbol: string): 'stocks' | 'crypto' | 'etf' | 'user_data' {
    if (!symbol || symbol === 'user_data') return 'user_data';
    
    // ETF hanno pattern specifici (es: .MI, SWDA, EIMI)
    const etfPatterns = [/\.MI$/, /^SWDA$/, /^EIMI$/, /^IUSQ$/, /^VWCE$/, /^SPY$/, /^QQQ$/];
    if (etfPatterns.some(pattern => pattern.test(symbol))) {
      return 'etf';
    }
    
    // Crypto: simboli corti senza punti o in cryptoIdMap
    const cryptoIdMap: Record<string, string> = {
      BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'ripple',
      ADA: 'cardano', DOGE: 'dogecoin', DOT: 'polkadot', MATIC: 'matic-network',
      AVAX: 'avalanche-2', LINK: 'chainlink', UNI: 'uniswap', ATOM: 'cosmos', LTC: 'litecoin'
    };
    if (cryptoIdMap[symbol.toUpperCase()] || (!symbol.includes('.') && symbol.length <= 5)) {
      return 'crypto';
    }
    
    // Default: stocks
    return 'stocks';
  }

  /**
   * Genera un grafico intelligente con analisi AI
   */
  async generateSmartChart(chartRequest: ChartRequest): Promise<SmartChartResult> {
    console.log('[AIChartGenerator] Generating smart chart:', chartRequest);

    try {
      // 1. Raccolta dati reali
      const realData = await this.fetchRealTimeData(chartRequest);
      
      if (realData.length === 0) {
        throw new Error('No data available for the requested symbols/timeframe');
      }

      // 2. Analisi pattern AI
      const patterns = await this.analyzePatterns(realData, chartRequest);
      
      // 3. Generazione configurazione chart ottimizzata
      const chartConfig = this.buildChartConfig(realData, patterns, chartRequest);
      
      // 4. Aggiunta annotazioni intelligenti
      const annotatedConfig = this.addAIAnnotations(chartConfig, patterns);
      
      return {
        success: true,
        chartConfig: annotatedConfig,
        data: realData,
        aiInsights: patterns.insights,
        patternAnalysis: patterns,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[AIChartGenerator] Error generating chart:', error);
      throw error;
    }
  }

  /**
   * Recupera dati real-time/historici per i simboli richiesti
   */
  private async fetchRealTimeData(chartRequest: ChartRequest): Promise<HistoricalDataPoint[]> {
    const { symbols = [], timeframe, dataSource = 'mixed', userId } = chartRequest;

    // Se solo user_data richiesto
    if (symbols.length === 0 && dataSource === 'user_data' && userId) {
      const userService = this.dataSources.get('user_data') as UserDataService;
      if (userService) {
        return await userService.getHistoricalData(userId, timeframe);
      }
      return [];
    }

    if (symbols.length === 0 && dataSource !== 'user_data') {
      return [];
    }

    const dataPromises: Promise<HistoricalDataPoint[]>[] = [];

    // Process each symbol with determined data source
    for (const symbol of symbols) {
      const sourceType = dataSource === 'mixed' 
        ? this.determineDataSource(symbol)
        : dataSource;
      
      const source = this.dataSources.get(sourceType);
      if (source) {
        if (sourceType === 'user_data' && userId) {
          dataPromises.push((source as UserDataService).getHistoricalData(userId, timeframe));
        } else {
          dataPromises.push((source as StockDataAPI | CryptoDataAPI | ETFDataAPI).getHistoricalData(symbol, timeframe));
        }
      }
    }

    // Also fetch user data if requested
    if ((dataSource === 'user_data' || dataSource === 'mixed') && userId) {
      const userService = this.dataSources.get('user_data') as UserDataService;
      if (userService) {
        dataPromises.push(userService.getHistoricalData(userId, timeframe));
      }
    }

    const results = await Promise.allSettled(dataPromises);
    
    // Combina tutti i dati
    const allData: HistoricalDataPoint[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allData.push(...result.value);
      } else {
        console.warn(`[AIChartGenerator] Failed to fetch data for source ${index}:`, result.reason);
      }
    });

    // Ordina per timestamp
    return allData.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }


  /**
   * Analizza pattern nei dati con AI
   */
  private async analyzePatterns(
    data: HistoricalDataPoint[],
    chartRequest: ChartRequest
  ): Promise<PatternAnalysis> {
    if (data.length === 0) {
      return {
        trends: [],
        anomalies: [],
        correlations: [],
        volatility: 0,
        insights: []
      };
    }

    // Analisi locale (senza AI per performance)
    const trends = this.detectTrends(data);
    const anomalies = this.detectAnomalies(data);
    const correlations = this.findCorrelations(data);
    const volatility = this.calculateVolatility(data);

    // Usa AI per generare insights più sofisticati
    const insights = await this.generateChartInsights(data, chartRequest, {
      trends,
      anomalies,
      volatility
    });

    return {
      trends,
      anomalies,
      correlations,
      volatility,
      insights
    };
  }

  /**
   * Rileva trend nei dati
   */
  private detectTrends(data: HistoricalDataPoint[]): Trend[] {
    if (data.length < 2) return [];

    const values = data.map(d => d.value || d.price || 0);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = ((lastValue - firstValue) / firstValue) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (change > 5) direction = 'up';
    else if (change < -5) direction = 'down';

    // Calcola confidence basata sulla consistenza del trend
    const positiveDays = values.filter((v, i) => i > 0 && v > values[i - 1]).length;
    const consistency = positiveDays / (values.length - 1);

    return [{
      direction,
      strength: Math.abs(change),
      confidence: direction === 'stable' ? 0.5 : Math.max(0.3, Math.min(0.95, consistency)),
      duration: `${data.length} days`
    }];
  }

  /**
   * Rileva il trend principale nei dati
   */
  private detectMainTrend(data: HistoricalDataPoint[]): Trend | null {
    const trends = this.detectTrends(data);
    if (trends.length === 0) return null;
    
    // Trova trend con confidence più alta e strength significativa
    const mainTrend = trends.reduce((prev, current) => {
      const prevScore = prev.confidence * prev.strength;
      const currentScore = current.confidence * current.strength;
      return currentScore > prevScore ? current : prev;
    });
    
    // Restituisci solo se significativo (strength > 3% e confidence > 0.5)
    return mainTrend.strength > 3 && mainTrend.confidence > 0.5 ? mainTrend : null;
  }

  /**
   * Trova punti di interesse nei dati (anomalie, picchi, valli, cambi significativi)
   */
  private findPointsOfInterest(data: HistoricalDataPoint[]): Array<{
    timestamp: string;
    description: string;
    significance: 'high' | 'medium' | 'low';
    value: number;
  }> {
    const points: Array<{
      timestamp: string;
      description: string;
      significance: 'high' | 'medium' | 'low';
      value: number;
    }> = [];
    
    if (data.length < 3) return points;
    
    const values = data.map(d => d.value || d.price || 0);
    const anomalies = this.detectAnomalies(data);
    
    // Aggiungi anomalie come punti di interesse
    anomalies.forEach(anomaly => {
      points.push({
        timestamp: anomaly.timestamp,
        description: anomaly.description,
        significance: anomaly.severity === 'high' ? 'high' : 
                       anomaly.severity === 'medium' ? 'medium' : 'low',
        value: anomaly.value
      });
    });
    
    // Trova massimi e minimi locali significativi
    for (let i = 1; i < values.length - 1; i++) {
      const isLocalMax = values[i] > values[i - 1] && values[i] > values[i + 1];
      const isLocalMin = values[i] < values[i - 1] && values[i] < values[i + 1];
      
      if (isLocalMax || isLocalMin) {
        const change = isLocalMax 
          ? ((values[i] - values[i - 1]) / values[i - 1]) * 100
          : ((values[i - 1] - values[i]) / values[i - 1]) * 100;
        
        // Solo variazioni significative (>5%)
        if (Math.abs(change) > 5) {
          const avgChange = Math.abs(change);
          points.push({
            timestamp: data[i].timestamp,
            description: `${isLocalMax ? 'Picco' : 'Valle'} locale: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
            significance: avgChange > 10 ? 'high' : avgChange > 7 ? 'medium' : 'low',
            value: values[i]
          });
        }
      }
    }
    
    // Trova cambi di direzione significativi (reversal points)
    const trends = this.detectTrends(data);
    if (trends.length > 0) {
      const trend = trends[0];
      if (trend.strength > 10 && trend.confidence > 0.7) {
        // Cerca punti dove il trend cambia direzione
        const trendValues = values.slice(0, Math.min(20, Math.floor(values.length / 3)));
        const recentValues = values.slice(-Math.min(20, Math.floor(values.length / 3)));
        
        const earlyTrend = ((trendValues[trendValues.length - 1] - trendValues[0]) / trendValues[0]) * 100;
        const recentTrend = ((recentValues[recentValues.length - 1] - recentValues[0]) / recentValues[0]) * 100;
        
        if (Math.sign(earlyTrend) !== Math.sign(recentTrend) && Math.abs(recentTrend) > 5) {
          const reversalIndex = Math.floor(data.length * 0.7); // Circa 70% dei dati
          points.push({
            timestamp: data[reversalIndex]?.timestamp || data[Math.floor(data.length / 2)].timestamp,
            description: `Inversione di trend: da ${earlyTrend > 0 ? 'positivo' : 'negativo'} a ${recentTrend > 0 ? 'positivo' : 'negativo'}`,
            significance: 'high',
            value: values[reversalIndex] || values[Math.floor(data.length / 2)]
          });
        }
      }
    }
    
    // Ordina per significance e limita a top 10
    return points.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.significance] - order[a.significance];
    }).slice(0, 10);
  }

  /**
   * Rileva anomalie nei dati
   */
  private detectAnomalies(data: HistoricalDataPoint[]): Anomaly[] {
    if (data.length < 3) return [];

    const values = data.map(d => d.value || d.price || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const threshold = 2 * stdDev; // 2 standard deviations

    const anomalies: Anomaly[] = [];

    values.forEach((value, index) => {
      const deviation = Math.abs(value - mean);
      if (deviation > threshold) {
        const previousValue = index > 0 ? values[index - 1] : mean;
        const isSpike = value > previousValue;

        anomalies.push({
          type: isSpike ? 'spike' : 'drop',
          timestamp: data[index].timestamp,
          value,
          description: `${isSpike ? 'Picco' : 'Caduta'} del ${((deviation / mean) * 100).toFixed(1)}% rispetto alla media`,
          severity: deviation > 3 * stdDev ? 'high' : deviation > 2 * stdDev ? 'medium' : 'low'
        });
      }
    });

    return anomalies;
  }

  /**
   * Trova correlazioni tra simboli (se multiple serie)
   */
  private findCorrelations(data: HistoricalDataPoint[]): Correlation[] {
    // Placeholder - in produzione si analizzerebbero multiple serie
    return [];
  }

  /**
   * Calcola volatilità
   */
  private calculateVolatility(data: HistoricalDataPoint[]): number {
    if (data.length < 2) return 0;

    const values = data.map(d => d.value || d.price || 0);
    const returns = values.slice(1).map((v, i) => (v - values[i]) / values[i]);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    
    // Annualized volatility (assumendo dati giornalieri)
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // Percentuale
  }

  /**
   * Genera insights AI avanzati con caching
   */
  private async generateChartInsights(
    data: HistoricalDataPoint[],
    chartRequest: ChartRequest,
    patterns: { trends: Trend[]; anomalies: Anomaly[]; volatility: number }
  ): Promise<ChartInsight[]> {
    // Cache key basato su hash dei dati principali
    const dataHash = `${data.length}-${patterns.trends[0]?.direction || 'none'}-${patterns.volatility.toFixed(0)}`;
    const cacheKey = `ai-insights-${dataHash}`;
    const cached = this.cacheGet(cacheKey);
    if (cached) {
      console.log('[AIChartGenerator] Cache hit for AI insights');
      return cached;
    }

    try {
      // Prepara prompt per AI
      const dataSummary = {
        totalPoints: data.length,
        dateRange: {
          start: data[0]?.timestamp,
          end: data[data.length - 1]?.timestamp
        },
        trends: patterns.trends,
        anomalies: patterns.anomalies.slice(0, 5), // Limita per token
        volatility: patterns.volatility.toFixed(2),
        chartType: chartRequest.type,
        timeframe: chartRequest.timeframe
      };

      const prompt = `Analizza questi dati finanziari e genera insights utili per un grafico ${chartRequest.type}.
      
Dati: ${JSON.stringify(dataSummary)}

Genera 3-5 insights in italiano focalizzati su:
1. Trend principale e significato
2. Eventi/anomalie importanti
3. Opportunità o avvisi
4. Suggerimenti basati sui pattern

Formato JSON:
[{
  "type": "trend|event|warning|opportunity",
  "message": "descrizione in italiano",
  "confidence": 0.0-1.0,
  "relevance": "high|medium|low",
  "timestamp": "se applicabile",
  "data": {}
}]`;

      const apiKey = import.meta.env.VITE_LOVABLE_API_KEY || '';
      if (!apiKey) {
        console.warn('[AIChartGenerator] No API key, using fallback insights');
        return this.generateFallbackInsights(data, patterns);
      }

      // Usa GeminiAI per generare insights
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'Sei un esperto analista finanziario. Genera insights chiari e utili in formato JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      
      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        // Cache per 2 ore
        this.cacheSet(cacheKey, insights, 7200000);
        return insights;
      }

      const fallbackInsights = this.generateFallbackInsights(data, patterns);
      // Cache anche fallback per 1 ora
      this.cacheSet(cacheKey, fallbackInsights, 3600000);
      return fallbackInsights;
    } catch (error) {
      console.error('[AIChartGenerator] Error generating AI insights:', error);
      // Fallback a insights base
      return this.generateFallbackInsights(data, patterns);
    }
  }

  /**
   * Genera insights di fallback senza AI usando detectMainTrend e findPointsOfInterest
   */
  private generateFallbackInsights(
    data: HistoricalDataPoint[],
    patterns: { trends: Trend[]; anomalies: Anomaly[]; volatility: number }
  ): ChartInsight[] {
    const insights: ChartInsight[] = [];

    // Usa detectMainTrend invece di trends[0]
    const mainTrend = this.detectMainTrend(data);
    if (mainTrend) {
      insights.push({
        type: 'trend',
        message: `Trend ${mainTrend.direction === 'up' ? 'positivo' : mainTrend.direction === 'down' ? 'negativo' : 'stabile'} del ${mainTrend.strength.toFixed(2)}% nell'ultimo periodo`,
        confidence: mainTrend.confidence,
        relevance: mainTrend.strength > 10 ? 'high' : 'medium'
      });
    }

    // Usa findPointsOfInterest invece di solo anomalies[0]
    const pointsOfInterest = this.findPointsOfInterest(data);
    pointsOfInterest.forEach(point => {
      insights.push({
        type: 'event',
        message: point.description,
        timestamp: point.timestamp,
        relevance: point.significance,
        confidence: point.significance === 'high' ? 0.9 : point.significance === 'medium' ? 0.7 : 0.5,
        data: { value: point.value }
      });
    });

    if (patterns.volatility > 30) {
      insights.push({
        type: 'warning',
        message: `Alta volatilità rilevata (${patterns.volatility.toFixed(1)}%). Considera diversificazione.`,
        confidence: 0.7,
        relevance: 'medium'
      });
    }

    return insights;
  }

  /**
   * Costruisce configurazione Chart.js
   */
  private buildChartConfig(
    data: HistoricalDataPoint[],
    patterns: PatternAnalysis,
    chartRequest: ChartRequest
  ): ChartConfig {
    const labels = data.map(d => {
      const date = new Date(d.timestamp);
      return date.toLocaleDateString('it-IT', { 
        month: 'short', 
        day: 'numeric' 
      });
    });

    const values = data.map(d => d.value || d.price || 0);

    // Colori basati sul trend
    const trendColor = patterns.trends[0]?.direction === 'up' 
      ? '#10B981' // green
      : patterns.trends[0]?.direction === 'down'
      ? '#EF4444' // red
      : '#6366F1'; // indigo

    const backgroundColor = chartRequest.type === 'doughnut' 
      ? ['#7B2FF7', '#00D4AA', '#FF6B35', '#FFD166', '#118AB2', '#06D6A0']
      : chartRequest.type === 'bar'
      ? 'rgba(123, 47, 247, 0.8)'
      : `rgba(123, 47, 247, ${chartRequest.type === 'area' ? '0.3' : '0.1'})`;

    const datasets = [{
      label: data[0]?.label || chartRequest.symbols?.[0] || 'Valore',
      data: values,
      backgroundColor,
      borderColor: trendColor,
      borderWidth: 2,
      fill: chartRequest.type === 'area',
      tension: 0.4,
    }];

    return {
      type: chartRequest.type,
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        }
      },
      annotations: []
    };
  }

  /**
   * Aggiunge annotazioni AI al grafico
   */
  private addAIAnnotations(
    config: ChartConfig,
    patterns: PatternAnalysis
  ): ChartConfig {
    const annotations: ChartConfig['annotations'] = [];

    // Aggiungi annotazioni per anomalie importanti
    patterns.anomalies
      .filter(a => a.severity === 'high')
      .slice(0, 3) // Max 3 annotazioni
      .forEach(anomaly => {
        const index = patterns.anomalies.indexOf(anomaly);
        if (config.data.labels[index]) {
          annotations.push({
            type: 'point',
            x: index,
            y: anomaly.value,
            label: anomaly.description,
            color: anomaly.type === 'spike' ? '#10B981' : '#EF4444'
          });
        }
      });

    return {
      ...config,
      annotations
    };
  }

  /**
   * Converte timeframe in giorni
   */
  private timeframeToDays(timeframe: Timeframe): number {
    const mapping: Record<Timeframe, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': 730 // 2 anni max
    };
    return mapping[timeframe] || 30;
  }
}

/**
 * Export grafico come immagine PNG
 */
export async function exportChartAsImage(
  chartElementId: string, 
  filename: string = 'chart.png'
): Promise<void> {
  try {
    // Dynamic import per html2canvas (se disponibile)
    const html2canvas = await import('html2canvas').catch(() => null);
    if (!html2canvas) {
      console.warn('[AIChartGenerator] html2canvas non disponibile');
      throw new Error('html2canvas non installato');
    }

    const element = document.getElementById(chartElementId);
    if (!element) {
      throw new Error(`Elemento ${chartElementId} non trovato`);
    }

    const canvas = await html2canvas.default(element, {
      backgroundColor: '#0F0F0F',
      scale: 2,
      logging: false
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('[AIChartGenerator] Error exporting chart as image:', error);
    throw error;
  }
}

/**
 * Export grafico come PDF
 */
export async function exportChartAsPDF(
  chartElementId: string,
  chartTitle: string = 'Grafico',
  filename: string = 'chart.pdf'
): Promise<void> {
  try {
    // Dynamic imports
    const [html2canvasModule, jsPDFModule] = await Promise.all([
      import('html2canvas').catch(() => null),
      import('jspdf').catch(() => null)
    ]);

    if (!html2canvasModule || !jsPDFModule) {
      throw new Error('html2canvas o jsPDF non disponibili');
    }

    const html2canvas = html2canvasModule.default;
    const jsPDF = jsPDFModule.default;

    const element = document.getElementById(chartElementId);
    if (!element) {
      throw new Error(`Elemento ${chartElementId} non trovato`);
    }

    // Converti elemento a canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Aggiungi titolo
    pdf.setFontSize(16);
    pdf.text(chartTitle, 14, 15);

    // Calcola dimensioni immagine per A4 landscape
    const imgWidth = 270; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const maxHeight = 180; // mm (A4 landscape - margini)
    const finalHeight = imgHeight > maxHeight ? maxHeight : imgHeight;
    const finalWidth = (canvas.width * finalHeight) / canvas.height;

    // Aggiungi immagine
    pdf.addImage(imgData, 'PNG', 14, 25, finalWidth, finalHeight);
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Generato il ${new Date().toLocaleDateString('it-IT')}`,
      14,
      280
    );

    pdf.save(filename);
  } catch (error) {
    console.error('[AIChartGenerator] Error exporting chart as PDF:', error);
    throw error;
  }
}

// Export singleton instance
export const aiChartGenerator = new AIChartGenerator();
export default aiChartGenerator;

