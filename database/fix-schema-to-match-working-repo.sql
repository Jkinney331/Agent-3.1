-- Fix Database Schema to Match Working Repo
-- This migration updates the schema to match the working repository structure

-- 1. Fix trading_positions table
ALTER TABLE trading_positions 
ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('buy', 'sell')) DEFAULT 'buy',
ADD COLUMN IF NOT EXISTS entry_price DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS strategy_used TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

-- Update existing positions to have entry_price = current_price if entry_price is null
UPDATE trading_positions 
SET entry_price = current_price 
WHERE entry_price IS NULL AND current_price IS NOT NULL;

-- Update existing positions to have side = 'buy' if side is null
UPDATE trading_positions 
SET side = 'buy' 
WHERE side IS NULL;

-- 2. Fix trading_orders table
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE DEFAULT uuid_generate_v4()::text;

-- Rename 'reasoning' column to 'ai_reasoning' if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trading_orders' AND column_name = 'reasoning') THEN
        ALTER TABLE trading_orders RENAME COLUMN reasoning TO ai_reasoning;
    END IF;
END $$;

-- Make price field optional for market orders
ALTER TABLE trading_orders 
ALTER COLUMN price DROP NOT NULL;

-- 3. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_trading_positions_account_symbol ON trading_positions(account_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trading_orders_account_status ON trading_orders(account_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at DESC);

-- 4. Add any missing constraints
ALTER TABLE trading_positions 
ADD CONSTRAINT IF NOT EXISTS check_positive_quantity CHECK (quantity > 0);

ALTER TABLE trading_orders 
ADD CONSTRAINT IF NOT EXISTS check_positive_quantity CHECK (quantity > 0);

-- 5. Update RLS policies if needed
-- Ensure RLS is enabled
ALTER TABLE trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;

-- Add policies for trading_positions
DROP POLICY IF EXISTS "Users can view own positions" ON trading_positions;
CREATE POLICY "Users can view own positions" ON trading_positions
    FOR SELECT USING (
        account_id IN (
            SELECT id FROM trading_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own positions" ON trading_positions;
CREATE POLICY "Users can insert own positions" ON trading_positions
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT id FROM trading_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own positions" ON trading_positions;
CREATE POLICY "Users can update own positions" ON trading_positions
    FOR UPDATE USING (
        account_id IN (
            SELECT id FROM trading_accounts WHERE user_id = auth.uid()
        )
    );

-- Add policies for trading_orders
DROP POLICY IF EXISTS "Users can view own orders" ON trading_orders;
CREATE POLICY "Users can view own orders" ON trading_orders
    FOR SELECT USING (
        account_id IN (
            SELECT id FROM trading_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own orders" ON trading_orders;
CREATE POLICY "Users can insert own orders" ON trading_orders
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT id FROM trading_accounts WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own orders" ON trading_orders;
CREATE POLICY "Users can update own orders" ON trading_orders
    FOR UPDATE USING (
        account_id IN (
            SELECT id FROM trading_accounts WHERE user_id = auth.uid()
        )
    );

-- Add policies for trading_accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON trading_accounts;
CREATE POLICY "Users can view own accounts" ON trading_accounts
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own accounts" ON trading_accounts;
CREATE POLICY "Users can insert own accounts" ON trading_accounts
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own accounts" ON trading_accounts;
CREATE POLICY "Users can update own accounts" ON trading_accounts
    FOR UPDATE USING (user_id = auth.uid());

-- 6. Verify the schema changes
SELECT 
    'trading_positions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trading_positions' 
ORDER BY ordinal_position;

SELECT 
    'trading_orders' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'trading_orders' 
ORDER BY ordinal_position; 