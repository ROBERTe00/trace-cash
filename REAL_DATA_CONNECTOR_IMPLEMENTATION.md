# Real Data Connector - Implementazione Completa

## 📋 Overview

Implementazione completa di un connettore centralizzato per dati finanziari reali con enrichment multi-fonte.

## 🏗️ Architettura

```
src/integrations/real-data-connector.ts
├── AlphaVantageAPI      # Stocks/ETF data + fundamentals
├── CoinGeckoAPI         # Crypto data + fundamentals
├── ETFDataAPI          # ETF-specific data
├── NewsAPI             # Financial news
├── EconomicDataAPI     # Economic indicators (placeholder)
└── RealDataConnector   # Main orchestrator
```

## 🔧 Componenti

### 1. RealDataConnector

**Funzionalità principali**:
- ✅ Fetch multi-symbol con parallel processing
- ✅ Automatic source detection (crypto, ETF, stocks)
- ✅ Data enrichment (fundamentals, news, technical analysis, peers)
- ✅ Fallback su API esistenti
- ✅ Caching integrato tramite data sources

### 2. AlphaVantageAPI

**Endpoint utilizzati**:
- `TIME_SERIES_DAILY` - Dati storici prezzi
- `OVERVIEW` - Fundamentals (P/E, Market Cap, Dividend Yield, etc.)

**Limitazioni**:
- Free tier: 5 calls/minuto, 500 calls/giorno
- Rate limiting implementato in `StockDataAPI`

### 3. CoinGeckoAPI

**Endpoint utilizzati**:
- `market_chart` - Dati storici prezzi
- Coin details - Market cap e categories

**Limitazioni**:
- Free tier: ~50 calls/minuto
- Nessuna API key richiesta

### 4. Technical Analysis

**Indicatori calcolati**:
- **RSI** (Relative Strength Index) - Momentum indicator (0-100)
- **MACD** (Moving Average Convergence Divergence) - Trend indicator
- **SMA** (Simple Moving Average) - 50 e 200 periodi
- **Support/Resistance** - Min/max ultimi 20 periodi
- **Trend** - Bullish/Bearish/Neutral basato su prezzi e MA

## 📊 Struttura Dati

### MarketDataEnriched

```typescript
{
  symbol: 'BTC',
  price: 45000,
  change24h: 2.5,
  volume: 1234567890,
  timestamp: '2025-01-20T10:00:00Z',
  fundamentals: {
    marketCap: 850000000000,
    sector: 'Cryptocurrency',
    industry: 'Digital Asset'
  },
  news: [
    {
      title: 'Bitcoin reaches new ATH',
      source: 'CoinDesk',
      impactScore: 8.5
    }
  ],
  technicalAnalysis: {
    rsi: 65.5,
    macd: { signal: 1200, histogram: 150 },
    movingAverages: { sma50: 42000, sma200: 38000 },
    support: 44000,
    resistance: 46000,
    trend: 'bullish'
  },
  peers: [
    { symbol: 'ETH', price: 3000, change24h: 1.8 }
  ]
}
```

## 🚀 Utilizzo

### Esempio Base

```typescript
import { realDataConnector } from '@/integrations/real-data-connector';

// Fetch enriched data per multiple symbols
const result = await realDataConnector.getMarketData(
  ['BTC', 'TSLA', 'AAPL'],
  '1y' // period: 1d, 1w, 1m, 3m, 6m, 1y, all
);

console.log(result.data); // Array of MarketDataEnriched
console.log(result.metadata); // Metadata about the fetch
```

### Esempio Avanzato

```typescript
// Fetch single symbol con enrichment completo
const symbolData = await realDataConnector.fetchSymbolData('BTC', '1y');

if (symbolData) {
  console.log(`Price: €${symbolData.price}`);
  console.log(`RSI: ${symbolData.technicalAnalysis?.rsi}`);
  console.log(`Trend: ${symbolData.technicalAnalysis?.trend}`);
  console.log(`PE Ratio: ${symbolData.fundamentals?.peRatio}`);
  console.log(`News: ${symbolData.news?.length} articles`);
  console.log(`Peers: ${symbolData.peers?.map(p => p.symbol).join(', ')}`);
}
```

