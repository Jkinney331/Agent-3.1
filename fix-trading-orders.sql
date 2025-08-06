-- Quick fix: Drop and recreate trading_orders table with correct schema

-- Drop the existing trading_orders table
DROP TABLE IF EXISTS trading_orders CASCADE;

-- Recreate trading_orders table with correct schema
CREATE TABLE trading_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
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
  confidence_score DECIMAL(3,2),
  realized_pnl DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_trading_orders_account_created ON trading_orders(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);

SELECT 'Trading orders table recreated successfully!' as status;
