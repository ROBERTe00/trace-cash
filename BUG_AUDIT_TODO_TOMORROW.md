# 🐛 Bug Audit & Resolution Plan - To Do Tomorrow

**Date Created:** October 20, 2025  
**Priority:** High  
**Estimated Time:** 2-3 hours

---

## 📋 Bugs Identified (Quick Scan)

### 1. Mobile Responsiveness Issues

#### **Transactions Tab:**
- ✅ Already using `useIsMobile()` hook
- ⚠️ Possible issue: TabsList may overflow on very small screens (<375px)
- ⚠️ DesignedTransactionsTab sticky header needs mobile testing

**Fix Tomorrow:**
```tsx
// In src/pages/Transactions.tsx
<TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted rounded-xl overflow-x-auto">
  // Add overflow-x-auto for very small screens
```

#### **Investments Tab:**
- ⚠️ Need to check if InvestmentTable has horizontal scroll on mobile
- ⚠️ Check if sub-tabs (portfolio, analysis, etc.) stack properly

**Fix Tomorrow:**
- Test on mobile viewport (375px)
- Add responsive wrappers if needed

---

### 2. Data Synchronization

#### **Plaid Sync:**
- ✅ Service implemented
- ❌ Not active (needs API credentials)
- ⏳ No real-time webhook yet

**To Implement Tomorrow:**
```typescript
// Create supabase/functions/plaid-webhook/index.ts
// Handle TRANSACTIONS, ITEM_STATUS events
// Auto-sync on webhook trigger
```

#### **PDF Import:**
- ✅ Working perfectly (81/81 transactions)
- ⏳ Could add real-time update to dashboard after import

**Enhancement Tomorrow:**
- Trigger dashboard refresh after PDF import completes
- Add toast notification with stats

---

### 3. Multi-Language (i18n)

#### **Current State:**
- ⚠️ Using `useApp()` hook with `t()` function
- ⚠️ Some hardcoded strings in new components

**Strings to Translate Tomorrow:**
```typescript
// In DesignedTransactionsTab.tsx
"Cerca transazioni per descrizione…" → {t('search.placeholder')}
"+ Aggiungi" → {t('add.button')}
"Budget superato!" → {t('budget.exceeded')}
"Spese Totali" → {t('metrics.totalExpenses')}
"Budget Utilizzato" → {t('metrics.budgetUsed')}
"Categoria Principale" → {t('metrics.topCategory')}
"Top Categorie di Spesa" → {t('categories.top')}
"Transazioni Recenti" → {t('transactions.recent')}
```

**Also Check:**
- ImprovedBalanceSummary.tsx
- EnhancedTransactionTable.tsx
- PlaidDemo.tsx

---

### 4. Price Sync for ETFs/Stocks/Crypto

#### **Files to Audit:**
- `src/hooks/useLivePrice.ts`
- `src/hooks/useLivePricePolling.ts`
- `src/lib/marketData.ts`
- `supabase/functions/update-live-prices/index.ts`

#### **Potential Issues:**
- ⚠️ Currency conversion USD → EUR accuracy
- ⚠️ API rate limits causing stale data
- ⚠️ Caching strategy may be outdated

**To Fix Tomorrow:**
1. **Audit API sources:**
   - Check Yahoo Finance API calls
   - Verify CoinGecko for crypto
   - Test with real symbols (BTC, ETH, AAPL, etc.)

2. **Fix Currency Conversion:**
   ```typescript
   // Use real-time exchange rate API
   // Cache for 1 hour
   // Fallback to ECB rates
   ```

3. **Implement Better Caching:**
   ```typescript
   // localStorage cache with TTL
   // Supabase cache table
   // Invalidate on manual refresh
   ```

4. **Test Accuracy:**
   - Compare with real market prices
   - Verify EUR conversions match expected values
   - Test with Revolut PDF amounts (EUR)

---

## 🔍 Detailed Audit Plan for Tomorrow

### Phase 1: Mobile Responsiveness (30 min)

**Test on DevTools:**
- Viewport: 375px (iPhone SE)
- Viewport: 768px (iPad)
- Viewport: 1920px (Desktop)

**Check:**
1. Transactions tab:
   - Sticky header doesn't overflow
   - Metric cards stack properly
   - Category chart fits screen
   - Transaction list scrolls correctly

2. Investments tab:
   - Table has horizontal scroll if needed
   - Charts responsive
   - Forms stack on mobile

3. All tabs:
   - TabsList doesn't overflow
   - Content visible without horizontal scroll

**Fixes:**
```css
/* Add to components as needed */
className="overflow-x-auto"
className="min-w-0" // Prevents flex overflow
className="flex-wrap" // Allows wrapping
```

---

### Phase 2: Data Sync (45 min)

**Plaid Real-Time:**
1. Create webhook endpoint
2. Handle transaction events
3. Update expenses table automatically
4. Trigger UI refresh

**PDF Import:**
1. Add callback after import
2. Refresh dashboard data
3. Show success notification with count

**Implementation:**
```typescript
// In UploadContext or DesignedTransactionsTab
const handleImportComplete = (transactions) => {
  // Trigger data refresh
  queryClient.invalidateQueries(['expenses']);
  
  // Show notification
  toast.success(`${transactions.length} transactions imported!`);
};
```

---

### Phase 3: i18n Strings (30 min)

