/**
 * Plaid Integration Service
 * Handles credit card connection, OAuth flow, and transaction syncing
 */

import { supabase } from "@/integrations/supabase/client";

export interface PlaidLinkToken {
  link_token: string;
  expiration: string;
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name?: string;
  type: string;
  subtype?: string;
  balance_current: number;
  balance_available?: number;
  mask?: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category?: string[];
  pending: boolean;
}

/**
 * Create a Plaid Link token for user to connect their bank
 */
export async function createLinkToken(): Promise<PlaidLinkToken> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Call Supabase Edge Function to create link token
    const { data, error } = await supabase.functions.invoke('plaid-create-link-token', {
      body: { user_id: user.id }
    });

    if (error) throw error;

    return data as PlaidLinkToken;
  } catch (error) {
    console.error('❌ [Plaid] Failed to create link token:', error);
    throw new Error('Failed to initialize Plaid. Please try again.');
  }
}

/**
 * Exchange public token for access token after successful connection
 */
export async function exchangePublicToken(publicToken: string): Promise<{ item_id: string; accounts: PlaidAccount[] }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Call Supabase Edge Function to exchange token
    const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
      body: {
        public_token: publicToken,
        user_id: user.id
      }
    });

    if (error) throw error;

    // Store connection in database
    await storeConnection(user.id, data.item_id, data.accounts);

    return data;
  } catch (error) {
    console.error('❌ [Plaid] Failed to exchange token:', error);
    throw new Error('Failed to connect account. Please try again.');
  }
}

/**
 * Store Plaid connection in database
 */
async function storeConnection(userId: string, itemId: string, accounts: PlaidAccount[]): Promise<void> {
  try {
    // Store item
    const { error: itemError } = await supabase
      .from('plaid_items')
      .upsert({
        user_id: userId,
        item_id: itemId,
        status: 'active',
        last_sync: new Date().toISOString()
      });

    if (itemError) throw itemError;

    // Store accounts
    for (const account of accounts) {
      const { error: accountError } = await supabase
        .from('plaid_accounts')
        .upsert({
          user_id: userId,
          account_id: account.account_id,
          item_id: itemId,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balance_current: account.balance_current,
          balance_available: account.balance_available
        });

      if (accountError) throw accountError;
    }

    console.log('✅ [Plaid] Connection stored successfully');
  } catch (error) {
    console.error('❌ [Plaid] Failed to store connection:', error);
    throw error;
  }
}

/**
 * Fetch transactions from Plaid and sync to database
 */
export async function syncTransactions(itemId: string): Promise<PlaidTransaction[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Call Supabase Edge Function to fetch transactions
    const { data, error } = await supabase.functions.invoke('plaid-sync-transactions', {
      body: {
        item_id: itemId,
        user_id: user.id
      }
    });

    if (error) throw error;

    // Store transactions in database
    for (const transaction of data.transactions) {
      await storeTransaction(user.id, itemId, transaction);
    }

    return data.transactions;
  } catch (error) {
    console.error('❌ [Plaid] Failed to sync transactions:', error);
    throw new Error('Failed to sync transactions. Please try again.');
  }
}

/**
 * Store a single transaction in database
 */
async function storeTransaction(userId: string, itemId: string, transaction: PlaidTransaction): Promise<void> {
  try {
    const { error } = await supabase
      .from('expenses')
      .upsert({
        user_id: userId,
        type: transaction.amount > 0 ? 'Income' : 'Expense',
        amount: Math.abs(transaction.amount),
        category: categorizeTransaction(transaction),
        description: transaction.merchant_name || transaction.name,
        date: transaction.date,
        recurring: false,
        plaid_transaction_id: transaction.transaction_id,
        plaid_account_id: transaction.account_id
      }, {
        onConflict: 'plaid_transaction_id'
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      throw error;
    }
  } catch (error) {
    console.error('❌ [Plaid] Failed to store transaction:', error);
  }
}

/**
 * Categorize transaction based on Plaid categories
 */
function categorizeTransaction(transaction: PlaidTransaction): string {
  if (!transaction.category || transaction.category.length === 0) {
    return 'Other';
  }

  const category = transaction.category[0].toLowerCase();

  if (category.includes('food') || category.includes('restaurant')) {
    return 'Food & Dining';
  } else if (category.includes('transport') || category.includes('gas')) {
    return 'Transportation';
  } else if (category.includes('shop') || category.includes('retail')) {
    return 'Shopping';
  } else if (category.includes('entertainment') || category.includes('recreation')) {
    return 'Entertainment';
  } else if (category.includes('health') || category.includes('medical')) {
    return 'Healthcare';
  } else if (category.includes('utilities') || category.includes('bill') || category.includes('insurance')) {
    return 'Bills & Utilities';
  } else if (category.includes('income') || category.includes('deposit')) {
    return 'Income';
  } else {
    return 'Other';
  }
}

/**
 * Get all connected Plaid accounts for current user
 */
export async function getConnectedAccounts(): Promise<PlaidAccount[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return data as PlaidAccount[];
  } catch (error) {
    console.error('❌ [Plaid] Failed to get connected accounts:', error);
    return [];
  }
}

/**
 * Remove a Plaid connection
 */
export async function removeConnection(itemId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Call Edge Function to remove item from Plaid
    await supabase.functions.invoke('plaid-remove-item', {
      body: { item_id: itemId, user_id: user.id }
    });

    // Remove from database
    await supabase
      .from('plaid_items')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', user.id);

    console.log('✅ [Plaid] Connection removed successfully');
  } catch (error) {
    console.error('❌ [Plaid] Failed to remove connection:', error);
    throw new Error('Failed to remove connection. Please try again.');
  }
}

