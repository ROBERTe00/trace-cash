# Compliance Engine - Implementazione Avanzata

## 📋 Overview

Implementazione completa di un sistema di compliance avanzato per validare tutte le richieste AI secondo le normative:
- **MiFID II** (UE) - Consulenza finanziaria
- **GDPR** (UE) - Protezione dati
- **CONSOB** (Italia) - Regolamentazione mercati

## 🏗️ Architettura

```
src/ai/compliance/
├── ComplianceEngine.ts      # Engine principale con validazione completa
├── ContentFilterSystem.ts   # Sistema di filtraggio contenuti vietati
└── AuditLogger.ts          # Sistema di audit logging
```

## 🔧 Componenti

### 1. ComplianceEngine

**File**: `src/ai/compliance/ComplianceEngine.ts`

**Funzionalità principali**:
- ✅ Caricamento normative (MiFID II, GDPR, CONSOB)
- ✅ Risk assessment multi-fattore
- ✅ Validazione contenuti vietati
- ✅ Validazione GDPR
- ✅ Suggerimento alternative compliant
- ✅ Generazione constraint e disclaimer

**Metodi principali**:
```typescript
async validateRequest(
  type: AIRequestType,
  data: any,
  context: AIRequestContext
): Promise<ComplianceValidationResult>

async assessRisk(
  type: AIRequestType,
  data: any,
  context: AIRequestContext
): Promise<RiskAssessment>

getComplianceStats(): ComplianceStats
```

**Risk Assessment**:
- Analisi keyword finanziarie (weight: 0.9)
- Menzioni prodotti specifici (weight: 0.8)
- Proiezioni performance (weight: 0.7)
- Market timing suggestions (weight: 0.75)
- Tipi di richiesta sensibili (weight: 0.3)

**Livelli di rischio**:
- `low`: score < 0.8
- `medium`: score 0.8 - 1.5
- `high`: score > 1.5 → **Request bloccata**

### 2. ContentFilterSystem

**File**: `src/ai/compliance/ContentFilterSystem.ts`

**Funzionalità**:
- ✅ Rilevamento keyword vietate (15+ pattern)
- ✅ Pattern regex per consulenza finanziaria (7+ pattern)
- ✅ Rilevamento prodotti specifici (ticker, ISIN, fondi)
- ✅ Rilevamento proiezioni performance
- ✅ Sanitizzazione contenuti

**Keyword vietate**:
- `dovresti comprare`, `devi investire`, `ti consiglio`
- `guadagno garantito`, `rendimento sicuro`
- `investi subito`, `compra ora`, `vendi domani`
- E molti altri...

**Metodi principali**:
```typescript
containsForbiddenContent(data: any): boolean
getFlaggedContent(data: any): FlaggedContent[]
sanitizeContent(content: string): string
```

### 3. AuditLogger

**File**: `src/ai/compliance/AuditLogger.ts`

**Funzionalità**:
- ✅ Logging richieste (localStorage + Supabase ready)
- ✅ Logging violazioni compliance
- ✅ Statistiche violazioni per tipo
- ✅ Persistenza locale (ultimi 100 log, 50 violazioni)

**Metodi principali**:
```typescript
async logRequest(request: AuditLogRequest): Promise<void>
async logViolation(violation: ComplianceViolation): Promise<void>
getRequestLogs(limit?: number): AuditLogRequest[]
getViolations(limit?: number): ComplianceViolation[]
getViolationStats(): Record<string, number>
```

**Storage**:
- `localStorage`: `compliance-audit-logs`, `compliance-violations`
- **TODO**: Integrazione Supabase `audit_logs` e `compliance_violations` tables

## 🔄 Integrazione con CoreAIEngine

Il `ComplianceEngine` esistente in `core-ai-engine.ts` è stato aggiornato per usare il nuovo engine avanzato:

```typescript
class ComplianceEngine {
  private advancedEngine: AdvancedComplianceEngine;
  
  async validateRequest(...): Promise<ComplianceCheck> {
    // Usa advanced engine
    const result = await this.advancedEngine.validateRequest(...);
    // Converte in formato compatibile
    return convertToComplianceCheck(result);
  }
}
```

**Compatibilità**: ✅ Mantiene retrocompatibilità con `ComplianceCheck` esistente

## 🛡️ Normative Implementate

### MiFID II (UE)

**Restrizioni**:
- ❌ Consulenza finanziaria personale
- ❌ Raccomandazioni investimenti
- ❌ Promozione prodotti specifici
- ❌ Suggerimenti market timing
- ❌ Garanzie performance

