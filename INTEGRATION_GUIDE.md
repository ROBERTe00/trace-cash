# Integration Guide - New Systems Implementation

## 🎯 Overview

This guide explains how to integrate the new foundation systems into existing components.

## 📦 New Systems Available

### 1. Event System (`src/core/event-system.ts`)
**Global event bus for cross-component communication**

```typescript
import { eventBus, Events } from '@/core/event-system';

// Emit event
eventBus.emit(Events.TRANSACTION_CREATED, { id: '123' });

// Listen to event
const unsubscribe = eventBus.on(Events.TRANSACTION_CREATED, (data) => {
  console.log('Transaction created:', data);
});
```

### 2. Enhanced State Manager (`src/core/enhanced-state-manager.ts`)
**Undo/redo, optimistic updates, batch operations**

```typescript
import { enhancedStateManager } from '@/core/enhanced-state-manager';

// Undo last action
const canUndo = enhancedStateManager.undo();

// Optimistic update
const rollback = enhancedStateManager.optimisticUpdate('transactions', newData, () => {
  console.log('Rollback needed');
});
```

### 3. Common Hooks (`src/hooks/useInteractions.ts`)
**`useModal`, `useForm`, `useFilter`**

```typescript
import { useModal, useForm, useFilter } from '@/hooks/useInteractions';

// Modal
const { isOpen, open, close } = useModal();

// Form with validation
const form = useForm({
  initialValues: { amount: 0, category: '' },
  validation: {
    amount: (v) => v > 0 || 'Amount must be positive'
  },
  onSubmit: async (values) => { /* ... */ }
});

// Filter
const { filters, filtered, updateFilter } = useFilter({
  items: transactions,
  onFiltered: setDisplayedItems
});
```

### 4. Advanced Filter System (`src/components/filters/AdvancedFilterSystem.tsx`)
**Compositable filter UI component**

```typescript
import { AdvancedFilterSystem } from '@/components/filters/AdvancedFilterSystem';

<AdvancedFilterSystem
  items={transactions}
  onFiltered={setFilteredTransactions}
  showCategories={true}
  showDateRange={true}
  showAmountRange={true}
  persistToURL={true}
/>
```

### 5. Enhanced Expense Form (`src/components/forms/EnhancedExpenseForm.tsx`)
**Form with real-time validation**

```typescript
import { EnhancedExpenseForm } from '@/components/forms/EnhancedExpenseForm';

<EnhancedExpenseForm
  onAdd={async (expense) => {
    await createExpense(expense);
  }}
  onCancel={() => setShowForm(false)}
/>
```

### 6. Modal System (`src/components/modals/ModalSystem.tsx`)
**Complete modal with focus management**

```typescript
import { Modal } from '@/components/modals/ModalSystem';
import { useModal } from '@/hooks/useInteractions';

const { isOpen, open, close } = useModal();

<Modal
  isOpen={isOpen}
  onClose={close}
  title="Add Transaction"
  size="lg"
>
  <EnhancedExpenseForm onAdd={handleAdd} />
</Modal>
```

### 7. Chart Data Hooks (`src/hooks/useChartData.ts`)
**Real data hooks for charts**

```typescript
import { useNetWorthChart, useSpendingChart } from '@/hooks/useChartData';

// Net Worth Chart
const { chartData, isLoading, isEmpty } = useNetWorthChart('1M');

// Spending Chart
const { chartData } = useSpendingChart();
```

### 8. Chart Export (`src/lib/chartExport.ts`)
**Export charts as PNG/PDF/CSV**

```typescript
import { exportChartAsPNG, exportChartAsPDF, exportChartDataAsCSV } from '@/lib/chartExport';

// Export as PNG
await exportChartAsPNG(chartElement, 'chart.png');

// Export as PDF
await exportChartAsPDF(chartElement, 'chart.pdf', { title: 'My Chart' });

// Export data as CSV
exportChartDataAsCSV(labels, datasets, 'chart-data.csv');
```

## 🔄 Migration Steps

### Step 1: Replace Manual Filters with AdvancedFilterSystem

**Before:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState('all');
const filtered = expenses.filter(e => /* manual filtering */);
```

**After:**
```typescript
import { AdvancedFilterSystem } from '@/components/filters/AdvancedFilterSystem';

const [filteredExpenses, setFilteredExpenses] = useState(expenses);

<AdvancedFilterSystem
  items={expenses}
  onFiltered={setFilteredExpenses}
  showCategories={true}
  showSearch={true}
