-- Tables for storing Plaid items, accounts, and transaction mappings

-- Ensure core finance tables exist when running on a fresh project
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ETF', 'Crypto', 'Stock', 'Cash')),
  name TEXT NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  purchase_price DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 2) NOT NULL,
  symbol TEXT,
  live_tracking BOOLEAN DEFAULT false,
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'monthly', 'yearly')),
  linked_investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: plaid_items (stores Plaid item connections)
CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- Should be encrypted in production
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_sync TIMESTAMPTZ,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: plaid_accounts (stores account information)
CREATE TABLE IF NOT EXISTS plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL UNIQUE,
  item_id TEXT NOT NULL REFERENCES plaid_items(item_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  official_name TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  mask TEXT,
  balance_current DECIMAL(15, 2),
  balance_available DECIMAL(15, 2),
  last_balance_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add Plaid transaction tracking columns to expenses table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='expenses' AND column_name='plaid_transaction_id') THEN
    ALTER TABLE expenses ADD COLUMN plaid_transaction_id TEXT UNIQUE;
    ALTER TABLE expenses ADD COLUMN plaid_account_id TEXT REFERENCES plaid_accounts(account_id) ON DELETE SET NULL;
    ALTER TABLE expenses ADD COLUMN plaid_synced_at TIMESTAMPTZ;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_item_id ON plaid_items(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON plaid_accounts(item_id);
CREATE INDEX IF NOT EXISTS idx_expenses_plaid_transaction_id ON expenses(plaid_transaction_id) WHERE plaid_transaction_id IS NOT NULL;

-- RLS Policies for plaid_items
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Plaid items" 
  ON plaid_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Plaid items" 
  ON plaid_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Plaid items" 
  ON plaid_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Plaid items" 
  ON plaid_items FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for plaid_accounts
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Plaid accounts" 
  ON plaid_accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Plaid accounts" 
  ON plaid_accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Plaid accounts" 
  ON plaid_accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Plaid accounts" 
  ON plaid_accounts FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_plaid_items_updated_at 
  BEFORE UPDATE ON plaid_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_accounts_updated_at 
  BEFORE UPDATE ON plaid_accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE plaid_items IS 'Stores Plaid item connections (bank institutions)';
COMMENT ON TABLE plaid_accounts IS 'Stores individual account details from Plaid items';
COMMENT ON COLUMN expenses.plaid_transaction_id IS 'Unique Plaid transaction ID for synced transactions';
COMMENT ON COLUMN expenses.plaid_account_id IS 'Reference to Plaid account that sourced this transaction';

