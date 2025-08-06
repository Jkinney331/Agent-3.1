-- AI Trading Bot Database Schema
-- Copy and paste this entire script into your Supabase SQL Editor

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

-- 2. Trading Positions Table
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

-- 3. Trading Orders Table
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

-- 5. Market Analysis Table
CREATE TABLE IF NOT EXISTS market_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    analysis_type TEXT NOT NULL, -- 'technical', 'fundamental', 'sentiment'
    timeframe TEXT NOT NULL, -- '1m', '5m', '1h', '1d', etc.
    data JSONB NOT NULL,
    summary TEXT,
    signals JSONB DEFAULT '{}'::jsonb,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Strategy Performance Table
CREATE TABLE IF NOT EXISTS strategy_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    strategy_name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    avg_trade_pnl DECIMAL(15,2) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. N8N Workflow Executions Table
CREATE TABLE IF NOT EXISTS n8n_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    execution_id TEXT UNIQUE NOT NULL,
    workflow_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('running', 'success', 'error', 'waiting')) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_type ON trading_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_trading_positions_account ON trading_positions(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_positions_symbol ON trading_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_account ON trading_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_account ON ai_decisions(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_workflow ON ai_decisions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_created_at ON ai_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_market_analysis_symbol ON market_analysis(symbol);
CREATE INDEX IF NOT EXISTS idx_market_analysis_created_at ON market_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy ON strategy_performance(strategy_name);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_workflow ON n8n_executions(workflow_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_trading_accounts_updated_at 
    BEFORE UPDATE ON trading_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_positions_updated_at 
    BEFORE UPDATE ON trading_positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Optional but recommended
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
CREATE POLICY "Users can access their own trading accounts" ON trading_accounts
    FOR ALL USING (true); -- For now, allow all access. Adjust based on your auth.

CREATE POLICY "Users can access their positions" ON trading_positions
    FOR ALL USING (true);

CREATE POLICY "Users can access their orders" ON trading_orders
    FOR ALL USING (true);

CREATE POLICY "Users can access AI decisions" ON ai_decisions
    FOR ALL USING (true);

-- 🎯 CREATE YOUR $50,000 PAPER TRADING ACCOUNT
INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power)
VALUES ('demo-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00)
ON CONFLICT DO NOTHING;

-- Create a view for easy trading performance summary
CREATE VIEW trading_performance_summary AS
SELECT 
    ta.user_id,
    ta.account_type,
    ta.balance,
    ta.total_equity,
    ta.buying_power,
    COALESCE(COUNT(DISTINCT tp.id), 0) as open_positions,
    COALESCE(COUNT(DISTINCT to_filled.id), 0) as total_trades,
    COALESCE(SUM(CASE WHEN to_filled.side = 'sell' AND tp.unrealized_pnl > 0 THEN 1 ELSE 0 END), 0) as winning_trades,
    COALESCE(AVG(tp.unrealized_pnl), 0) as avg_position_pnl,
    ta.total_equity - ta.initial_balance as total_pnl,
    ((ta.total_equity - ta.initial_balance) / ta.initial_balance * 100) as total_return_pct
FROM trading_accounts ta
LEFT JOIN trading_positions tp ON ta.id = tp.account_id
LEFT JOIN trading_orders to_filled ON ta.id = to_filled.account_id AND to_filled.status = 'filled'
GROUP BY ta.id, ta.user_id, ta.account_type, ta.balance, ta.total_equity, ta.buying_power, ta.initial_balance;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 SUCCESS! AI Trading Bot database schema created successfully!';
    RAISE NOTICE '💰 Your $50,000 paper trading account is ready!';
    RAISE NOTICE '🚀 You can now start paper trading with full AI strategy support!';
END $$; 