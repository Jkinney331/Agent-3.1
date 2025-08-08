-- Multi-Factor Authentication and Security Schema
-- Comprehensive security framework for AI Trading Bot
-- Compliant with SOC 2, PCI DSS, and financial services security standards

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users table with comprehensive security features
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email CITEXT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- bcrypt hash
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) CHECK (account_status IN ('active', 'suspended', 'locked', 'pending_verification')) DEFAULT 'pending_verification',
    kyc_status VARCHAR(20) CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')) DEFAULT 'none',
    risk_level VARCHAR(10) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    country_code CHAR(2),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Security settings
    password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Compliance and audit
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MFA Methods table for multiple authentication factors
CREATE TABLE mfa_methods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(20) CHECK (method_type IN ('totp', 'webauthn', 'sms', 'email', 'backup_codes')) NOT NULL,
    method_name VARCHAR(100), -- User-friendly name like "iPhone Authenticator"
    
    -- Method-specific data (encrypted)
    secret_encrypted TEXT, -- For TOTP secret, encrypted
    phone_number_encrypted TEXT, -- For SMS, encrypted
    webauthn_credential_id TEXT, -- For WebAuthn
    webauthn_public_key TEXT, -- For WebAuthn
    webauthn_counter INTEGER DEFAULT 0, -- For WebAuthn replay protection
    
    -- Security properties
    is_primary BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    backup_codes_count INTEGER DEFAULT 0, -- For backup codes method
    
    -- Verification and audit
    verified_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    use_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions with comprehensive tracking
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash of session token
    
    -- Session metadata
    device_fingerprint TEXT,
    user_agent TEXT,
    ip_address INET NOT NULL,
    location_country CHAR(2),
    location_city VARCHAR(100),
    
    -- Security context
    mfa_verified BOOLEAN DEFAULT FALSE,
    mfa_methods_used TEXT[], -- Array of method types used
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100) DEFAULT 50,
    security_level VARCHAR(20) CHECK (security_level IN ('basic', 'elevated', 'high_privilege')) DEFAULT 'basic',
    
    -- Session lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoke_reason VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Events and Audit Log
CREATE TABLE security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Event classification
    event_type VARCHAR(50) NOT NULL, -- login, logout, mfa_setup, mfa_verify, password_change, etc.
    event_category VARCHAR(30) CHECK (event_category IN ('authentication', 'authorization', 'trading', 'account_management', 'security_violation')) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
    
    -- Event details
    event_description TEXT NOT NULL,
    event_data JSONB, -- Additional structured data
    
    -- Context information
    ip_address INET,
    user_agent TEXT,
    location_country CHAR(2),
    device_fingerprint TEXT,
    
    -- Security analysis
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    anomaly_detected BOOLEAN DEFAULT FALSE,
    auto_resolved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading Permissions and Limits
CREATE TABLE trading_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Permission levels
    can_trade BOOLEAN DEFAULT FALSE,
    can_view_portfolio BOOLEAN DEFAULT TRUE,
    can_modify_strategies BOOLEAN DEFAULT FALSE,
    can_access_api BOOLEAN DEFAULT FALSE,
    
    -- Trading limits
    daily_trading_limit DECIMAL(15,2) DEFAULT 0,
    single_trade_limit DECIMAL(15,2) DEFAULT 0,
    monthly_trading_limit DECIMAL(15,2) DEFAULT 0,
    
    -- Risk management
    max_positions INTEGER DEFAULT 10,
    max_leverage DECIMAL(5,2) DEFAULT 1.0,
    allowed_symbols TEXT[], -- Array of allowed trading symbols
    restricted_symbols TEXT[], -- Array of restricted symbols
    
    -- High-risk operations requiring MFA
    mfa_required_for_trades BOOLEAN DEFAULT TRUE,
    mfa_required_for_withdrawals BOOLEAN DEFAULT TRUE,
    mfa_required_for_api_access BOOLEAN DEFAULT TRUE,
    mfa_required_threshold DECIMAL(15,2) DEFAULT 1000.00, -- Dollar amount requiring MFA
    
    -- Compliance
    accredited_investor BOOLEAN DEFAULT FALSE,
    regulatory_approval BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovery Codes for emergency access