## 🔄 Integrazione con Codice Esistente

### Utilizza Data Sources Esistenti

- ✅ `StockDataAPI` per stocks (con caching)
- ✅ `CryptoDataAPI` per crypto (con caching)
- ✅ `ETFDataAPI` per ETF
- ✅ `fetchCryptoPrice` / `fetchStockPrice` per prezzi real-time
- ✅ `financialDataIntegration` per news (via Supabase edge function)

### Fallback Strategy

1. **Primary**: AlphaVantage/CoinGecko API
2. **Secondary**: `apiService` (mymoney.ai)
3. **Tertiary**: Yahoo Finance proxy / mock data

## 📈 Technical Analysis Details

### RSI Calculation

```
RSI = 100 - (100 / (1 + RS))
RS = Average Gain / Average Loss (14 periods)

Interpretation:
- RSI > 70: Overbought (sell signal)
- RSI < 30: Oversold (buy signal)
- RSI 30-70: Neutral
```

### MACD Calculation

```
MACD Line = EMA(12) - EMA(26)
Signal Line = EMA(9) of MACD
Histogram = MACD - Signal

Interpretation:
- Histogram > 0: Bullish momentum
- Histogram < 0: Bearish momentum
```

### Trend Determination

```
Bullish: Price > SMA50 > SMA200
Bearish: Price < SMA50 < SMA200
Neutral: Mixed or insufficient data
```

## 🎯 Peer Comparison

**Peer Groups Predefiniti**:

- **Crypto**: BTC ↔ ETH, SOL, XRP
- **Tech Stocks**: AAPL ↔ MSFT, GOOGL, AMZN
- **Auto**: TSLA ↔ AAPL, MSFT, GOOGL

**Estensioni Future**:
- Sector/industry matching dinamico
- Correlation-based similarity scoring
- Performance comparison metrics

## 🔐 Environment Variables

```env
VITE_ALPHAVANTAGE_API_KEY=your_key_here
VITE_NEWS_API_KEY=your_key_here (optional)
```

## ⚡ Performance

- **Parallel Fetching**: Enrichment data fetched in parallel
- **Caching**: Historical data cached per 1h (real) / 30min (mock)
- **Rate Limiting**: AlphaVantage rate limits rispettati
- **Error Handling**: Graceful fallback su errori

## 🐛 Error Handling

```typescript
// Gestione errori per symbol non trovato
const data = await realDataConnector.fetchSymbolData('INVALID', '1y');
// Returns: null (non lancia errore)

// Filtering in getMarketData
result.data.filter(item => item !== null);
```

## 📝 TODO / Estensioni Future

1. **Economic Data API**:
   - Integrazione FRED API per indicatori economici
   - GDP, inflation, unemployment rates

2. **Advanced Peer Matching**:
   - Sector/industry classification
   - Correlation analysis
   - Dynamic peer discovery

3. **Additional Technical Indicators**:
   - Bollinger Bands
   - Stochastic Oscillator
   - Fibonacci Retracement

4. **Real-time Updates**:
   - WebSocket integration per live prices
   - Push notifications per significant changes

5. **Portfolio Analysis**:
   - Aggregate metrics per portfolio
   - Correlation matrix
   - Risk analysis

## ✅ Testing

**Test Scenarios**:
1. ✅ Single symbol (crypto, stock, ETF)
2. ✅ Multiple symbols batch fetch
3. ✅ Enrichment completeness check
4. ✅ Fallback behavior on API errors
5. ✅ Technical analysis accuracy

## 🔗 Related Files

- `src/integrations/financial-data.ts` - Financial data integration esistente
- `src/services/api-service.ts` - API service con fallback
- `src/ai/data-sources/` - Data sources per AI chart generator
- `src/lib/marketData.ts` - Market data utilities



