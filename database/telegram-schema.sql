-- Telegram Bot Database Schema
-- This file contains the database schema for the Telegram bot functionality

-- Telegram Users Table
CREATE TABLE IF NOT EXISTS telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_bot BOOLEAN DEFAULT FALSE,
    language_code VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{
        "canReceiveReports": true,
        "canExecuteTrades": false,
        "canViewPortfolio": true,
        "canModifySettings": true,
        "canAccessAnalytics": true,
        "isAdmin": false,
        "rateLimit": {
            "maxRequestsPerMinute": 10,
            "maxRequestsPerHour": 100
        }
    }'::jsonb,
    preferences JSONB DEFAULT '{
        "notifications": {
            "dailyReports": true,
            "tradeAlerts": true,
            "riskAlerts": true,
            "marketUpdates": false,
            "systemStatus": true
        },
        "reporting": {
            "frequency": "DAILY",
            "time": "09:00",
            "timezone": "UTC",
            "format": "DETAILED",
            "includeCharts": false
        },
        "trading": {
            "confirmBeforeExecution": true,
            "maxTradeSize": 1000,
            "allowedSymbols": ["BTCUSDT", "ETHUSDT"]
        }
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Messages Table (for logging)
CREATE TABLE IF NOT EXISTS telegram_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    text TEXT,
    command VARCHAR(255),
    parameters TEXT[],
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    response TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Scheduled Jobs Table
CREATE TABLE IF NOT EXISTS telegram_scheduled_jobs (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    telegram_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('DAILY_REPORT', 'WEEKLY_REPORT', 'MONTHLY_REPORT')),
    schedule VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Notifications Table
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('TRADE_ALERT', 'RISK_ALERT', 'DAILY_REPORT', 'MARKET_UPDATE', 'SYSTEM_STATUS')),
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    user_id UUID,
    telegram_id BIGINT,
    chat_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    scheduled TIMESTAMP WITH TIME ZONE,
    sent TIMESTAMP WITH TIME ZONE,
    delivered BOOLEAN DEFAULT FALSE,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Sent Reports Table (for tracking)
CREATE TABLE IF NOT EXISTS telegram_sent_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    chat_id BIGINT NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    report_data JSONB NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Security Events Table
CREATE TABLE IF NOT EXISTS telegram_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT,
    event_type VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Telegram Job Errors Table
CREATE TABLE IF NOT EXISTS telegram_job_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_active ON telegram_users(is_active);
CREATE INDEX IF NOT EXISTS idx_telegram_users_last_active ON telegram_users(last_active);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_user_id ON telegram_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_timestamp ON telegram_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_processed ON telegram_messages(processed);

CREATE INDEX IF NOT EXISTS idx_telegram_jobs_telegram_id ON telegram_scheduled_jobs(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_jobs_next_run ON telegram_scheduled_jobs(next_run);
CREATE INDEX IF NOT EXISTS idx_telegram_jobs_enabled ON telegram_scheduled_jobs(enabled);

CREATE INDEX IF NOT EXISTS idx_telegram_notifications_chat_id ON telegram_notifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_type ON telegram_notifications(type);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_delivered ON telegram_notifications(delivered);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_scheduled ON telegram_notifications(scheduled);

CREATE INDEX IF NOT EXISTS idx_telegram_reports_user_id ON telegram_sent_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_reports_type ON telegram_sent_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_telegram_reports_sent_at ON telegram_sent_reports(sent_at);

CREATE INDEX IF NOT EXISTS idx_telegram_security_user_id ON telegram_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_security_timestamp ON telegram_security_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_telegram_job_errors_job_id ON telegram_job_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_telegram_job_errors_timestamp ON telegram_job_errors(timestamp);

-- Row Level Security (RLS) Policies
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sent_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_job_errors ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_users
CREATE POLICY "Users can view their own telegram profile" ON telegram_users
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage telegram users" ON telegram_users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for telegram_messages (service role only for privacy)
CREATE POLICY "Service role can manage telegram messages" ON telegram_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for telegram_scheduled_jobs
CREATE POLICY "Users can view their own scheduled jobs" ON telegram_scheduled_jobs
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage scheduled jobs" ON telegram_scheduled_jobs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for telegram_notifications
CREATE POLICY "Users can view their own notifications" ON telegram_notifications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage notifications" ON telegram_notifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for telegram_sent_reports
CREATE POLICY "Users can view their own sent reports" ON telegram_sent_reports
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage sent reports" ON telegram_sent_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for security events and job errors (service role only)
CREATE POLICY "Service role can manage security events" ON telegram_security_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage job errors" ON telegram_job_errors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_telegram_users_updated_at 
    BEFORE UPDATE ON telegram_users 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_telegram_jobs_updated_at 
    BEFORE UPDATE ON telegram_scheduled_jobs 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Views for easier querying
CREATE OR REPLACE VIEW telegram_active_users AS
SELECT 
    telegram_id,
    username,
    first_name,
    last_name,
    permissions,
    preferences,
    created_at,
    last_active
FROM telegram_users
WHERE is_active = true;

CREATE OR REPLACE VIEW telegram_admin_users AS
SELECT 
    telegram_id,
    username,
    first_name,
    last_name,
    created_at,
    last_active
FROM telegram_users
WHERE is_active = true 
AND permissions->>'isAdmin' = 'true';

CREATE OR REPLACE VIEW telegram_pending_notifications AS
SELECT 
    id,
    type,
    priority,
    chat_id,
    title,
    message,
    scheduled,
    retry_count,
    max_retries,
    created_at
FROM telegram_notifications
WHERE delivered = false 
AND retry_count < max_retries
AND (scheduled IS NULL OR scheduled <= NOW());

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_telegram_user_permissions(user_telegram_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM telegram_users
    WHERE telegram_id = user_telegram_id AND is_active = true;
    
    RETURN COALESCE(user_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_telegram_user_activity(user_telegram_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE telegram_users 
    SET last_active = NOW()
    WHERE telegram_id = user_telegram_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;