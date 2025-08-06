-- AI Crypto Trading Bot - Complete Database Schema
-- This creates all tables needed for real-time trading data persistence

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trading Accounts (Your $50k Paper Trading Account)
CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  account_type TEXT CHECK (account_type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
  balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  total_equity DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  buying_power DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
  realized_pnl DECIMAL(15,2) DEFAULT 0.00,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Positions (Current Holdings)
CREATE TABLE IF NOT EXISTS trading_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL DEFAULT 'buy',
  quantity DECIMAL(15,8) NOT NULL,
  entry_price DECIMAL(15,8) NOT NULL,
  current_price DECIMAL(15,8),
  market_value DECIMAL(15,2),
  unrealized_pnl DECIMAL(15,2),
  strategy_used TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, symbol)
);

-- Trading Orders (All Trade History)
CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,8) NOT NULL,
  order_type TEXT CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')) NOT NULL DEFAULT 'market',
  status TEXT CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')) NOT NULL DEFAULT 'filled',
  filled_quantity DECIMAL(15,8) DEFAULT 0,
  filled_price DECIMAL(15,8),
  fees DECIMAL(15,2) DEFAULT 0,
  strategy_used TEXT,
  reasoning TEXT,
  ai_reasoning TEXT,
  confidence_score DECIMAL(3,2),
  realized_pnl DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Decisions Log (For Analysis)
CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  symbol TEXT,
  reasoning TEXT NOT NULL,
  market_data JSONB DEFAULT '{}'::jsonb,
  strategy_selected TEXT,
  confidence_score DECIMAL(3,2),
  action_taken TEXT,
  outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics (Daily/Historical)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  starting_balance DECIMAL(15,2),
  ending_balance DECIMAL(15,2),
  daily_pnl DECIMAL(15,2),
  daily_return_pct DECIMAL(5,2),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  max_drawdown DECIMAL(15,2),
  sharpe_ratio DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- Market Data (Historical prices)
CREATE TABLE IF NOT EXISTS market_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1h',
  open_price DECIMAL(15,8),
  high_price DECIMAL(15,8),
  low_price DECIMAL(15,8),
  close_price DECIMAL(15,8),
  volume DECIMAL(20,8),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Portfolio Snapshots (For tracking changes over time)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  total_value DECIMAL(15,2) NOT NULL,
  cash_balance DECIMAL(15,2) NOT NULL,
  positions_value DECIMAL(15,2) NOT NULL,
  unrealized_pnl DECIMAL(15,2) NOT NULL,
  realized_pnl DECIMAL(15,2) NOT NULL,
  total_return_pct DECIMAL(5,2),
  snapshot_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Management Rules
CREATE TABLE IF NOT EXISTS risk_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('position_size', 'stop_loss', 'take_profit', 'max_drawdown', 'daily_loss')) NOT NULL,
  rule_value DECIMAL(10,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_account_symbol ON trading_positions(account_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_account_created ON trading_orders(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_account_created ON ai_decisions(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_account_date ON performance_metrics(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_account_created ON portfolio_snapshots(account_id, created_at DESC);

-- Create your $50,000 paper trading account
INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power)
VALUES ('demo-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  total_equity = EXCLUDED.total_equity,
  buying_power = EXCLUDED.buying_power,
  updated_at = NOW();

-- Insert default risk rules
INSERT INTO risk_rules (account_id, rule_name, rule_type, rule_value)
SELECT 
  ta.id,
  'Max Position Size',
  'position_size',
  0.02
FROM trading_accounts ta
WHERE ta.user_id = 'demo-user'
ON CONFLICT DO NOTHING;

INSERT INTO risk_rules (account_id, rule_name, rule_type, rule_value)
SELECT 
  ta.id,
  'Stop Loss',
  'stop_loss',
  0.05
FROM trading_accounts ta
WHERE ta.user_id = 'demo-user'
ON CONFLICT DO NOTHING;

INSERT INTO risk_rules (account_id, rule_name, rule_type, rule_value)
SELECT 
  ta.id,
  'Take Profit',
  'take_profit',
  0.10
FROM trading_accounts ta
WHERE ta.user_id = 'demo-user'
ON CONFLICT DO NOTHING;

-- Create a function to update account totals
CREATE OR REPLACE FUNCTION update_account_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trading account totals when positions change
  UPDATE trading_accounts 
  SET 
    total_equity = balance + COALESCE((
      SELECT SUM(market_value) 
      FROM trading_positions 
      WHERE account_id = NEW.account_id
    ), 0),
    unrealized_pnl = COALESCE((
      SELECT SUM(unrealized_pnl) 
      FROM trading_positions 
      WHERE account_id = NEW.account_id
    ), 0),
    updated_at = NOW()
  WHERE id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update account totals
DROP TRIGGER IF EXISTS trigger_update_account_totals ON trading_positions;
CREATE TRIGGER trigger_update_account_totals
  AFTER INSERT OR UPDATE OR DELETE ON trading_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_totals();

-- Create a function to calculate daily performance
CREATE OR REPLACE FUNCTION calculate_daily_performance()
RETURNS void AS $$
BEGIN
  INSERT INTO performance_metrics (
    account_id, 
    date, 
    starting_balance, 
    ending_balance, 
    daily_pnl, 
    daily_return_pct,
    total_trades,
    winning_trades
  )
  SELECT 
    ta.id,
    CURRENT_DATE,
    COALESCE((
      SELECT ending_balance 
      FROM performance_metrics 
      WHERE account_id = ta.id 
      ORDER BY date DESC 
      LIMIT 1
    ), ta.initial_balance),
    ta.total_equity,
    ta.total_equity - COALESCE((
      SELECT ending_balance 
      FROM performance_metrics 
      WHERE account_id = ta.id 
      ORDER BY date DESC 
      LIMIT 1
    ), ta.initial_balance),
    CASE 
      WHEN COALESCE((
        SELECT ending_balance 
        FROM performance_metrics 
        WHERE account_id = ta.id 
        ORDER BY date DESC 
        LIMIT 1
      ), ta.initial_balance) > 0 
      THEN ((ta.total_equity - COALESCE((
        SELECT ending_balance 
        FROM performance_metrics 
        WHERE account_id = ta.id 
        ORDER BY date DESC 
        LIMIT 1
      ), ta.initial_balance)) / COALESCE((
        SELECT ending_balance 
        FROM performance_metrics 
        WHERE account_id = ta.id 
        ORDER BY date DESC 
        LIMIT 1
      ), ta.initial_balance)) * 100
      ELSE 0
    END,
    COALESCE((
      SELECT COUNT(*) 
      FROM trading_orders 
      WHERE account_id = ta.id 
      AND DATE(created_at) = CURRENT_DATE
    ), 0),
    COALESCE((
      SELECT COUNT(*) 
      FROM trading_orders 
      WHERE account_id = ta.id 
      AND DATE(created_at) = CURRENT_DATE
      AND realized_pnl > 0
    ), 0)
  FROM trading_accounts ta
  WHERE ta.user_id = 'demo-user'
  ON CONFLICT (account_id, date) DO UPDATE SET
    ending_balance = EXCLUDED.ending_balance,
    daily_pnl = EXCLUDED.daily_pnl,
    daily_return_pct = EXCLUDED.daily_return_pct,
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Success message
SELECT 'Database schema created successfully! Trading system ready for real data persistence.' as status; 