**Create Translation Keys:**
```json
// public/locales/it/translation.json
{
  "search": {
    "placeholder": "Cerca transazioni per descrizione…"
  },
  "add": {
    "button": "Aggiungi"
  },
  "budget": {
    "exceeded": "Budget superato! Hai speso {{spent}} su {{budget}}",
    "modify": "Modifica budget"
  },
  "metrics": {
    "totalExpenses": "Spese Totali",
    "budgetUsed": "Budget Utilizzato",
    "topCategory": "Categoria Principale",
    "remaining": "rimanenti"
  }
}

// public/locales/en/translation.json
{
  "search": {
    "placeholder": "Search transactions by description…"
  },
  // ... etc
}
```

**Update Components:**
```typescript
import { useApp } from "@/contexts/AppContext";

const { t } = useApp();

<Input placeholder={t('search.placeholder')} />
<Button>{t('add.button')}</Button>
```

---

### Phase 4: Price Sync Accuracy (60 min)

**Audit Current Implementation:**
```typescript
// Read: src/lib/marketData.ts
// Check API endpoints
// Verify currency conversion logic
```

**Issues to Fix:**
1. **Inaccurate Exchange Rates:**
   - Use https://api.exchangerate-api.com/v4/latest/USD
   - Or ECB API: https://api.exchangerate.host/latest
   - Cache for 1 hour

2. **Wrong Crypto Prices:**
   - Verify CoinGecko API calls
   - Check symbol mapping (BTC, ETH, DOGE, XRP)
   - Ensure vs_currency=eur

3. **Stock/ETF Prices:**
   - Yahoo Finance may have rate limits
   - Add error handling
   - Fallback to cached prices

**Implementation:**
```typescript
// src/lib/currencyConverter.ts (NEW)
export async function getExchangeRate(from: string, to: string): Promise<number> {
  const cacheKey = `rate_${from}_${to}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 3600000) { // 1 hour
      return rate;
    }
  }
  
  const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
  const data = await response.json();
  const rate = data.rates[to];
  
  localStorage.setItem(cacheKey, JSON.stringify({
    rate,
    timestamp: Date.now()
  }));
  
  return rate;
}
```

---

## 🧪 Testing Checklist for Tomorrow

### Mobile:
- [ ] Open DevTools → Toggle device toolbar
- [ ] Test iPhone SE (375px)
- [ ] Test iPad (768px)
- [ ] Check all tabs for overflow
- [ ] Verify touch targets ≥44px
- [ ] Test landscape orientation

### Data Sync:
- [ ] Import PDF → Dashboard updates
- [ ] Plaid sync → Transactions appear
- [ ] Real-time subscription working
- [ ] No stale data

### Languages:
- [ ] Switch IT → EN → IT
- [ ] No layout shifts
- [ ] All strings translated
- [ ] Date formats correct (IT vs EN)

### Prices:
- [ ] Check BTC price matches CoinGecko
- [ ] Check AAPL stock price matches Yahoo
- [ ] Verify EUR conversion accurate
- [ ] Test with manual refresh
- [ ] Check cache expiration

---

## 📝 Files to Create Tomorrow

1. `src/lib/currencyConverter.ts` - Exchange rate service
2. `supabase/functions/plaid-webhook/index.ts` - Real-time webhook
3. `public/locales/it/translation.json` - Italian translations
4. `public/locales/en/translation.json` - English translations
5. `src/hooks/useRealTimeSync.ts` - Real-time data subscription
6. `MOBILE_FIXES.md` - Mobile bug documentation
7. `I18N_IMPLEMENTATION.md` - Translation guide
8. `PRICE_SYNC_FIX.md` - Price accuracy fixes

---

## 🎯 Success Criteria for Tomorrow

| Area | Target | Current | Gap |
|------|--------|---------|-----|
| Mobile Responsiveness | 100% | ~85% | Fix overflows |
| Real-time Sync | Working | Partial | Add webhooks |
| i18n Coverage | 100% | ~60% | Translate all |
| Price Accuracy | 100% | ~95% | Fix conversion |

---

## 🚀 Tomorrow's Workflow

1. **Morning (1h):** Mobile fixes + testing
2. **Mid-day (1h):** i18n implementation
3. **Afternoon (1h):** Price sync accuracy
4. **Evening (30min):** Real-time sync + testing

---

## 📦 Dependencies May Need Tomorrow

```bash
# For i18n
npm install react-i18next i18next

# For currency conversion
npm install currency.js

# For real-time
# (Already have Supabase real-time)
```

---

## 💡 Quick Wins for Tomorrow

### Easy Fixes (<15 min each):
1. Add `overflow-x-auto` to TabsList
2. Add `min-w-0` to flex containers
3. Replace hardcoded strings with `t()` calls
4. Add real-time subscription to expenses

### Medium Fixes (30 min each):
1. Implement currency converter service
2. Fix price sync caching
3. Test and fix mobile layouts

### Complex (60 min):
1. Plaid webhook implementation
2. Complete i18n setup
3. Price accuracy validation

---

## 🎯 Priority Order Tomorrow

**P0 (Must Fix):**
1. Mobile tab overflow
2. Hardcoded strings → i18n

**P1 (Should Fix):**
1. Price sync accuracy
2. Real-time data sync

**P2 (Nice to Have):**
1. Plaid webhook
2. Enhanced caching

---

**TUTTO DOCUMENTATO PER DOMANI!** 📚

**Per Oggi:**
1. Esegui il commit con i comandi che ti ho dato
2. Push su GitHub
3. Verifica sync con Lovable

**Domani:**
1. Usa questo file come guida
2. Inizia con P0 bugs
3. Testa su mobile

**Buon riposo! 👋**

