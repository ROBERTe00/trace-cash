# Core AI Engine - Documentazione

## Overview

Il `CoreAIEngine` è l'orchestratore centrale per tutte le richieste AI nell'applicazione. Fornisce un'interfaccia unificata per accedere a tutte le funzionalità AI, con validazione compliance, routing automatico e gestione errori.

## Architettura

```
CoreAIEngine
├── ComplianceEngine       # Validazione GDPR e compliance
├── DataAnalyzer          # Analisi dati finanziari
├── AIChartGenerator      # Generazione grafici intelligenti
├── InsightEngine         # Generazione insights AI
├── AIEducator           # Contenuti educativi
└── AIReportGenerator    # Generazione report AI
```

## Tipi di Richiesta Supportati

### 1. `chart_generation`
Genera grafici intelligenti con analisi AI e dati real-time.

```typescript
const result = await coreAIEngine.processRequest('chart_generation', {
  type: 'line',
  timeframe: '3M',
  symbols: ['BTC', 'ETH'],
  dataSource: 'crypto',
  prompt: 'Mostra performance crypto ultimi 3 mesi'
}, await coreAIEngine.getUserContext());
```

### 2. `insight_generation`
Genera insights finanziari personalizzati.

```typescript
const result = await coreAIEngine.processRequest('insight_generation', {
  expenses: myExpenses,
  investments: myInvestments,
  goals: myGoals,
  scope: 'dashboard' // o 'detailed'
}, await coreAIEngine.getUserContext());
```

### 3. `educational_content`
Genera contenuti educativi finanziari.

```typescript
const result = await coreAIEngine.processRequest('educational_content', {
  topic: 'diversificazione portafoglio',
  level: 'beginner' // 'intermediate' | 'advanced'
}, await coreAIEngine.getUserContext());
```

### 4. `report_generation`
Genera report finanziari (PDF/CSV) con summary AI.

```typescript
const result = await coreAIEngine.processRequest('report_generation', {
  type: 'monthly', // 'quarterly' | 'annual' | 'custom'
  format: 'pdf', // 'csv'
  expenses: myExpenses,
  investments: myInvestments,
  goals: myGoals
}, await coreAIEngine.getUserContext());
```

### 5. `data_analysis`
Analizza dati finanziari per pattern e raccomandazioni.

```typescript
const result = await coreAIEngine.processRequest('data_analysis', {
  expenses: myExpenses,
  investments: myInvestments,
  transactions: myTransactions,
  timeframe: '3M'
}, await coreAIEngine.getUserContext());
```

### 6. `document_processing`
Processa documenti finanziari (PDF/CSV/Excel) con AI.

```typescript
const result = await coreAIEngine.processRequest('document_processing', {
  fileContent: fileContent,
  fileType: 'pdf', // 'csv' | 'excel'
  enableAnomalyDetection: true,
  enableInsights: true,
  enableSummarization: true,
  customCategories: ['Food', 'Transport', 'Bills']
}, await coreAIEngine.getUserContext());
```

### 7. `anomaly_detection`
Rileva anomalie nelle transazioni.

```typescript
const result = await coreAIEngine.processRequest('anomaly_detection', {
  transactions: myTransactions
}, await coreAIEngine.getUserContext());
```

## Utilizzo con Hook React

Per semplificare l'utilizzo nei componenti React, è disponibile l'hook `useCoreAI`:

```typescript
import { useCoreAI } from '@/hooks/useCoreAI';

function MyComponent() {
  const { generateInsights, generateChart, loading, error } = useCoreAI();

  const handleGenerateInsights = async () => {
    const result = await generateInsights('dashboard');
    if (result.success) {
      console.log('Insights:', result.data);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateInsights} disabled={loading}>
        Genera Insights
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## Compliance e Sicurezza

### Validazioni Automatiche

- **GDPR Compliance**: Tutte le richieste sono validate per conformità GDPR
- **Data Retention**: Dati processati vengono trattenuti per max 30 giorni
- **Sensitive Data Detection**: Rilevamento automatico di dati sensibili nei documenti
- **Rate Limiting**: Controllo automatico delle richieste per tipo

### Risposte di Compliance

Se una richiesta non è compliant, viene restituita una risposta con:

```typescript
{
  success: false,
  error: 'Reason for rejection',
  compliance: {
    approved: false,
    reason: '...',
    warnings: ['...'],
    gdprCompliant: false
  }
}
```

## Gestione Errori

Il CoreAIEngine gestisce automaticamente:
- Errori di rete con fallback
- Timeout delle richieste
- Errori delle API AI
- Dati mancanti o invalidi

Ogni risposta include:
- `success`: boolean indicante successo/fallimento
- `error`: messaggio di errore se presente
- `latency`: tempo di elaborazione in ms
- `metadata`: informazioni aggiuntive (model, tokens, confidence)

## Integrazione Esistente

Il CoreAIEngine è integrato con:

- ✅ `AIChartGenerator` - per generazione grafici
- ✅ `GeminiAI` - per processing documenti e insights
- ✅ `exportUtils` - per generazione report
- ✅ React Query - per caching e sincronizzazione

## Esempi di Utilizzo

### 1. Widget Insights con CoreAIEngine

```typescript
import { useCoreAI } from '@/hooks/useCoreAI';

export function AIInsightsWidget() {
  const { generateInsights, loading } = useCoreAI();
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    generateInsights('dashboard').then(result => {
      if (result.success) {
        setInsights(result.data.insights);
      }
    });
  }, []);

  // ... render
}
```

### 2. Document Upload con CoreAIEngine

```typescript
import { useCoreAI } from '@/hooks/useCoreAI';

export function DocumentUpload() {
  const { processDocument, loading } = useCoreAI();

  const handleUpload = async (file: File) => {
    const fileContent = await file.text();
    const result = await processDocument(
      fileContent,
      file.type.includes('pdf') ? 'pdf' : 'csv',
      {
        enableAnomalyDetection: true,
        enableInsights: true
      }
    );

    if (result.success) {
      console.log('Transactions:', result.data.transactions);
      console.log('Insights:', result.data.insights);
      console.log('Anomalies:', result.data.anomalies);
    }
  };

  // ... render
}
```

### 3. Report Generation

```typescript
import { useCoreAI } from '@/hooks/useCoreAI';

export function ReportGenerator() {
  const { generateReport } = useCoreAI();

  const handleGeneratePDF = async () => {
    const result = await generateReport('monthly', 'pdf');
    if (result.success) {
      console.log('Report generated:', result.data);
      // Il PDF viene scaricato automaticamente
    }
  };

  return <button onClick={handleGeneratePDF}>Genera Report PDF</button>;
}
```

## Best Practices

1. **Usa sempre `getUserContext()`**: Passa sempre il context utente per compliance
2. **Gestisci gli errori**: Controlla sempre `result.success` prima di usare i dati
3. **Usa `useCoreAI` hook**: Per componenti React, preferisci l'hook dedicato
4. **Timeout appropriati**: Per richieste lunghe, considera timeout personalizzati
5. **Caching**: I dati vengono cache-ati automaticamente quando possibile

## Configurazione

### Variabili d'Ambiente

- `VITE_LOVABLE_API_KEY`: API key per servizi AI (richiesto per alcune funzionalità)

### Inizializzazione

Il CoreAIEngine si inizializza automaticamente al caricamento del modulo. Per verificare lo stato:

```typescript
import { coreAIEngine } from '@/ai/core-ai-engine';

if (coreAIEngine.isInitialized()) {
  console.log('CoreAIEngine ready');
}
```

## Performance

- **Caching**: Risposte AI vengono cache-ate quando possibile
- **Lazy Loading**: Modelli AI vengono caricati solo quando necessario
- **Parallel Processing**: Richieste multiple vengono processate in parallelo quando possibile

## Logging

Tutte le richieste vengono loggate con:
- Request ID univoco
- Tipo di richiesta
- User ID (se disponibile)
- Latency
- Successo/Fallimento

## Roadmap Futura

- [ ] Audit log completo delle richieste AI
- [ ] Rate limiting avanzato per utente
- [ ] Caching distribuito (Redis)
- [ ] Batch processing per richieste multiple
- [ ] Webhook per notifiche asincrone

