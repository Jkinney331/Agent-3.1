-- Minimal AI Trading Bot Setup - $50k Paper Trading Account
-- Copy and paste this into your Supabase SQL Editor and click RUN

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Trading Accounts Table (Your $50k Paper Trading Account)
CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
  balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  total_equity DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  buying_power DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trading Orders Table
CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,8) NOT NULL,
  order_type TEXT CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')) NOT NULL DEFAULT 'market',
  status TEXT CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected', 'expired')) NOT NULL DEFAULT 'pending',
  filled_quantity DECIMAL(15,8) DEFAULT 0,
  filled_price DECIMAL(15,8),
  fees DECIMAL(15,2) DEFAULT 0,
  strategy_used TEXT,
  reasoning TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  filled_at TIMESTAMP WITH TIME ZONE
);

-- 3. Trading Positions Table
CREATE TABLE IF NOT EXISTS trading_positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity DECIMAL(15,8) NOT NULL,
  avg_cost DECIMAL(15,8) NOT NULL,
  current_price DECIMAL(15,8),
  market_value DECIMAL(15,2),
  unrealized_pnl DECIMAL(15,2),
  side TEXT CHECK (side IN ('long', 'short')) NOT NULL DEFAULT 'long',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AI Decisions Table (For N8N Workflow Visibility)
CREATE TABLE IF NOT EXISTS ai_decisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  workflow_step TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  market_data JSONB DEFAULT '{}'::jsonb,
  strategy_selected TEXT,
  confidence_score DECIMAL(3,2),
  symbol TEXT,
  action_taken TEXT,
  outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_account ON trading_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_positions_account ON trading_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_account ON ai_decisions(account_id);

-- 🎯 CREATE YOUR $50,000 PAPER TRADING ACCOUNT
INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power)
VALUES ('demo-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00)
ON CONFLICT DO NOTHING;

-- Success notification
SELECT 
  '🎉 SUCCESS! Your $50,000 paper trading account is ready!' as message,
  user_id,
  account_type,
  '$' || balance as current_balance,
  '$' || initial_balance as starting_balance
FROM trading_accounts 
WHERE user_id = 'demo-user'; 