CREATE TABLE recovery_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, -- SHA-256 hash of recovery code
    
    -- Usage tracking
    used_at TIMESTAMP WITH TIME ZONE,
    used_ip INET,
    used_session_id UUID REFERENCES user_sessions(id),
    
    -- Security
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys with enhanced security
CREATE TABLE api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Key identification
    key_name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
    key_hash TEXT NOT NULL, -- Hash of the full API key
    
    -- Permissions
    permissions TEXT[] DEFAULT ARRAY['read'], -- read, trade, admin
    ip_whitelist INET[], -- Allowed IP addresses
    
    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip INET,
    use_count INTEGER DEFAULT 0,
    
    -- Security
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trusted Devices for reduced MFA friction
CREATE TABLE trusted_devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Device identification
    device_fingerprint TEXT UNIQUE NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'api')) DEFAULT 'desktop',
    
    -- Trust settings
    trust_level VARCHAR(20) CHECK (trust_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    mfa_exempt BOOLEAN DEFAULT FALSE, -- Can skip MFA for low-risk operations
    
    -- Verification
    verified_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_ip INET,
    
    -- Security
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Configurations per user
CREATE TABLE user_security_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- MFA settings
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_required BOOLEAN DEFAULT TRUE,
    primary_mfa_method VARCHAR(20) CHECK (primary_mfa_method IN ('totp', 'webauthn', 'sms')),
    backup_method_required BOOLEAN DEFAULT TRUE,
    
    -- Session security
    session_timeout INTEGER DEFAULT 3600, -- seconds
    max_concurrent_sessions INTEGER DEFAULT 3,
    require_mfa_after INTEGER DEFAULT 86400, -- seconds (24 hours)
    
    -- Risk-based authentication
    location_based_auth BOOLEAN DEFAULT TRUE,
    device_based_auth BOOLEAN DEFAULT TRUE,
    time_based_restrictions BOOLEAN DEFAULT FALSE,
    
    -- Notification preferences
    notify_login BOOLEAN DEFAULT TRUE,
    notify_new_device BOOLEAN DEFAULT TRUE,
    notify_trading_activity BOOLEAN DEFAULT TRUE,
    notify_security_events BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(account_status);
CREATE INDEX idx_users_last_activity ON users(last_activity_at);

CREATE INDEX idx_mfa_methods_user_id ON mfa_methods(user_id);
CREATE INDEX idx_mfa_methods_type ON mfa_methods(method_type);
CREATE INDEX idx_mfa_methods_enabled ON mfa_methods(is_enabled);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(session_token_hash);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_category ON security_events(event_category);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at);

CREATE INDEX idx_trading_permissions_user_id ON trading_permissions(user_id);
CREATE INDEX idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mfa_methods_updated_at BEFORE UPDATE ON mfa_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_permissions_updated_at BEFORE UPDATE ON trading_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_security_config_updated_at BEFORE UPDATE ON user_security_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their MFA methods" ON mfa_methods FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their sessions" ON user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their sessions" ON user_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their sessions" ON user_sessions FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their security events" ON security_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can log security events" ON security_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their trading permissions" ON trading_permissions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their recovery codes" ON recovery_codes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their API keys" ON api_keys FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their trusted devices" ON trusted_devices FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their security config" ON user_security_config FOR ALL USING (user_id = auth.uid());

-- Admin policies for service accounts
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role security events" ON security_events FOR ALL TO service_role USING (true);

-- Create views for common queries
CREATE VIEW user_security_overview AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.account_status,
    u.risk_level,
    u.last_login_at,
    u.failed_login_attempts,
    u.locked_until,
    usc.mfa_enabled,
    usc.primary_mfa_method,
    COUNT(mm.id) as mfa_methods_count,
    COUNT(us.id) as active_sessions_count,
    tp.can_trade,
    tp.daily_trading_limit
