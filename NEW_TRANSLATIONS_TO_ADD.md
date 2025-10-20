# 📝 New Translation Keys to Add

## Where to Add
Add these keys in `src/contexts/AppContext.tsx` in both `en` and `it` sections:

---

## English Translations (add to `en:` object around line 46)

```typescript
// Search
"search.transactions": "Search transactions",
"search.placeholder": "Search transactions by description…",

// Budget
"budget.exceeded": "Budget exceeded! You spent",
"budget.on": "on",
"budget.modify": "Modify budget",
"budget.used": "Budget Used",
"budget.remaining": "remaining",

// Metrics
"metrics.totalExpenses": "Total Expenses",
"metrics.totalIncome": "Total Income",
"metrics.budgetUsed": "Budget Used",
"metrics.topCategory": "Top Category",
"metrics.initialBalance": "Initial Balance",
"metrics.outflows": "Outflows",
"metrics.inflows": "Inflows",
"metrics.closingBalance": "Closing Balance",
"metrics.vs": "vs",
"metrics.lastMonth": "last month",

// Categories
"categories.top": "Top Spending Categories",
"categories.breakdown": "Category Breakdown",

// Transactions
"transactions.recent": "Recent Transactions",
"transactions.noTransactions": "No transactions found",
"transactions.count": "transactions",
"transactions.transaction": "transaction",

// Import
"import.quick": "Quick Import",
"import.goToFull": "Go to Full Import",
"import.voice": "Voice Input",
"import.csv": "CSV/Excel",
"import.pdf": "PDF Statement",

// Table
"table.date": "Date",
"table.description": "Description",
"table.outflow": "Outflow",
"table.inflow": "Inflow",
"table.balance": "Balance",
"table.category": "Category",
"table.actions": "Actions",
"table.sortBy": "Sort by",

// Actions
"actions.edit": "Edit",
"actions.delete": "Delete",
"actions.sync": "Sync",
"actions.disconnect": "Disconnect",
"actions.connect": "Connect",
```

---

## Italian Translations (add to `it:` object around line 310)

```typescript
// Search
"search.transactions": "Cerca transazioni",
"search.placeholder": "Cerca transazioni per descrizione…",

// Budget
"budget.exceeded": "Budget superato! Hai speso",
"budget.on": "su",
"budget.modify": "Modifica budget",
"budget.used": "Budget Utilizzato",
"budget.remaining": "rimanenti",

// Metrics
"metrics.totalExpenses": "Spese Totali",
"metrics.totalIncome": "Entrate Totali",
"metrics.budgetUsed": "Budget Utilizzato",
"metrics.topCategory": "Categoria Principale",
"metrics.initialBalance": "Saldo Iniziale",
"metrics.outflows": "Denaro in Uscita",
"metrics.inflows": "Denaro in Entrata",
"metrics.closingBalance": "Saldo di Chiusura",
"metrics.vs": "vs",
"metrics.lastMonth": "mese scorso",

// Categories
"categories.top": "Top Categorie di Spesa",
"categories.breakdown": "Dettaglio Categorie",

// Transactions
"transactions.recent": "Transazioni Recenti",
"transactions.noTransactions": "Nessuna transazione trovata",
"transactions.count": "transazioni",
"transactions.transaction": "transazione",

// Import
"import.quick": "Importa Rapido",
"import.goToFull": "Vai a Importa Completo",
"import.voice": "Input Vocale",
"import.csv": "CSV/Excel",
"import.pdf": "Estratto Conto PDF",

// Table
"table.date": "Data",
"table.description": "Descrizione",
"table.outflow": "Denaro in Uscita",
"table.inflow": "Denaro in Entrata",
"table.balance": "Saldo",
"table.category": "Categoria",
"table.actions": "Azioni",
"table.sortBy": "Ordina per",

// Actions
"actions.edit": "Modifica",
"actions.delete": "Elimina",
"actions.sync": "Sincronizza",
"actions.disconnect": "Disconnetti",
"actions.connect": "Connetti",
```

---

## Components to Update

### 1. DesignedTransactionsTab.tsx
```typescript
// BEFORE:
placeholder="Cerca transazioni per descrizione…"
"+ Aggiungi"
"Budget superato! Hai speso"
"Spese Totali"
"Budget Utilizzato"
"Categoria Principale"
"Top Categorie di Spesa"
"Transazioni Recenti"

// AFTER:
placeholder={t('search.placeholder')}
{t('add')}
{t('budget.exceeded')}
{t('metrics.totalExpenses')}
{t('metrics.budgetUsed')}
{t('metrics.topCategory')}
{t('categories.top')}
{t('transactions.recent')}
```

### 2. ImprovedBalanceSummary.tsx
```typescript
// BEFORE:
"Riepilogo del Saldo"
"Saldo Iniziale"
"Denaro in Uscita"
"Denaro in Entrata"
"Saldo di Chiusura"

// AFTER:
{t('metrics.balanceSummary')}
{t('metrics.initialBalance')}
{t('metrics.outflows')}
{t('metrics.inflows')}
{t('metrics.closingBalance')}
```

### 3. EnhancedTransactionTable.tsx
```typescript
// BEFORE:
"Data"
"Descrizione"
"Denaro in Uscita"
"Denaro in Entrata"
"Saldo"
"Categoria"
"Azioni"

// AFTER:
{t('table.date')}
{t('table.description')}
{t('table.outflow')}
{t('table.inflow')}
{t('table.balance')}
{t('table.category')}
{t('table.actions')}
```

---

## Quick Implementation Steps

1. Copy English translations above
2. Paste into `AppContext.tsx` in the `en:` object (after line ~80)
3. Copy Italian translations
4. Paste into `AppContext.tsx` in the `it:` object (after line ~340)
5. Update 3 components to use `t()` function
6. Test by switching language in Settings

---

**Status:** Ready to implement (estimated 20 minutes)

