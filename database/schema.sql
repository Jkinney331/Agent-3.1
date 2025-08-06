-- AI Trading Bot Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trading Accounts Table
CREATE TABLE trading_accounts (
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

-- Trading Positions Table
CREATE TABLE trading_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    entry_price DECIMAL(15,8) NOT NULL,
    current_price DECIMAL(15,8) NOT NULL,
    market_value DECIMAL(15,2) NOT NULL,
    unrealized_pnl DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    strategy_used TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Orders Table
CREATE TABLE trading_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
    order_type TEXT CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,8),
    stop_price DECIMAL(15,8),
    status TEXT CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')) NOT NULL DEFAULT 'pending',
    strategy_used TEXT NOT NULL,
    ai_reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filled_at TIMESTAMP WITH TIME ZONE
);

-- AI Decisions Table
CREATE TABLE ai_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    decision_type TEXT CHECK (decision_type IN ('buy', 'sell', 'hold', 'strategy_change')) NOT NULL,
    symbol TEXT,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    market_conditions JSONB,
    data_analyzed JSONB,
    strategy_selected TEXT NOT NULL,
    outcome TEXT CHECK (outcome IN ('success', 'failure', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Analysis Table
CREATE TABLE market_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    analysis_type TEXT CHECK (analysis_type IN ('technical', 'fundamental', 'sentiment', 'combined')) NOT NULL,
    indicators JSONB,
    signals JSONB,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    recommendation TEXT CHECK (recommendation IN ('strong_buy', 'buy', 'hold', 'sell', 'strong_sell')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy Performance Table
CREATE TABLE strategy_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    strategy_name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_win DECIMAL(15,2) DEFAULT 0.00,
    avg_loss DECIMAL(15,2) DEFAULT 0.00,
    max_drawdown DECIMAL(15,2) DEFAULT 0.00,
    sharpe_ratio DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- N8N Workflow Executions Table
CREATE TABLE n8n_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('running', 'success', 'error', 'waiting')) NOT NULL,
    mode TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_type ON trading_accounts(account_type);
CREATE INDEX idx_trading_positions_account_id ON trading_positions(account_id);
CREATE INDEX idx_trading_positions_symbol ON trading_positions(symbol);
CREATE INDEX idx_trading_orders_account_id ON trading_orders(account_id);
CREATE INDEX idx_trading_orders_symbol ON trading_orders(symbol);
CREATE INDEX idx_trading_orders_status ON trading_orders(status);
CREATE INDEX idx_ai_decisions_account_id ON ai_decisions(account_id);
CREATE INDEX idx_ai_decisions_type ON ai_decisions(decision_type);
CREATE INDEX idx_market_analysis_symbol ON market_analysis(symbol);
CREATE INDEX idx_market_analysis_type ON market_analysis(analysis_type);
CREATE INDEX idx_strategy_performance_name ON strategy_performance(strategy_name);
CREATE INDEX idx_n8n_executions_workflow_id ON n8n_executions(workflow_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_positions_updated_at BEFORE UPDATE ON trading_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_performance_updated_at BEFORE UPDATE ON strategy_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_executions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may want to customize these based on your auth setup)
CREATE POLICY "Users can view their own trading accounts" ON trading_accounts FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own trading accounts" ON trading_accounts FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own trading accounts" ON trading_accounts FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policies for other tables based on account ownership
CREATE POLICY "Users can view their positions" ON trading_positions FOR SELECT USING (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their positions" ON trading_positions FOR INSERT WITH CHECK (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can update their positions" ON trading_positions FOR UPDATE USING (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);

CREATE POLICY "Users can view their orders" ON trading_orders FOR SELECT USING (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their orders" ON trading_orders FOR INSERT WITH CHECK (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can update their orders" ON trading_orders FOR UPDATE USING (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);

CREATE POLICY "Users can view their ai decisions" ON ai_decisions FOR SELECT USING (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their ai decisions" ON ai_decisions FOR INSERT WITH CHECK (
    account_id IN (SELECT id FROM trading_accounts WHERE user_id = auth.uid()::text)
);

-- Market analysis and strategy performance can be viewed by all authenticated users
CREATE POLICY "Authenticated users can view market analysis" ON market_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view strategy performance" ON strategy_performance FOR SELECT TO authenticated USING (true);

-- N8N executions can be viewed by all authenticated users
CREATE POLICY "Authenticated users can view n8n executions" ON n8n_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage n8n executions" ON n8n_executions FOR ALL TO service_role USING (true);

-- Insert sample data for testing
INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power) 
VALUES ('demo-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00);

-- Create a view for trading performance summary
CREATE VIEW trading_performance_summary AS
SELECT 
    ta.id as account_id,
    ta.user_id,
    ta.balance,
    ta.initial_balance,
    ta.total_equity,
    (ta.total_equity - ta.initial_balance) as total_pnl,
    ((ta.total_equity - ta.initial_balance) / ta.initial_balance * 100) as return_percentage,
    COUNT(to_filled.id) as total_trades,
    COUNT(CASE WHEN tp.unrealized_pnl > 0 THEN 1 END) as winning_positions,
    COUNT(tp.id) as total_positions,
    COALESCE(AVG(tp.unrealized_pnl), 0) as avg_position_pnl,
    COALESCE(SUM(tp.unrealized_pnl), 0) as total_unrealized_pnl
FROM trading_accounts ta
LEFT JOIN trading_orders to_filled ON ta.id = to_filled.account_id AND to_filled.status = 'filled'
LEFT JOIN trading_positions tp ON ta.id = tp.account_id
GROUP BY ta.id, ta.user_id, ta.balance, ta.initial_balance, ta.total_equity; 