FROM users u
LEFT JOIN user_security_config usc ON u.id = usc.user_id
LEFT JOIN mfa_methods mm ON u.id = mm.user_id AND mm.is_enabled = true
LEFT JOIN user_sessions us ON u.id = us.user_id AND us.expires_at > NOW() AND us.revoked_at IS NULL
LEFT JOIN trading_permissions tp ON u.id = tp.user_id
GROUP BY u.id, u.email, u.username, u.account_status, u.risk_level, u.last_login_at, u.failed_login_attempts, u.locked_until, usc.mfa_enabled, usc.primary_mfa_method, tp.can_trade, tp.daily_trading_limit;

-- Security functions for common operations
CREATE OR REPLACE FUNCTION generate_recovery_codes(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    recovery_codes TEXT[] = ARRAY[]::TEXT[];
    i INTEGER;
    code TEXT;
BEGIN
    -- Delete existing recovery codes
    DELETE FROM recovery_codes WHERE user_id = p_user_id;
    
    -- Generate 10 new recovery codes
    FOR i IN 1..10 LOOP
        code := encode(gen_random_bytes(6), 'hex');
        recovery_codes := array_append(recovery_codes, code);
        
        INSERT INTO recovery_codes (user_id, code_hash)
        VALUES (p_user_id, digest(code, 'sha256'));
    END LOOP;
    
    RETURN recovery_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_recovery_code(p_user_id UUID, p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    code_exists BOOLEAN;
BEGIN
    -- Check if the code exists and hasn't been used
    SELECT EXISTS(
        SELECT 1 FROM recovery_codes 
        WHERE user_id = p_user_id 
        AND code_hash = digest(p_code, 'sha256')
        AND used_at IS NULL
        AND expires_at > NOW()
    ) INTO code_exists;
    
    IF code_exists THEN
        -- Mark the code as used
        UPDATE recovery_codes 
        SET used_at = NOW(), 
            used_ip = inet_client_addr()
        WHERE user_id = p_user_id 
        AND code_hash = digest(p_code, 'sha256')
        AND used_at IS NULL;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if MFA is required for an operation
CREATE OR REPLACE FUNCTION is_mfa_required(
    p_user_id UUID, 
    p_operation_type TEXT, 
    p_amount DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_config user_security_config%ROWTYPE;
    trading_perms trading_permissions%ROWTYPE;
BEGIN
    SELECT * INTO user_config FROM user_security_config WHERE user_id = p_user_id;
    SELECT * INTO trading_perms FROM trading_permissions WHERE user_id = p_user_id;
    
    -- If MFA is globally required for user, return true
    IF user_config.mfa_required THEN
        RETURN TRUE;
    END IF;
    
    -- Check operation-specific requirements
    CASE p_operation_type
        WHEN 'trade' THEN
            IF trading_perms.mfa_required_for_trades THEN
                RETURN TRUE;
            END IF;
            IF p_amount IS NOT NULL AND p_amount >= trading_perms.mfa_required_threshold THEN
                RETURN TRUE;
            END IF;
        WHEN 'withdrawal' THEN
            IF trading_perms.mfa_required_for_withdrawals THEN
                RETURN TRUE;
            END IF;
        WHEN 'api_access' THEN
            IF trading_perms.mfa_required_for_api_access THEN
                RETURN TRUE;
            END IF;
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Insert default admin user for demo (remove in production)
INSERT INTO users (email, username, password_hash, email_verified, account_status, risk_level)
VALUES ('admin@tradingbot.com', 'admin', crypt('admin_password_change_me', gen_salt('bf')), TRUE, 'active', 'low');

-- Insert default security config for admin
INSERT INTO user_security_config (user_id, mfa_enabled, mfa_required)
SELECT id, FALSE, FALSE FROM users WHERE username = 'admin';

-- Insert default trading permissions for admin
INSERT INTO trading_permissions (
    user_id, can_trade, can_view_portfolio, can_modify_strategies, can_access_api,
    daily_trading_limit, single_trade_limit, monthly_trading_limit
)
SELECT id, TRUE, TRUE, TRUE, TRUE, 100000, 50000, 1000000
FROM users WHERE username = 'admin';

COMMIT;