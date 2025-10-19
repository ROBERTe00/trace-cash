-- Enhanced Plaid Integration Schema
-- Improved database structure for production-ready Plaid integration

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_plaid_account_id ON connected_accounts(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_is_active ON connected_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_plaid_transaction_id ON transactions(plaid_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_pending ON transactions(is_pending);

CREATE INDEX IF NOT EXISTS idx_webhook_events_item_id ON webhook_events(item_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Add Plaid errors table for better error tracking
CREATE TABLE IF NOT EXISTS plaid_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_plaid_errors_item_id ON plaid_errors(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_errors_user_id ON plaid_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_errors_is_resolved ON plaid_errors(is_resolved);

-- Add transaction categories table for better categorization
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6B7280',
    icon TEXT DEFAULT 'tag',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO transaction_categories (name, description, color, icon, is_default) VALUES
('Food & Dining', 'Restaurants, groceries, and food-related expenses', '#EF4444', 'utensils', true),
('Transportation', 'Gas, public transport, rideshare, and vehicle expenses', '#3B82F6', 'car', true),
('Shopping', 'Retail purchases, clothing, and general merchandise', '#8B5CF6', 'shopping-bag', true),
('Entertainment', 'Movies, games, subscriptions, and leisure activities', '#EC4899', 'film', true),
('Healthcare', 'Medical expenses, pharmacy, and health services', '#10B981', 'heart', true),
('Bills & Utilities', 'Electricity, water, internet, and other utilities', '#F59E0B', 'zap', true),
('Income', 'Salary, freelance, and other income sources', '#22C55E', 'trending-up', true),
('Other', 'Miscellaneous expenses and uncategorized items', '#6B7280', 'tag', true)
ON CONFLICT (name) DO NOTHING;

-- Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plaid_webhook_enabled BOOLEAN DEFAULT true,
    auto_categorization BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    default_currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add transaction insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS transaction_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('spending_pattern', 'budget_alert', 'savings_opportunity', 'anomaly_detection')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    actionable BOOLEAN DEFAULT false,
    category TEXT,
    amount DECIMAL(15,2),
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_insights_user_id ON transaction_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_insights_insight_type ON transaction_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_transaction_insights_is_read ON transaction_insights(is_read);

-- Add RLS policies for new tables
ALTER TABLE plaid_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for plaid_errors
CREATE POLICY "Users can view their own plaid errors" ON plaid_errors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid errors" ON plaid_errors
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for transaction_categories
CREATE POLICY "Anyone can view transaction categories" ON transaction_categories
    FOR SELECT USING (true);

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for transaction_insights
CREATE POLICY "Users can view their own insights" ON transaction_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" ON transaction_insights
    FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to get user's transaction summary
CREATE OR REPLACE FUNCTION get_user_transaction_summary(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    total_expenses DECIMAL(15,2),
    total_income DECIMAL(15,2),
    transaction_count BIGINT,
    top_category TEXT,
    top_category_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
        COUNT(*) as transaction_count,
        (
            SELECT t2.category 
            FROM transactions t2 
            JOIN connected_accounts ca2 ON t2.account_id = ca2.id 
            WHERE ca2.user_id = user_uuid 
                AND t2.date BETWEEN start_date AND end_date
                AND t2.amount < 0
            GROUP BY t2.category 
            ORDER BY SUM(ABS(t2.amount)) DESC 
            LIMIT 1
        ) as top_category,
        (
            SELECT SUM(ABS(t2.amount))
            FROM transactions t2 
            JOIN connected_accounts ca2 ON t2.account_id = ca2.id 
            WHERE ca2.user_id = user_uuid 
                AND t2.date BETWEEN start_date AND end_date
                AND t2.amount < 0
                AND t2.category = (
                    SELECT t3.category 
                    FROM transactions t3 
                    JOIN connected_accounts ca3 ON t3.account_id = ca3.id 
                    WHERE ca3.user_id = user_uuid 
                        AND t3.date BETWEEN start_date AND end_date
                        AND t3.amount < 0
                    GROUP BY t3.category 
                    ORDER BY SUM(ABS(t3.amount)) DESC 
                    LIMIT 1
                )
        ) as top_category_amount
    FROM transactions t
    JOIN connected_accounts ca ON t.account_id = ca.id
    WHERE ca.user_id = user_uuid 
        AND t.date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to detect transaction anomalies
CREATE OR REPLACE FUNCTION detect_transaction_anomalies(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    anomaly_type TEXT,
    description TEXT,
    severity TEXT,
    transaction_count BIGINT,
    total_amount DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH user_transactions AS (
        SELECT t.*, ca.user_id
        FROM transactions t
        JOIN connected_accounts ca ON t.account_id = ca.id
        WHERE ca.user_id = user_uuid
            AND t.date >= CURRENT_DATE - INTERVAL '1 day' * days_back
    ),
    duplicate_check AS (
        SELECT 
            'duplicate' as anomaly_type,
            'Potential duplicate transactions detected' as description,
            'medium' as severity,
            COUNT(*) as transaction_count,
            SUM(ABS(amount)) as total_amount
        FROM user_transactions
        WHERE description IN (
            SELECT description 
            FROM user_transactions 
            GROUP BY description 
            HAVING COUNT(*) > 1
        )
    ),
    unusual_amount_check AS (
        SELECT 
            'unusual_amount' as anomaly_type,
            'Transactions with unusually high amounts detected' as description,
            'high' as severity,
            COUNT(*) as transaction_count,
            SUM(ABS(amount)) as total_amount
        FROM user_transactions
        WHERE ABS(amount) > (
            SELECT AVG(ABS(amount)) + 3 * STDDEV(ABS(amount))
            FROM user_transactions
            WHERE amount < 0
        )
    )
    SELECT * FROM duplicate_check
    UNION ALL
    SELECT * FROM unusual_amount_check;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
