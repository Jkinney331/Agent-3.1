-- Schema Compatibility Fixes for n8n Integration
-- This script ensures all tables are properly configured for n8n workflows

-- 1. Add missing columns for n8n compatibility
ALTER TABLE ai_decisions 
ADD COLUMN IF NOT EXISTS data_analyzed JSONB DEFAULT '{}'::jsonb;

-- 2. Update ai_decisions table to match interface expectations
ALTER TABLE ai_decisions 
ADD COLUMN IF NOT EXISTS market_conditions JSONB DEFAULT '{}'::jsonb;

-- 3. Ensure trading_orders has proper order_id field
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS order_id TEXT;

-- Update existing records to have order_id if missing
UPDATE trading_orders 
SET order_id = 'order-' || id::text 
WHERE order_id IS NULL;

-- Make order_id unique after backfilling
ALTER TABLE trading_orders 
ADD CONSTRAINT unique_order_id UNIQUE (order_id);

-- 4. Add indexes for n8n common queries
CREATE INDEX IF NOT EXISTS idx_ai_decisions_decision_type ON ai_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_symbol ON ai_decisions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_order_id ON trading_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);

-- 5. Create views for n8n workflows (simplified data access)
CREATE OR REPLACE VIEW n8n_trading_summary AS
SELECT 
  ta.user_id,
  ta.balance,
  ta.total_equity,
  ta.unrealized_pnl,
  ta.realized_pnl,
  COUNT(tp.id) as active_positions,
  COUNT(tor.id) as total_orders
FROM trading_accounts ta
LEFT JOIN trading_positions tp ON ta.id = tp.account_id
LEFT JOIN trading_orders tor ON ta.id = tor.account_id
GROUP BY ta.id, ta.user_id, ta.balance, ta.total_equity, ta.unrealized_pnl, ta.realized_pnl;

CREATE OR REPLACE VIEW n8n_recent_trades AS
SELECT 
  tor.id,
  tor.symbol,
  tor.side,
  tor.quantity,
  tor.price,
  tor.status,
  tor.strategy_used,
  tor.confidence_score,
  tor.realized_pnl,
  tor.created_at,
  ta.user_id
FROM trading_orders tor
JOIN trading_accounts ta ON tor.account_id = ta.id
WHERE tor.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY tor.created_at DESC;

CREATE OR REPLACE VIEW n8n_ai_insights AS
SELECT 
  aid.decision_type,
  aid.symbol,
  aid.reasoning,
  aid.confidence_score,
  aid.strategy_selected,
  aid.market_data,
  aid.data_analyzed,
  aid.created_at,
  ta.user_id
FROM ai_decisions aid
JOIN trading_accounts ta ON aid.account_id = ta.id
WHERE aid.created_at >= NOW() - INTERVAL '7 days'
ORDER BY aid.created_at DESC;

-- 6. Row Level Security Policies for n8n
-- Enable RLS on all tables
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anon role (n8n usage)
-- Allow n8n workflows to access demo user data
CREATE POLICY "Allow n8n access to demo account" ON trading_accounts
  FOR ALL TO anon
  USING (user_id = 'demo-user' OR user_id = 'n8n-user');

CREATE POLICY "Allow n8n access to demo positions" ON trading_positions
  FOR ALL TO anon
  USING (account_id IN (
    SELECT id FROM trading_accounts WHERE user_id IN ('demo-user', 'n8n-user')
  ));

CREATE POLICY "Allow n8n access to demo orders" ON trading_orders
  FOR ALL TO anon
  USING (account_id IN (
    SELECT id FROM trading_accounts WHERE user_id IN ('demo-user', 'n8n-user')
  ));

CREATE POLICY "Allow n8n access to demo ai_decisions" ON ai_decisions
  FOR ALL TO anon
  USING (account_id IN (
    SELECT id FROM trading_accounts WHERE user_id IN ('demo-user', 'n8n-user')
  ));

CREATE POLICY "Allow n8n access to demo performance" ON performance_metrics
  FOR ALL TO anon
  USING (account_id IN (
    SELECT id FROM trading_accounts WHERE user_id IN ('demo-user', 'n8n-user')
  ));

CREATE POLICY "Allow n8n access to demo portfolio" ON portfolio_snapshots
  FOR ALL TO anon
  USING (account_id IN (
    SELECT id FROM trading_accounts WHERE user_id IN ('demo-user', 'n8n-user')
  ));

CREATE POLICY "Allow n8n access to demo risk_rules" ON risk_rules
  FOR ALL TO anon
  USING (account_id IN (
    SELECT id FROM trading_accounts WHERE user_id IN ('demo-user', 'n8n-user')
  ));

-- Market data can be accessed by all (it's public information)
CREATE POLICY "Allow public access to market_data" ON market_data
  FOR SELECT TO anon
  USING (true);

-- Create n8n specific user account
INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power)
VALUES ('n8n-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  total_equity = EXCLUDED.total_equity,
  buying_power = EXCLUDED.buying_power,
  updated_at = NOW();

-- 7. Functions for n8n workflows
CREATE OR REPLACE FUNCTION get_account_summary(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT row_to_json(summary) INTO result
  FROM (
    SELECT 
      ta.balance,
      ta.total_equity,
      ta.unrealized_pnl,
      ta.realized_pnl,
      ta.total_trades,
      ta.winning_trades,
      COALESCE(positions.count, 0) as active_positions,
      COALESCE(positions.total_value, 0) as positions_value
    FROM trading_accounts ta
    LEFT JOIN (
      SELECT 
        account_id,
        COUNT(*) as count,
        SUM(market_value) as total_value
      FROM trading_positions 
      GROUP BY account_id
    ) positions ON ta.id = positions.account_id
    WHERE ta.user_id = p_user_id
  ) summary;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION execute_trade(
  p_user_id TEXT,
  p_symbol TEXT,
  p_side TEXT,
  p_quantity DECIMAL,
  p_price DECIMAL,
  p_strategy TEXT DEFAULT 'manual',
  p_reasoning TEXT DEFAULT 'n8n workflow execution'
)
RETURNS JSON AS $$
DECLARE
  v_account_id UUID;
  v_order_record trading_orders;
  result JSON;
BEGIN
  -- Get account ID
  SELECT id INTO v_account_id 
  FROM trading_accounts 
  WHERE user_id = p_user_id;
  
  IF v_account_id IS NULL THEN
    RETURN '{"error": "Account not found"}'::JSON;
  END IF;
  
  -- Insert the order
  INSERT INTO trading_orders (
    account_id, 
    order_id,
    symbol, 
    side, 
    quantity, 
    price, 
    order_type,
    status,
    strategy_used, 
    reasoning,
    confidence_score
  )
  VALUES (
    v_account_id,
    'n8n-' || extract(epoch from now())::bigint || '-' || floor(random() * 1000)::int,
    p_symbol,
    p_side,
    p_quantity,
    p_price,
    'market',
    'filled',
    p_strategy,
    p_reasoning,
    0.8
  )
  RETURNING * INTO v_order_record;
  
  -- Return the order details as JSON
  SELECT row_to_json(v_order_record) INTO result;
  RETURN result;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions for n8n
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO anon;

-- Success message
SELECT 'Schema compatibility fixes applied successfully! n8n workflows can now interact properly with the database.' as status;