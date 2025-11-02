// Enhanced Expense Form with validation and event system integration
import { useForm } from '@/hooks/useInteractions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { eventBus, Events } from '@/core/event-system';

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: string;
  type: 'Income' | 'Expense';
  recurring: boolean;
  recurrenceType?: 'weekly' | 'monthly' | 'yearly';
}

interface EnhancedExpenseFormProps {
  onAdd: (expense: Omit<ExpenseFormData, 'amount'> & { amount: number }) => void | Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<ExpenseFormData>;
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing',
  'Transport',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Other'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Rental',
  'Other'
];

export function EnhancedExpenseForm({ onAdd, onCancel, initialValues }: EnhancedExpenseFormProps) {
  const form = useForm<ExpenseFormData>({
    initialValues: {
      date: initialValues?.date || new Date().toISOString().split('T')[0],
      category: initialValues?.category || 'Other',
      description: initialValues?.description || '',
      amount: initialValues?.amount || '',
      type: initialValues?.type || 'Expense',
      recurring: initialValues?.recurring || false,
      recurrenceType: initialValues?.recurrenceType || 'monthly',
    },
    validation: {
      date: (v) => {
        if (!v) return 'Date is required';
        const date = new Date(v);
        if (date > new Date()) return 'Date cannot be in the future';
        return null;
      },
      category: (v) => {
        if (!v) return 'Category is required';
        return null;
      },
      description: (v) => {
        if (!v) return 'Description is required';
        if (v.length < 3) return 'Description must be at least 3 characters';
        return null;
      },
      amount: (v) => {
        if (!v) return 'Amount is required';
        const num = parseFloat(v);
        if (isNaN(num)) return 'Amount must be a valid number';
        if (num <= 0) return 'Amount must be greater than 0';
        return null;
      },
      type: (v) => {
        if (!v || (v !== 'Income' && v !== 'Expense')) return 'Type is required';
        return null;
      },
    },
    onSubmit: async (values) => {
      const expenseData = {
        date: values.date,
        category: values.category,
        description: values.description,
        amount: parseFloat(values.amount),
        type: values.type,
        recurring: values.recurring,
        recurrence_type: values.recurring ? values.recurrenceType : undefined,
      };
      
      await onAdd(expenseData);
      eventBus.emit(Events.TRANSACTION_CREATED, expenseData);
    },
    autoSave: false,
  });

  const categories = form.values.type === 'Expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.submit();
  };

  return (
    <Card className="p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div className="space-y-2">
          <Label>Type</Label>
          <RadioGroup
            value={form.values.type}
            onValueChange={(value) => form.setFieldValue('type', value as 'Income' | 'Expense')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Expense" id="expense" />
              <Label htmlFor="expense" className="font-normal cursor-pointer">
                Expense
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Income" id="income" />
              <Label htmlFor="income" className="font-normal cursor-pointer">
                Income
              </Label>
            </div>
          </RadioGroup>
          {form.errors.type && (
            <Alert variant="destructive" className="mt-1">
              <AlertDescription>{form.errors.type}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={form.values.description}
            onChange={(e) => form.setFieldValue('description', e.target.value)}
            onBlur={() => form.setFieldTouched('description')}
            placeholder="Enter description"
            className={form.errors.description && form.touched.description ? 'border-red-500' : ''}
          />
          {form.errors.description && form.touched.description && (
            <Alert variant="destructive" className="mt-1">
              <AlertDescription>{form.errors.description}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={form.values.amount}
            onChange={(e) => form.setFieldValue('amount', e.target.value)}
            onBlur={() => form.setFieldTouched('amount')}
            placeholder="0.00"
            className={form.errors.amount && form.touched.amount ? 'border-red-500' : ''}
          />
          {form.errors.amount && form.touched.amount && (
            <Alert variant="destructive" className="mt-1">
              <AlertDescription>{form.errors.amount}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={form.values.category}
            onValueChange={(value) => form.setFieldValue('category', value)}
          >
            <SelectTrigger id="category" className={form.errors.category && form.touched.category ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.errors.category && form.touched.category && (
            <Alert variant="destructive" className="mt-1">
              <AlertDescription>{form.errors.category}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={form.values.date}
            onChange={(e) => form.setFieldValue('date', e.target.value)}
            onBlur={() => form.setFieldTouched('date')}
            max={new Date().toISOString().split('T')[0]}
            className={form.errors.date && form.touched.date ? 'border-red-500' : ''}
          />
          {form.errors.date && form.touched.date && (
            <Alert variant="destructive" className="mt-1">
              <AlertDescription>{form.errors.date}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Recurring */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="recurring"
            checked={form.values.recurring}
            onCheckedChange={(checked) => form.setFieldValue('recurring', !!checked)}
          />
          <Label htmlFor="recurring" className="font-normal cursor-pointer">
            This is a recurring transaction
          </Label>
        </div>

        {/* Recurrence Type */}
        {form.values.recurring && (
          <div className="space-y-2">
            <Label htmlFor="recurrenceType">Recurrence Type</Label>
            <Select
              value={form.values.recurrenceType || 'monthly'}
              onValueChange={(value) => form.setFieldValue('recurrenceType', value as 'weekly' | 'monthly' | 'yearly')}
            >
              <SelectTrigger id="recurrenceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={form.isSubmitting || !form.isDirty}
            className="flex-1"
          >
            {form.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Transaction'
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {form.isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset()}
              className="text-muted-foreground"
            >
              Reset
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

