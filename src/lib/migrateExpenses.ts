import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LocalStorageExpense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  recurring?: boolean;
  recurrenceType?: 'weekly' | 'monthly' | 'yearly';
}

export const MIGRATION_KEY = 'trace-cash-migration-completed';
export const EXPENSES_KEY = 'trace-cash-expenses';

export async function migrateLocalStorageToDatabase(userId: string): Promise<boolean> {
  try {
    // Check if migration already done
    const migrationDone = localStorage.getItem(MIGRATION_KEY);
    if (migrationDone === 'true') {
      console.log('Migration already completed');
      return true;
    }

    // Get expenses from localStorage
    const expensesData = localStorage.getItem(EXPENSES_KEY);
    if (!expensesData) {
      console.log('No expenses to migrate');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return true;
    }

    const expenses: LocalStorageExpense[] = JSON.parse(expensesData);
    
    if (expenses.length === 0) {
      console.log('No expenses to migrate');
      localStorage.setItem(MIGRATION_KEY, 'true');
      return true;
    }

    console.log(`Migrating ${expenses.length} expenses to database...`);

    // Transform data for database
    const dbExpenses = expenses.map(expense => ({
      user_id: userId,
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      type: expense.type,
      recurring: expense.recurring || false,
      recurrence_type: expense.recurrenceType || null
    }));

    // Insert in batches of 50 to avoid payload limits
    const batchSize = 50;
    for (let i = 0; i < dbExpenses.length; i += batchSize) {
      const batch = dbExpenses.slice(i, i + batchSize);
      const { error } = await supabase
        .from('expenses')
        .insert(batch);

      if (error) {
        console.error('Migration error:', error);
        throw error;
      }

      console.log(`Migrated batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(dbExpenses.length / batchSize)}`);
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true');
    
    // Keep backup in localStorage for now (user can manually clear later)
    console.log('Migration completed successfully');
    
    toast.success(`Successfully migrated ${expenses.length} expenses to cloud storage! 🎉`);
    
    return true;
  } catch (error) {
    console.error('Failed to migrate expenses:', error);
    toast.error('Failed to migrate expenses. Please try again.');
    return false;
  }
}

export function hasPendingMigration(): boolean {
  const migrationDone = localStorage.getItem(MIGRATION_KEY);
  const expensesData = localStorage.getItem(EXPENSES_KEY);
  
  if (migrationDone === 'true') {
    return false;
  }
  
  if (!expensesData) {
    return false;
  }
  
  try {
    const expenses = JSON.parse(expensesData);
    return Array.isArray(expenses) && expenses.length > 0;
  } catch {
    return false;
  }
}
