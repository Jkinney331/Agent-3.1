-- Fix Trading Schema Migration
-- This migration fixes the database schema to match the trading engine expectations

-- Fix trading_positions table
ALTER TABLE trading_positions 
ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL DEFAULT 'buy';

-- Rename avg_cost to entry_price
ALTER TABLE trading_positions 
RENAME COLUMN avg_cost TO entry_price;

-- Update the side column constraint
ALTER TABLE trading_positions 
DROP CONSTRAINT IF EXISTS trading_positions_side_check;

ALTER TABLE trading_positions 
ADD CONSTRAINT trading_positions_side_check 
CHECK (side IN ('buy', 'sell'));

-- Fix trading_orders table
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

-- Update existing records
UPDATE trading_positions 
SET side = 'buy' 
WHERE side IS NULL OR side = 'long';

UPDATE trading_positions 
SET entry_price = 0 
WHERE entry_price IS NULL;

UPDATE trading_orders 
SET ai_reasoning = reasoning 
WHERE ai_reasoning IS NULL AND reasoning IS NOT NULL;

UPDATE trading_orders 
SET ai_reasoning = 'Legacy order' 
WHERE ai_reasoning IS NULL;

-- Add missing columns with proper defaults
ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS filled_quantity DECIMAL(15,8) DEFAULT 0;

ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS filled_price DECIMAL(15,8);

ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS fees DECIMAL(15,2) DEFAULT 0;

ALTER TABLE trading_orders 
ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(15,2) DEFAULT 0;

-- Update existing orders to have proper values
UPDATE trading_orders 
SET filled_quantity = quantity 
WHERE filled_quantity IS NULL;

UPDATE trading_orders 
SET filled_price = price 
WHERE filled_price IS NULL AND status = 'filled';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Trading schema migration completed successfully!';
    RAISE NOTICE '🔧 Fixed trading_positions and trading_orders tables';
    RAISE NOTICE '📊 All existing records updated with proper values';
END $$; 