-- Create table for user dashboard layouts
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  widget_order text[] DEFAULT '{}',
  widget_positions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user ON user_dashboard_layouts(user_id);

-- Enable RLS
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own layout
CREATE POLICY "Users can view own dashboard layout"
  ON user_dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own layout
CREATE POLICY "Users can insert own dashboard layout"
  ON user_dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own layout
CREATE POLICY "Users can update own dashboard layout"
  ON user_dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own layout
CREATE POLICY "Users can delete own dashboard layout"
  ON user_dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_dashboard_layouts_updated_at
  BEFORE UPDATE ON user_dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_layouts_updated_at();
