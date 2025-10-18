-- Plaid Integration Database Schema
-- Tables for credit card integration and transaction tracking

-- Connected accounts table
CREATE TABLE IF NOT EXISTS connected_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plaid_account_id TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('credit', 'debit', 'savings', 'checking')),
    last_four TEXT NOT NULL,
    access_token TEXT NOT NULL, -- In production, encrypt this field
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync TIMESTAMP WITH TIME ZONE,
    balance DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, plaid_account_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plaid_transaction_id TEXT UNIQUE,
    account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    merchant TEXT,
    is_pending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_type TEXT NOT NULL,
    webhook_code TEXT NOT NULL,
    item_id TEXT,
    account_id UUID REFERENCES connected_accounts(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI categorization results table
CREATE TABLE IF NOT EXISTS ai_categorizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    original_category TEXT,
    ai_category TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ai_model TEXT DEFAULT 'gemini-2.5-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences for Plaid integration
CREATE TABLE IF NOT EXISTS plaid_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    auto_categorization BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    webhook_enabled BOOLEAN DEFAULT false,
    sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_institution ON connected_accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(webhook_type);

-- Row Level Security (RLS) policies
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_categorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view their own connected accounts" ON connected_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts" ON connected_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts" ON connected_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts" ON connected_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions from their accounts" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM connected_accounts 
            WHERE connected_accounts.id = transactions.account_id 
            AND connected_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transactions to their accounts" ON transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM connected_accounts 
            WHERE connected_accounts.id = transactions.account_id 
            AND connected_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update transactions from their accounts" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM connected_accounts 
            WHERE connected_accounts.id = transactions.account_id 
            AND connected_accounts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete transactions from their accounts" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM connected_accounts 
            WHERE connected_accounts.id = transactions.account_id 
            AND connected_accounts.user_id = auth.uid()
        )
    );

-- RLS Policies for webhook_events
CREATE POLICY "Users can view webhook events for their accounts" ON webhook_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM connected_accounts 
            WHERE connected_accounts.id = webhook_events.account_id 
            AND connected_accounts.user_id = auth.uid()
        )
    );

-- RLS Policies for ai_categorizations
CREATE POLICY "Users can view AI categorizations for their transactions" ON ai_categorizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions 
            JOIN connected_accounts ON connected_accounts.id = transactions.account_id
            WHERE transactions.id = ai_categorizations.transaction_id 
            AND connected_accounts.user_id = auth.uid()
        )
    );

-- RLS Policies for plaid_user_preferences
CREATE POLICY "Users can view their own preferences" ON plaid_user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON plaid_user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON plaid_user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_connected_accounts_updated_at 
    BEFORE UPDATE ON connected_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_user_preferences_updated_at 
    BEFORE UPDATE ON plaid_user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process webhook events
CREATE OR REPLACE FUNCTION process_plaid_webhook()
RETURNS TRIGGER AS $$
BEGIN
    -- Process different webhook types
    CASE NEW.webhook_type
        WHEN 'TRANSACTIONS' THEN
            -- Handle transaction updates
            PERFORM 1; -- Placeholder for transaction processing logic
        WHEN 'ACCOUNTS' THEN
            -- Handle account updates
            PERFORM 1; -- Placeholder for account processing logic
        WHEN 'ITEM' THEN
            -- Handle item updates
            PERFORM 1; -- Placeholder for item processing logic
        ELSE
            -- Unknown webhook type
            RAISE NOTICE 'Unknown webhook type: %', NEW.webhook_type;
    END CASE;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for webhook processing
CREATE TRIGGER process_webhook_events
    AFTER INSERT ON webhook_events
    FOR EACH ROW EXECUTE FUNCTION process_plaid_webhook();

-- Function to encrypt access tokens (placeholder)
CREATE OR REPLACE FUNCTION encrypt_access_token(token TEXT)
RETURNS TEXT AS $$
BEGIN
    -- In production, implement proper encryption
    -- For now, return the token as-is
    RETURN token;
END;
$$ language 'plpgsql';

-- Function to decrypt access tokens (placeholder)
CREATE OR REPLACE FUNCTION decrypt_access_token(encrypted_token TEXT)
RETURNS TEXT AS $$
BEGIN
    -- In production, implement proper decryption
    -- For now, return the token as-is
    RETURN encrypted_token;
END;
$$ language 'plpgsql';

-- View for user's transaction summary
CREATE OR REPLACE VIEW user_transaction_summary AS
SELECT 
    ca.user_id,
    ca.institution_name,
    ca.account_name,
    ca.account_type,
    COUNT(t.id) as transaction_count,
    SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_expenses,
    SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total_income,
    MAX(t.date) as last_transaction_date,
    COUNT(CASE WHEN t.is_pending THEN 1 END) as pending_transactions
FROM connected_accounts ca
LEFT JOIN transactions t ON ca.id = t.account_id
WHERE ca.is_active = true
GROUP BY ca.user_id, ca.institution_name, ca.account_name, ca.account_type;

-- Grant permissions
GRANT SELECT ON user_transaction_summary TO authenticated;
GRANT ALL ON connected_accounts TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON webhook_events TO authenticated;
GRANT ALL ON ai_categorizations TO authenticated;
GRANT ALL ON plaid_user_preferences TO authenticated;
