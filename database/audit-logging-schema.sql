-- Comprehensive Audit Logging Schema for AI Trading Bot
-- This schema provides complete tracking of all API calls, system events, and security activities

-- API Request Logging
CREATE TABLE IF NOT EXISTS api_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    action VARCHAR(50),
    target_workflow VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    client_ip INET,
    user_agent TEXT,
    origin VARCHAR(500),
    auth_valid BOOLEAN DEFAULT false,
    auth_method VARCHAR(50),
    response_status VARCHAR(20),
    response_code INTEGER,
    execution_time_ms INTEGER,
    request_payload JSONB,
    response_data JSONB,
    security_warnings JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Request Logging
CREATE TABLE IF NOT EXISTS webhook_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(100) UNIQUE NOT NULL,
    webhook_type VARCHAR(50) NOT NULL,
    source VARCHAR(100),
    method VARCHAR(10) NOT NULL,
    endpoint TEXT NOT NULL,
    action VARCHAR(50),
    target_endpoint TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    client_ip INET,
    user_agent TEXT,
    origin VARCHAR(500),
    auth_valid BOOLEAN DEFAULT false,
    response_status VARCHAR(20),
    execution_time_ms INTEGER,
    request_payload JSONB,
    response_data JSONB,
    security_warnings JSONB,
    workflow_results JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Decision Logging
CREATE TABLE IF NOT EXISTS trading_decisions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
    risk_reward DECIMAL(8,4),
    position_size DECIMAL(10,6),
    leverage DECIMAL(5,2) DEFAULT 1.0,
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    executed BOOLEAN DEFAULT false,
    reasoning TEXT,
    market_data JSONB,
    sentiment_data JSONB,
    ai_analysis JSONB,
    risk_assessment JSONB,
    trading_criteria JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade Execution Logging
