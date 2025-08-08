-- Performance Monitoring Queries for AI Crypto Trading Bot Database
-- These queries help monitor database performance, identify bottlenecks, and optimize for n8n workflows

-- =============================================================================
-- 1. CONNECTION AND PERFORMANCE MONITORING
-- =============================================================================

-- Monitor active connections (use with service role)
-- SELECT 
--   state, 
--   COUNT(*) as connection_count,
--   application_name,
--   client_addr
-- FROM pg_stat_activity 
-- WHERE datname = current_database()
-- GROUP BY state, application_name, client_addr
-- ORDER BY connection_count DESC;

-- Query performance statistics for trading operations
-- SELECT 
--   schemaname,
--   tablename,
--   seq_scan,
--   seq_tup_read,
--   idx_scan,
--   idx_tup_fetch,
--   n_tup_ins as inserts,
--   n_tup_upd as updates,
--   n_tup_del as deletes,
--   n_live_tup as live_rows,
--   n_dead_tup as dead_rows,
--   last_vacuum,
--   last_autovacuum,
--   last_analyze,
--   last_autoanalyze
-- FROM pg_stat_user_tables 
-- WHERE tablename IN ('trading_accounts', 'trading_positions', 'trading_orders', 'ai_decisions')
-- ORDER BY seq_scan + idx_scan DESC;

-- =============================================================================
-- 2. N8N WORKFLOW PERFORMANCE QUERIES
-- =============================================================================

-- Recent trading activity (optimized for n8n dashboards)
SELECT 
  DATE(created_at) as trade_date,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'filled' THEN 1 END) as successful_trades,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_trades,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_trades,
  AVG(CASE WHEN realized_pnl IS NOT NULL THEN realized_pnl END) as avg_pnl,
  SUM(CASE WHEN realized_pnl > 0 THEN realized_pnl ELSE 0 END) as total_profit,
  SUM(CASE WHEN realized_pnl < 0 THEN ABS(realized_pnl) ELSE 0 END) as total_loss
FROM trading_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY trade_date DESC
LIMIT 30;

-- Active positions performance (for portfolio monitoring)
SELECT 
  tp.symbol,
  tp.quantity,
  tp.avg_cost,
  tp.current_price,
  tp.market_value,
  tp.unrealized_pnl,
  tp.side,
  tp.strategy_used,
  tp.confidence_score,
  (tp.current_price - tp.avg_cost) / tp.avg_cost * 100 as return_percentage,
  EXTRACT(EPOCH FROM (NOW() - tp.created_at)) / 3600 as hours_held,
  ta.user_id
FROM trading_positions tp
JOIN trading_accounts ta ON tp.account_id = ta.id
WHERE tp.quantity > 0
ORDER BY tp.unrealized_pnl DESC;

-- AI decision effectiveness tracking
SELECT 
  aid.decision_type,
  aid.strategy_selected,
  COUNT(*) as total_decisions,
  AVG(aid.confidence_score) as avg_confidence,
  COUNT(CASE WHEN aid.outcome = 'success' THEN 1 END) as successful_outcomes,
  COUNT(CASE WHEN aid.outcome = 'failure' THEN 1 END) as failed_outcomes,
  COUNT(CASE WHEN aid.outcome IS NULL OR aid.outcome = 'pending' THEN 1 END) as pending_outcomes,
  CASE 
    WHEN COUNT(CASE WHEN aid.outcome IN ('success', 'failure') THEN 1 END) > 0
    THEN COUNT(CASE WHEN aid.outcome = 'success' THEN 1 END)::float / 
         COUNT(CASE WHEN aid.outcome IN ('success', 'failure') THEN 1 END) * 100
    ELSE 0
  END as success_rate_percentage
FROM ai_decisions aid
WHERE aid.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY aid.decision_type, aid.strategy_selected
ORDER BY total_decisions DESC, success_rate_percentage DESC;

-- =============================================================================
-- 3. DATA QUALITY AND INTEGRITY CHECKS
-- =============================================================================

-- Orphaned records check (data integrity for n8n workflows)
SELECT 
  'trading_positions' as table_name,
  COUNT(*) as orphaned_records
FROM trading_positions tp
LEFT JOIN trading_accounts ta ON tp.account_id = ta.id
WHERE ta.id IS NULL

UNION ALL

SELECT 
  'trading_orders' as table_name,
  COUNT(*) as orphaned_records  
FROM trading_orders tor
LEFT JOIN trading_accounts ta ON tor.account_id = ta.id
WHERE ta.id IS NULL

UNION ALL

SELECT 
  'ai_decisions' as table_name,
  COUNT(*) as orphaned_records
FROM ai_decisions aid
LEFT JOIN trading_accounts ta ON aid.account_id = ta.id
WHERE ta.id IS NULL;

