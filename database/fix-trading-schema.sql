-- Fix Trading Schema - Add Missing Columns
-- This migration adds the missing columns that are causing constraint violations

-- Add missing columns to trading_orders table
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT UNIQUE DEFAULT uuid_generate_v4()::text;

-- Add missing columns to trading_positions table  
ALTER TABLE trading_positions 
ADD COLUMN IF NOT EXISTS entry_price DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('buy', 'sell')) DEFAULT 'buy',
ADD COLUMN IF NOT EXISTS strategy_used TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

-- Update existing positions to have entry_price = current_price if entry_price is null
UPDATE trading_positions 
SET entry_price = current_price 
WHERE entry_price IS NULL AND current_price IS NOT NULL;

-- Make price column nullable for market orders (it will be filled with execution price)
ALTER TABLE trading_orders 
ALTER COLUMN price DROP NOT NULL;

-- Add default value for order_id if it's null
UPDATE trading_orders 
SET order_id = uuid_generate_v4()::text 
WHERE order_id IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Trading schema fixed successfully! Missing columns added.' as status; 