/>
```

### Step 2: Replace Forms with EnhancedExpenseForm

**Before:**
```typescript
<ExpenseForm onAdd={handleAdd} />
```

**After:**
```typescript
import { EnhancedExpenseForm } from '@/components/forms/EnhancedExpenseForm';

<EnhancedExpenseForm
  onAdd={async (expense) => {
    await createExpense(expense);
  }}
  onCancel={() => setShowForm(false)}
/>
```

### Step 3: Use Modal System

**Before:**
```typescript
const [isOpen, setIsOpen] = useState(false);
// Manual focus management, ESC handling, etc.
```

**After:**
```typescript
import { useModal } from '@/hooks/useInteractions';
import { Modal } from '@/components/modals/ModalSystem';

const { isOpen, open, close } = useModal();

<Modal isOpen={isOpen} onClose={close} title="Add Transaction">
  {/* content */}
</Modal>
```

### Step 4: Update Charts to Use Real Data Hooks

**Before:**
```typescript
const chartData = {
  labels: mockData.map(d => d.month),
  datasets: [{ data: mockData.map(d => d.value) }]
};
```

**After:**
```typescript
import { useNetWorthChart } from '@/hooks/useChartData';

const { chartData, isLoading, isEmpty } = useNetWorthChart('1M');

if (isEmpty) return <EmptyState />;
if (chartData) return <Line data={chartData} />;
```

### Step 5: Add Export Functionality

**Before:**
```typescript
// No export functionality
```

**After:**
```typescript
import { exportChartAsPNG } from '@/lib/chartExport';

const chartRef = useRef<HTMLDivElement>(null);

<div ref={chartRef}>
  <Chart data={chartData} />
</div>
<Button onClick={() => exportChartAsPNG(chartRef.current, 'chart.png')}>
  Export PNG
</Button>
```

## 📝 Example: Complete Transactions Page Integration

```typescript
import { EnhancedExpenseForm } from '@/components/forms/EnhancedExpenseForm';
import { AdvancedFilterSystem } from '@/components/filters/AdvancedFilterSystem';
import { Modal } from '@/components/modals/ModalSystem';
import { useModal } from '@/hooks/useInteractions';
import { useExpenses } from '@/hooks/useExpenses';
import { eventBus, Events } from '@/core/event-system';

export default function Transactions() {
  const { expenses, createExpense } = useExpenses();
  const addModal = useModal();
  const [filteredExpenses, setFilteredExpenses] = useState(expenses || []);

  // Listen to events
  useEffect(() => {
    const unsubscribe = eventBus.on(Events.TRANSACTION_CREATED, (data) => {
      console.log('New transaction:', data);
    });
    return unsubscribe;
  }, []);

  return (
    <div>
      {/* Filter System */}
      <AdvancedFilterSystem
        items={expenses || []}
        onFiltered={setFilteredExpenses}
        showCategories={true}
        showDateRange={true}
        showSearch={true}
      />

      {/* Transactions List */}
      {filteredExpenses.map(expense => (/* ... */))}

      {/* Add Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        title="Add Transaction"
      >
        <EnhancedExpenseForm
          onAdd={async (expense) => {
            await createExpense.mutateAsync(expense);
            addModal.close();
          }}
          onCancel={addModal.close}
        />
      </Modal>
    </div>
  );
}
```

## ✅ Checklist for Component Migration

For each component, check:

- [ ] Forms use `EnhancedExpenseForm` or `useForm` hook
- [ ] Filters use `AdvancedFilterSystem` or `useFilter` hook
- [ ] Modals use `Modal` component with `useModal` hook
- [ ] Charts use hooks from `useChartData`
- [ ] Export buttons connected to `chartExport` functions
- [ ] Event listeners for real-time updates
- [ ] Proper error handling and loading states
- [ ] Empty states when no data

## 🚀 Next Steps

1. **Integrate in Transactions page** - Replace manual filters and forms
2. **Update Dashboard widgets** - Use enhanced widgets with real data
3. **Add real-time updates** - Use `useRealTimeUpdates` hook
4. **Implement export** - Add export buttons to all charts
5. **Mobile gestures** - Add swipe handlers (Week 4)

## 📚 Related Documentation

- `IMPLEMENTATION_PROGRESS.md` - Overall progress tracking
- `COMPLIANCE_ENGINE_IMPLEMENTATION.md` - Compliance system
- `REAL_DATA_CONNECTOR_IMPLEMENTATION.md` - Data integration
- `CORE_AI_ENGINE.md` - AI engine documentation