-- Data freshness check (critical for real-time n8n workflows)
SELECT 
  'trading_accounts' as table_name,
  MAX(updated_at) as last_update,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 60 as minutes_since_update,
  COUNT(*) as total_records
FROM trading_accounts

UNION ALL

SELECT 
  'trading_positions' as table_name,
  MAX(updated_at) as last_update,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 60 as minutes_since_update,
  COUNT(*) as total_records
FROM trading_positions

UNION ALL

SELECT 
  'trading_orders' as table_name,
  MAX(created_at) as last_update,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 60 as minutes_since_update,
  COUNT(*) as total_records
FROM trading_orders

UNION ALL

SELECT 
  'ai_decisions' as table_name,
  MAX(created_at) as last_update,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 60 as minutes_since_update,
  COUNT(*) as total_records
FROM ai_decisions;

-- =============================================================================
-- 4. VOLUME AND LOAD MONITORING
-- =============================================================================

-- Trading volume by hour (identify peak usage times)
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as trade_count,
  COUNT(DISTINCT symbol) as unique_symbols,
  SUM(quantity * price) as total_volume,
  AVG(confidence_score) as avg_confidence
FROM trading_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status = 'filled'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC
LIMIT 168; -- Last 7 days hourly

-- Database size and growth tracking
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('trading_accounts', 'trading_positions', 'trading_orders', 'ai_decisions')
ORDER BY tablename, attname;

-- =============================================================================
-- 5. ALERT THRESHOLDS AND MONITORING QUERIES
-- =============================================================================

-- High-frequency trading detection (potential issues for n8n)
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  symbol,
  COUNT(*) as trades_per_minute,
  CASE 
    WHEN COUNT(*) > 10 THEN 'HIGH_FREQUENCY_ALERT'
    WHEN COUNT(*) > 5 THEN 'MODERATE_FREQUENCY_WARNING'
    ELSE 'NORMAL'
  END as alert_level
FROM trading_orders
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', created_at), symbol
HAVING COUNT(*) > 3
ORDER BY trades_per_minute DESC, minute DESC;

-- Account balance anomaly detection
SELECT 
  user_id,
  balance,
  total_equity,
  unrealized_pnl,
  realized_pnl,
  CASE 
    WHEN balance < 1000 THEN 'LOW_BALANCE_ALERT'
    WHEN ABS(unrealized_pnl) > balance * 0.1 THEN 'HIGH_RISK_ALERT'
    WHEN realized_pnl < -balance * 0.05 THEN 'SIGNIFICANT_LOSS_ALERT'
    ELSE 'NORMAL'
  END as risk_level,
  updated_at
FROM trading_accounts
WHERE account_type = 'paper'
ORDER BY 
  CASE 
    WHEN balance < 1000 THEN 1
    WHEN ABS(unrealized_pnl) > balance * 0.1 THEN 2
    WHEN realized_pnl < -balance * 0.05 THEN 3
    ELSE 4
  END;

-- Failed trade analysis (for error monitoring)
SELECT 
  DATE(created_at) as trade_date,
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY DATE(created_at)) as percentage,
  STRING_AGG(DISTINCT reasoning, '; ') as common_reasons
FROM trading_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status IN ('cancelled', 'rejected')
GROUP BY DATE(created_at), status
ORDER BY trade_date DESC, count DESC;

-- =============================================================================
-- 6. OPTIMIZATION RECOMMENDATIONS QUERY
-- =============================================================================

-- Index usage analysis (identify missing indexes)
-- SELECT 
--   schemaname,
--   tablename,
--   attname,
--   n_distinct,
--   correlation,
--   CASE 
--     WHEN n_distinct > 100 AND correlation < 0.1 THEN 'CONSIDER_INDEX'
--     WHEN n_distinct > 1000 THEN 'HIGHLY_RECOMMEND_INDEX'
--     ELSE 'INDEX_NOT_NEEDED'
--   END as index_recommendation
-- FROM pg_stats 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('trading_orders', 'ai_decisions', 'market_data')
--   AND n_distinct > 10
-- ORDER BY n_distinct DESC;

-- Query to check table sizes (for partition recommendations)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_total_relation_size(schemaname||'.'||tablename) as table_size_bytes,
  CASE 
    WHEN pg_total_relation_size(schemaname||'.'||tablename) > 1073741824 THEN 'CONSIDER_PARTITIONING' -- 1GB
    WHEN pg_total_relation_size(schemaname||'.'||tablename) > 104857600 THEN 'MONITOR_SIZE' -- 100MB
    ELSE 'SIZE_OK'
  END as recommendation
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('trading_accounts', 'trading_positions', 'trading_orders', 'ai_decisions', 'market_data')
ORDER BY table_size_bytes DESC;