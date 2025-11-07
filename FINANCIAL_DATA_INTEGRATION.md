# Financial Data Integration

Servizio centralizzato per l'integrazione di dati finanziari da multiple fonti.

## Providers Supportati

- **Stocks/ETFs**: AlphaVantage (con fallback a Yahoo Finance via API service)
- **Crypto**: CoinGecko (con fallback a API service)
- **Forex**: ExchangeRate API
- **News**: NewsAPI (via Supabase edge function)

## Configurazione

### AlphaVantage API (Opzionale)

Per utilizzare AlphaVantage per i dati azionari, aggiungi la chiave API nel file `.env`:

```env
VITE_ALPHAVANTAGE_API_KEY=your_api_key_here
```

**Nota**: AlphaVantage è gratuito con 500 chiamate/giorno. Se non configurata, il sistema utilizzerà automaticamente Yahoo Finance come fallback.

### NewsAPI

La configurazione di NewsAPI è gestita tramite Supabase edge function (`fetch-filtered-news`) e richiede:
- `NEWS_API_KEY` nel Supabase dashboard
- `LOVABLE_API_KEY` per lo scoring AI delle news

## Utilizzo

### Hook React (Consigliato)

```typescript
import { useFinancialData, useStockData, useCryptoData } from '@/hooks/useFinancialData';

// Fetch completo (stocks, crypto, news, forex)
function MyComponent() {
  const { data, isLoading, error } = useFinancialData({
    symbols: {
      stocks: ['SWDA.MI', 'EIMI.MI'],
      crypto: ['BTC', 'ETH']
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Stocks</h2>
      {Object.entries(data.stocks).map(([symbol, stock]) => (
        <div key={symbol}>
          {symbol}: €{stock.price} ({stock.change24h}%)
        </div>
      ))}
    </div>
  );
}

// Fetch solo stocks
function StockComponent() {
  const { data, isLoading } = useStockData(['SWDA.MI', 'EIMI.MI', 'IUSQ.MI']);
  // ...
}

// Fetch solo crypto
function CryptoComponent() {
  const { data, isLoading } = useCryptoData(['BTC', 'ETH', 'SOL']);
  // ...
}
```

### Utilizzo Diretto del Servizio

```typescript
import { financialDataIntegration } from '@/integrations/financial-data';

// Inizializza tutte le connessioni simultaneamente
const { stocks, crypto, news, forex } = 
  await financialDataIntegration.initializeDataConnections();

// Oppure fetch individuali
const etfData = await financialDataIntegration.fetchStockData(['SWDA.MI', 'EIMI.MI']);
const cryptoData = await financialDataIntegration.fetchCryptoData(['BTC', 'ETH']);
const newsData = await financialDataIntegration.fetchFinancialNews();
const forexRates = await financialDataIntegration.fetchForexRates(['EUR', 'USD', 'GBP']);
```

## ETF Europei Supportati

Il servizio supporta ETF quotati sulla Borsa Italiana con formato `.MI`:
- `SWDA.MI` - iShares Core MSCI World
- `EIMI.MI` - iShares Core MSCI EM IMI
- `IUSQ.MI` - iShares Core MSCI World UCITS ETF

**Nota**: AlphaVantage potrebbe richiedere il simbolo senza suffisso (es. `SWDA` invece di `SWDA.MI`). Il servizio gestisce automaticamente questa conversione. Se AlphaVantage fallisce, viene utilizzato Yahoo Finance che supporta i simboli completi.

## Rate Limiting

- **AlphaVantage**: 5 chiamate al minuto (free tier), 500 chiamate/giorno
  - Il servizio aggiunge automaticamente 12 secondi di delay tra le chiamate
- **CoinGecko**: ~50 chiamate al minuto (senza API key)
- **ExchangeRate**: Illimitato (free tier)

## Cache

Il servizio utilizza cache interna per:
- Dati di mercato (1 minuto TTL)
- Exchange rates (cached via `currencyConverter`)

## Error Handling

Tutti i metodi gestiscono automaticamente gli errori con fallback:
1. Se AlphaVantage fallisce → usa Yahoo Finance via `apiService`
2. Se CoinGecko fallisce → usa `apiService`
3. Se un provider non è disponibile → ritorna dati vuoti invece di crashare

## Esempi di Integrazione

### Dashboard Widget

```typescript
import { useFinancialData } from '@/hooks/useFinancialData';

export function MarketOverviewWidget() {
  const { data, isLoading } = useFinancialData({
    symbols: {
      stocks: ['SWDA.MI', 'EIMI.MI'],
      crypto: ['BTC', 'ETH']
    },
    refetchInterval: 1000 * 60 * 5 // 5 minuti
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading market data...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3>Stocks</h3>
              {Object.entries(data.stocks).map(([symbol, stock]) => (
                <div key={symbol}>
                  {symbol}: €{stock.price.toFixed(2)} 
                  <span className={stock.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            <div>
              <h3>Crypto</h3>
              {Object.entries(data.crypto).map(([symbol, crypto]) => (
                <div key={symbol}>
                  {symbol}: €{crypto.price.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Provider Switching

Puoi cambiare provider a runtime:

```typescript
import { financialDataIntegration } from '@/integrations/financial-data';

// Cambia provider per stocks da AlphaVantage a YahooFinance
financialDataIntegration.setProvider('stocks', 'YahooFinance');

// Cambia provider per crypto da CoinGecko a API
financialDataIntegration.setProvider('crypto', 'API');
```

## Note Tecniche

- Il servizio è un singleton, quindi tutte le istanze condividono la stessa configurazione
- I hook utilizzano React Query per caching e refetching automatico
- Tutte le chiamate API sono asincrone e non bloccanti
- I simboli vengono sempre convertiti in uppercase per consistenza