CREATE TABLE IF NOT EXISTS trade_executions (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    order_id VARCHAR(100),
    symbol VARCHAR(20) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD')),
    executed BOOLEAN DEFAULT false,
    execution_mode VARCHAR(20) DEFAULT 'PAPER',
    exchange VARCHAR(50),
    execution_price DECIMAL(20,8),
    quantity DECIMAL(20,8),
    commission DECIMAL(20,8) DEFAULT 0,
    confidence DECIMAL(5,2),
    risk_reward DECIMAL(8,4),
    position_size DECIMAL(10,6),
    risk_level VARCHAR(20),
    reasoning TEXT,
    risk_warnings JSONB,
    execution_details JSONB,
    alpaca_response JSONB,
    binance_response JSONB,
    error_details JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id BIGSERIAL PRIMARY KEY,
    account_id VARCHAR(100),
    portfolio_value DECIMAL(20,2),
    cash DECIMAL(20,2),
    equity DECIMAL(20,2),
    buying_power DECIMAL(20,2),
    daily_pnl DECIMAL(20,2),
    daily_pnl_percentage DECIMAL(8,4),
    unrealized_pnl DECIMAL(20,2),
    unrealized_pnl_percentage DECIMAL(8,4),
    position_count INTEGER DEFAULT 0,
    leverage_ratio DECIMAL(8,4) DEFAULT 1.0,
    risk_level VARCHAR(20),
    performance_grade VARCHAR(2),
    performance_score INTEGER,
    alerts JSONB,
    recommendations JSONB,
    positions_data JSONB,
    risk_metrics JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Logging
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    notification_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    title VARCHAR(500),
    message TEXT,
    telegram_message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    delivery_status VARCHAR(20),
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    source VARCHAR(100),
    target_channels JSONB,
    delivery_attempts INTEGER DEFAULT 0,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_details JSONB,
    metadata JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logging
CREATE TABLE IF NOT EXISTS error_logs (
    id BIGSERIAL PRIMARY KEY,
    error_id VARCHAR(100) UNIQUE NOT NULL,
    error_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    source VARCHAR(100),
    message TEXT,
    error_code VARCHAR(50),
    stack_trace TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    workflow_id VARCHAR(100),
    recovery_strategy VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 0,
    escalated BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolution_time TIMESTAMPTZ,
    resolution_notes TEXT,
    impact_assessment JSONB,
    recovery_actions JSONB,
    context_data JSONB,
    error_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Event Logging
CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    source VARCHAR(100),
    description TEXT,
    client_ip INET,
    user_agent TEXT,
    endpoint TEXT,
    auth_method VARCHAR(50),
    auth_result VARCHAR(20),
    suspicious_indicators JSONB,
    blocked BOOLEAN DEFAULT false,
    action_taken VARCHAR(100),
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Health Monitoring
CREATE TABLE IF NOT EXISTS system_health_logs (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20,4),
    metric_unit VARCHAR(20),
    status VARCHAR(20) DEFAULT 'NORMAL',
    threshold_warning DECIMAL(20,4),
    threshold_critical DECIMAL(20,4),
    component VARCHAR(100),
    environment VARCHAR(50),
    metadata JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Health Monitoring
CREATE TABLE IF NOT EXISTS api_health_checks (
    id BIGSERIAL PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL,
    endpoint TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'UNKNOWN',
    response_time_ms INTEGER,
    response_code INTEGER,
    error_message TEXT,
    rate_limit_remaining INTEGER,
    rate_limit_reset TIMESTAMPTZ,
    last_success TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    metadata JSONB,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Execution Logs
CREATE TABLE IF NOT EXISTS workflow_executions (
    id BIGSERIAL PRIMARY KEY,
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    workflow_name VARCHAR(200) NOT NULL,
    workflow_type VARCHAR(50),
    trigger_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'RUNNING',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    input_data JSONB,
    output_data JSONB,
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER,
    execution_context JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_request_id ON api_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON api_requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_requests_response_status ON api_requests(response_status);

CREATE INDEX IF NOT EXISTS idx_webhook_requests_created_at ON webhook_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_requests_request_id ON webhook_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_webhook_requests_webhook_type ON webhook_requests(webhook_type);

CREATE INDEX IF NOT EXISTS idx_trading_decisions_created_at ON trading_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_decisions_session_id ON trading_decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_trading_decisions_symbol ON trading_decisions(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_decisions_executed ON trading_decisions(executed);

CREATE INDEX IF NOT EXISTS idx_trade_executions_created_at ON trade_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_executions_order_id ON trade_executions(order_id);
CREATE INDEX IF NOT EXISTS idx_trade_executions_symbol ON trade_executions(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_executions_executed ON trade_executions(executed);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_created_at ON portfolio_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_account_id ON portfolio_snapshots(account_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_id ON notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_priority ON error_logs(priority);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_client_ip ON security_events(client_ip);

CREATE INDEX IF NOT EXISTS idx_system_health_logs_recorded_at ON system_health_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_metric_name ON system_health_logs(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_status ON system_health_logs(status);

CREATE INDEX IF NOT EXISTS idx_api_health_checks_checked_at ON api_health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_health_checks_api_name ON api_health_checks(api_name);
CREATE INDEX IF NOT EXISTS idx_api_health_checks_status ON api_health_checks(status);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_execution_id ON workflow_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_name ON workflow_executions(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

-- Create views for common queries

-- Recent API activity view
CREATE OR REPLACE VIEW recent_api_activity AS
SELECT 
    request_id,
    method,
    endpoint,
    response_status,
    execution_time_ms,
    client_ip,
    auth_valid,
    created_at
FROM api_requests 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Trading performance summary view
CREATE OR REPLACE VIEW trading_performance_summary AS
SELECT 
    DATE(created_at) as trading_date,
    COUNT(*) as total_decisions,
    COUNT(CASE WHEN executed = true THEN 1 END) as executed_trades,
    COUNT(CASE WHEN action = 'BUY' AND executed = true THEN 1 END) as buy_orders,
    COUNT(CASE WHEN action = 'SELL' AND executed = true THEN 1 END) as sell_orders,
    AVG(confidence) as avg_confidence,
    AVG(CASE WHEN executed = true THEN execution_price END) as avg_execution_price,
    SUM(CASE WHEN executed = true THEN quantity * execution_price END) as total_volume
FROM trade_executions
GROUP BY DATE(created_at)
ORDER BY trading_date DESC;

-- Error frequency analysis view
CREATE OR REPLACE VIEW error_frequency_analysis AS
SELECT 
    error_type,
    priority,
    COUNT(*) as occurrence_count,
    COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_count,
    AVG(retry_count) as avg_retry_count,
    MAX(created_at) as last_occurrence,
    MIN(created_at) as first_occurrence
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_type, priority
ORDER BY occurrence_count DESC;

-- System health overview
CREATE OR REPLACE VIEW system_health_overview AS
SELECT 
    component,
    metric_name,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(CASE WHEN status != 'NORMAL' THEN 1 END) as alert_count,
    MAX(recorded_at) as last_recorded
FROM system_health_logs
WHERE recorded_at >= NOW() - INTERVAL '1 hour'
GROUP BY component, metric_name
ORDER BY component, metric_name;

-- Notification delivery stats
CREATE OR REPLACE VIEW notification_delivery_stats AS
SELECT 
    type,
    priority,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as successful_deliveries,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_deliveries,
    AVG(delivery_attempts) as avg_delivery_attempts,
    ROUND(COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) * 100.0 / COUNT(*), 2) as delivery_rate_percent
FROM notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY type, priority
ORDER BY total_sent DESC;

-- Add table comments for documentation
COMMENT ON TABLE api_requests IS 'Comprehensive logging of all API requests with security and performance metrics';
COMMENT ON TABLE webhook_requests IS 'Detailed tracking of webhook calls and their routing to n8n workflows';
COMMENT ON TABLE trading_decisions IS 'AI-generated trading decisions with confidence scores and risk assessments';
COMMENT ON TABLE trade_executions IS 'Actual trade executions with exchange responses and execution details';
COMMENT ON TABLE portfolio_snapshots IS 'Regular snapshots of portfolio state and performance metrics';
COMMENT ON TABLE notifications IS 'Notification delivery tracking across all channels';
COMMENT ON TABLE error_logs IS 'Comprehensive error tracking with recovery strategies and resolution status';
COMMENT ON TABLE security_events IS 'Security-related events and potential threats';
COMMENT ON TABLE system_health_logs IS 'System performance and health metrics over time';
COMMENT ON TABLE api_health_checks IS 'Regular health checks of external API endpoints';
COMMENT ON TABLE workflow_executions IS 'n8n workflow execution tracking and performance metrics';

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO trading_bot_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trading_bot_user;

COMMIT;"