**Disclaimers richiesti**:
- `educational_purpose_only`
- `not_financial_advice`
- `consult_professional`
- `past_performance_disclaimer`

**Boundaries**:
- Max risk level: `medium`
- Content types: `educational`, `informational`, `analytical`
- Forbidden actions: `recommending`, `advising`, `promoting`

### GDPR (UE)

**Validazioni**:
- ✅ Consenso esplicito per dati sensibili
- ✅ User ID per tracciamento
- ✅ Data portability
- ✅ Rilevamento dati sensibili (password, PIN, CVV, codice fiscale)

**Limiti AI**:
- Trasparenza
- Human oversight
- Bias prevention

### CONSOB (Italia)

**Restrizioni**:
- ❌ Nessuna consulenza investimenti individuale
- ❌ Nessun suggerimento gestione portafoglio
- ❌ Nessuna raccomandazione titoli specifici

## 📊 Esempi di Utilizzo

### Esempio 1: Richiesta bloccata (contenuto vietato)

```typescript
const result = await complianceEngine.validateRequest(
  'insight_generation',
  {
    prompt: "Dovresti comprare azioni Tesla ora, renderà profitti garantiti"
  },
  { userId: 'user123' }
);

// Result:
// {
//   approved: false,
//   reason: 'FORBIDDEN_CONTENT_DETECTED',
//   flaggedContent: [
//     { type: 'forbidden_keyword', content: 'dovresti comprare', severity: 'critical' },
//     { type: 'projection', content: 'renderà profitti garantiti', severity: 'medium' }
//   ],
//   alternative: {
//     message: "Posso mostrarti come analizzare i fondamentali...",
//     type: 'educational_alternative'
//   }
// }
```

### Esempio 2: Richiesta approvata

```typescript
const result = await complianceEngine.validateRequest(
  'educational_content',
  {
    prompt: "Spiegami i principi di diversificazione del portafoglio"
  },
  { userId: 'user123' }
);

// Result:
// {
//   approved: true,
//   constraints: {
//     maxRiskLevel: 'medium',
//     allowedContentTypes: ['educational', 'informational', 'analytical'],
//     forbiddenActions: ['recommending', 'advising', 'promoting']
//   },
//   requiredDisclaimers: ['educational_purpose_only', 'not_financial_advice'],
//   riskLevel: 'low'
// }
```

### Esempio 3: Violazione GDPR

```typescript
const result = await complianceEngine.validateRequest(
  'document_processing',
  {
    fileContent: "Password: secret123, PIN: 1234"
  },
  { userId: undefined } // User ID mancante
);

// Result:
// {
//   approved: false,
//   reason: 'GDPR_VIOLATION',
//   details: [
//     'User ID mancante per tracciamento GDPR - richiesto per processamento documenti',
//     'Dati sensibili rilevati - richiede consenso esplicito e trattamento conforme GDPR'
//   ]
// }
```

## 📈 Statistiche Compliance

```typescript
const stats = complianceEngine.getComplianceStats();

// {
//   totalRequests: 150,
//   approved: 142,
//   rejected: 8,
//   violations: {
//     'MiFID_II_high': 5,
//     'GDPR_high': 2,
//     'CONSOB_medium': 1
//   }
// }
```

## 🔍 Audit Trail

Tutte le richieste e violazioni sono loggate:

```typescript
// Log richieste
const logs = auditLogger.getRequestLogs(50);

// Log violazioni
const violations = auditLogger.getViolations(20);

// Statistiche
const stats = auditLogger.getViolationStats();
```

## 🚀 Prossimi Passi

1. **Database Integration**:
   - Creare tabelle Supabase `audit_logs` e `compliance_violations`
   - Implementare sync automatico da localStorage

2. **Dashboard Compliance**:
   - UI per visualizzare statistiche compliance
   - Dashboard violazioni per admin

3. **Machine Learning**:
   - Training model per rilevamento pattern vietati più sofisticato
   - Analisi predittiva rischio compliance

4. **Notifiche**:
   - Alert automatici per violazioni critiche
   - Report settimanali compliance

## ✅ Testing

**Test consigliati**:
1. ✅ Richieste con keyword vietate → deve bloccare
2. ✅ Richieste educative → deve approvare
3. ✅ Richieste con dati sensibili → deve validare GDPR
4. ✅ Risk assessment → deve calcolare score corretto
5. ✅ Audit logging → deve salvare log

## 📝 Note

- Il sistema è **retrocompatibile** con `ComplianceCheck` esistente
- Le violazioni sono **loggate localmente** per audit immediato
- I log sono **persistenti** su `localStorage` (ultimi 100)
- **TODO**: Integrazione Supabase per audit completo in produzione

