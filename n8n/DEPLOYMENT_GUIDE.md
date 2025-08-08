# N8N Integration Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the complete N8N integration architecture, including the routing workflow, security implementation, and monitoring systems.

## Prerequisites

- N8N instance running (v0.196.0 or later)
- Next.js application deployed
- Active N8N workflows:
  - 🚀 ADVANCED AI TRADING ENGINE - All-in-One
  - 💼 PORTFOLIO & RISK MONITOR - Comprehensive  
  - 📱 SMART NOTIFICATION SYSTEM - All Channels
- API credentials for Alpaca, Binance, CoinGecko, Alpha Vantage
- Supabase database access

## Phase 1: Environment Setup

### 1.1 Environment Variables

Create or update your `.env` file with the following variables:

```bash
# N8N Integration Configuration
N8N_API_INTEGRATION_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# Trading API Credentials
ALPACA_API_KEY=PK6V8YP89R7JPD2O5BA4
ALPACA_SECRET_KEY=XfjX2P0pvowkkQP0fkkwbhMJBBcDnMorBW5e73DZ
BINANCE_API_KEY=428pEV4wB7JeFNUS8w5v0QBw7ed12L7A7pCpUwkSSsfnRtPWvJr1lgrFeoqpCpLB
COINGECKO_API_KEY=CG-aQhKqxLWkcvpJdBi5gHKfQtB
ALPHA_VANTAGE_API_KEY=8PQA774S43BSMFME

# Database Configuration
SUPABASE_URL=https://sjtulkkhxojiitpjhgrt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Security Configuration
CREDENTIAL_ENCRYPTION_KEY=your-32-byte-encryption-key
REDIS_URL=your-redis-url-for-rate-limiting
REDIS_TOKEN=your-redis-token

# Monitoring & Logging
LOG_LEVEL=info
ENABLE_AUDIT_LOGGING=true
SECURITY_ALERT_WEBHOOK=your-security-webhook-url
```

### 1.2 Generate Secure Tokens

```bash
# Generate a secure API integration token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Phase 2: N8N Workflow Deployment

### 2.1 Import API Integration Workflow

1. Open your N8N instance
2. Go to **Workflows** > **Import from File**
3. Upload the file: `/n8n/api-integration-workflow.json`
4. Configure the workflow:

#### 2.1.1 Set Workflow Variables

In the workflow settings, add these variables:

```javascript
{
  "API_INTEGRATION_BEARER_TOKEN": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

#### 2.1.2 Update Execute Workflow Node IDs

Verify and update the workflow IDs in the Execute Workflow nodes:

- **Trading Engine**: `01-master-trading-orchestrator-alpaca`
- **Portfolio Monitor**: `04-portfolio-performance`
- **Notification System**: `05-notification-manager`

#### 2.1.3 Test Webhook URL

1. Activate the workflow
2. Note the webhook URL (e.g., `https://your-n8n.com/webhook/api-integration`)
3. Test with curl:

```bash
curl -X POST https://your-n8n.com/webhook/api-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{"action": "health_check", "payload": {}}'
```

### 2.2 Configure Existing Workflows

#### 2.2.1 Trading Engine Workflow

1. Open the **ADVANCED AI TRADING ENGINE** workflow
2. Add webhook trigger (if not present):
   - Path: `trading-engine`
   - Authentication: `headerAuth`
3. Add input validation node at the beginning

#### 2.2.2 Portfolio Monitor Workflow

1. Open the **PORTFOLIO & RISK MONITOR** workflow
2. Add webhook trigger (if not present):
   - Path: `portfolio-monitor`
   - Authentication: `headerAuth`
3. Ensure consistent response formatting

#### 2.2.3 Notification System Workflow

1. Open the **SMART NOTIFICATION SYSTEM** workflow
2. Add webhook trigger (if not present):
   - Path: `notification-system`
   - Authentication: `headerAuth`
3. Configure notification channels

## Phase 3: Next.js Application Integration

### 3.1 Install Dependencies

Add any missing dependencies to your `package.json`:

```bash
npm install joi @upstash/redis
# or
yarn add joi @upstash/redis
```

### 3.2 Deploy Integration Files

Ensure these files are in your project:

- `/lib/api/n8n-integration-client.ts` ✅ (Already created)
- `/app/api/n8n/integration/route.ts` ✅ (Already created)

### 3.3 Update Existing API Routes

Update existing n8n-related API routes to use the new integration client:

```typescript
// app/api/trading/execute/route.ts
import { n8nClient } from '@/lib/api/n8n-integration-client';

export async function POST(request: NextRequest) {
  try {
    const { symbol, side, quantity } = await request.json();
    
    // Use new integration client
    const result = await n8nClient.executeTrade({
      symbol,
      side,
      quantity,
      orderType: 'market'
    });
    
    return NextResponse.json(result);
  } catch (error) {
    // Handle with new error system
    return NextResponse.json(
      N8NErrorHandler.handleError(error),
      { status: 500 }
    );
  }
}
```

## Phase 4: Security Implementation

### 4.1 Enable HTTPS

Ensure your N8N instance is running with HTTPS:

```yaml
# docker-compose.yml for N8N
version: '3.7'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "443:5678"
    environment:
      - N8N_PROTOCOL=https
      - N8N_HOST=your-domain.com
      - WEBHOOK_URL=https://your-domain.com
    volumes:
      - ./ssl:/etc/ssl/certs
```

### 4.2 Configure Rate Limiting

Set up Redis for rate limiting:

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:latest

# Or use a cloud Redis service like Upstash
```

### 4.3 IP Allowlisting (Production)

Configure your firewall or load balancer to allow only authorized IPs:

```bash
# Example: Allow only your application server IP
iptables -A INPUT -p tcp --dport 5678 -s YOUR_APP_SERVER_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 5678 -j DROP
```

## Phase 5: Database Setup

### 5.1 Create Security Events Table

```sql
-- Create security events table in Supabase
CREATE TABLE security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    client_id VARCHAR(100),
    action VARCHAR(50),
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    source_ip INET
);

-- Create index for queries
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type);
```

### 5.2 Create Integration Logs Table

```sql
-- Create integration logs table
CREATE TABLE n8n_integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id VARCHAR(100) NOT NULL,
    execution_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    workflow VARCHAR(50),
    success BOOLEAN NOT NULL,
    response_time_ms INTEGER,
    error_code VARCHAR(50),
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes
CREATE INDEX idx_integration_logs_timestamp ON n8n_integration_logs(timestamp DESC);
CREATE INDEX idx_integration_logs_action ON n8n_integration_logs(action);
CREATE INDEX idx_integration_logs_success ON n8n_integration_logs(success);
```

## Phase 6: Testing & Validation

### 6.1 Health Check Testing

```bash
# Test Next.js health endpoint
curl -X GET "http://localhost:3000/api/n8n/integration?action=health"

# Test N8N direct webhook
curl -X POST https://your-n8n.com/webhook/api-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"action": "health_check", "payload": {}}'
```

### 6.2 Integration Testing Script

Create a test script:

```typescript
// scripts/test-n8n-integration.ts
import { n8nClient } from '../lib/api/n8n-integration-client';

async function runIntegrationTests() {
  console.log('Starting N8N Integration Tests...');
  
  // Test 1: Health Check
  try {
    const health = await n8nClient.healthCheck();
    console.log('✅ Health Check:', health);
  } catch (error) {
    console.error('❌ Health Check failed:', error);
  }
  
  // Test 2: Market Data
  try {
    const marketData = await n8nClient.getMarketData(['BTCUSD']);
    console.log('✅ Market Data:', marketData.success);
  } catch (error) {
    console.error('❌ Market Data failed:', error);
  }
  
  // Test 3: Portfolio Check
  try {
    const portfolio = await n8nClient.getPortfolioPerformance('1d');
    console.log('✅ Portfolio Check:', portfolio.success);
  } catch (error) {
    console.error('❌ Portfolio Check failed:', error);
  }
  
  // Test 4: Notification
  try {
    const notification = await n8nClient.sendNotification({
      type: 'system_status',
      message: 'Integration test successful',
      channels: ['telegram'],
      priority: 'low'
    });
    console.log('✅ Notification:', notification.success);
  } catch (error) {
    console.error('❌ Notification failed:', error);
  }
  
  console.log('Integration tests completed.');
}

runIntegrationTests();
```

Run the test:

```bash
npx tsx scripts/test-n8n-integration.ts
```

### 6.3 Load Testing

Use Artillery or similar tool:

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Load test"
scenarios:
  - name: "N8N Integration Test"
    requests:
      - post:
          url: "/api/n8n/integration"
          headers:
            Content-Type: "application/json"
          json:
            action: "get_market_data"
            payload:
              symbols: ["BTCUSD"]
```

```bash
artillery run artillery-config.yml
```

## Phase 7: Monitoring Setup

### 7.1 Enable Application Monitoring

Add monitoring endpoints:

```typescript
// app/api/monitoring/n8n/route.ts
import { ErrorMetricsCollector } from '@/lib/monitoring/error-metrics';
import { SecurityMetricsCollector } from '@/lib/monitoring/security-metrics';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  switch (type) {
    case 'errors':
      return NextResponse.json(ErrorMetricsCollector.getMetrics());
    case 'security':
      return NextResponse.json(await SecurityMetricsCollector.getSecurityMetrics());
    default:
      return NextResponse.json({
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
  }
}
```

### 7.2 Set Up Alerts

Configure monitoring alerts in your chosen system (e.g., DataDog, NewRelic):

```javascript
// Example alert conditions
{
  "error_rate_high": {
    "condition": "error_rate > 5%",
    "window": "5 minutes",
    "action": "send_alert"
  },
  "response_time_high": {
    "condition": "avg_response_time > 10 seconds",
    "window": "5 minutes", 
    "action": "send_alert"
  },
  "authentication_failures": {
    "condition": "auth_failures > 10",
    "window": "1 minute",
    "action": "send_critical_alert"
  }
}
```

## Phase 8: Production Deployment

### 8.1 Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] N8N workflows imported and active
- [ ] API integration workflow tested
- [ ] Security tokens generated and stored securely
- [ ] Rate limiting configured
- [ ] Database tables created
- [ ] Monitoring endpoints working
- [ ] Load testing completed successfully
- [ ] Error handling tested
- [ ] Documentation updated

### 8.2 Deployment Steps

1. **Deploy N8N workflows**:
   ```bash
   # Import workflows to production N8N
   n8n import:workflow --file=api-integration-workflow.json
   ```

2. **Deploy Next.js application**:
   ```bash
   # Build and deploy
   npm run build
   npm run start
   # or deploy to your platform (Vercel, Netlify, etc.)
   ```

3. **Update DNS and SSL**:
   - Point webhook URLs to production endpoints
   - Ensure SSL certificates are valid
   - Update CORS settings if needed

4. **Verify integration**:
   ```bash
   # Test production endpoints
   curl -X GET "https://your-app.com/api/n8n/integration?action=health"
   ```

### 8.3 Post-deployment Verification

Run the complete test suite in production:

```bash
# Set production environment
export NODE_ENV=production
export N8N_WEBHOOK_URL=https://your-production-n8n.com

# Run integration tests
npm run test:integration:n8n
```

## Phase 9: Monitoring & Maintenance

### 9.1 Regular Health Checks

Set up automated health checks:

```typescript
// scripts/health-check-cron.ts
import cron from 'node-cron';

// Run health check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const health = await n8nClient.healthCheck();
    if (health.status !== 'healthy') {
      await sendAlert('N8N Integration unhealthy', health.details);
    }
  } catch (error) {
    await sendCriticalAlert('N8N Integration health check failed', error);
  }
});
```

### 9.2 Token Rotation

Set up automated token rotation:

```bash
# Add to crontab (rotate every 30 days)
0 0 1 * * /path/to/rotate-token.sh
```

### 9.3 Performance Monitoring

Monitor key metrics:
- Request success rate (target: >99%)
- Average response time (target: <2 seconds)
- Error rate (target: <1%)
- Authentication failure rate (target: <0.1%)

## Troubleshooting Common Issues

### Issue 1: Authentication Failures

**Symptoms**: 401 errors, "Invalid token" messages

**Solutions**:
1. Verify `N8N_API_INTEGRATION_TOKEN` matches in both systems
2. Check token format (must include "Bearer " prefix)
3. Ensure N8N workflow variable is set correctly

### Issue 2: Workflow Not Found

**Symptoms**: "Workflow not found" errors in Execute Workflow nodes

**Solutions**:
1. Verify workflow IDs in Execute Workflow nodes
2. Ensure target workflows are active
3. Check workflow permissions and ownership

### Issue 3: Timeout Errors

**Symptoms**: 408 timeout errors, requests hanging

**Solutions**:
1. Increase timeout in client configuration
2. Check external API response times
3. Optimize workflow complexity
4. Review network connectivity

### Issue 4: Rate Limiting Issues

**Symptoms**: 429 errors, requests being rejected

**Solutions**:
1. Review rate limit configuration
2. Implement request queuing
3. Check Redis connectivity
4. Adjust limits based on usage patterns

## Support & Maintenance

### Documentation Links

- [N8N Integration Architecture](./INTEGRATION_ARCHITECTURE.md)
- [API Endpoints Documentation](./API_ENDPOINTS.md)
- [Security Implementation](./SECURITY_IMPLEMENTATION.md)
- [Error Handling Strategy](./ERROR_HANDLING_STRATEGY.md)

### Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: security@yourcompany.com
- **General Support**: support@yourcompany.com

### Maintenance Schedule

- **Daily**: Health checks, error monitoring
- **Weekly**: Performance review, security audit
- **Monthly**: Token rotation, dependency updates
- **Quarterly**: Load testing, security assessment

This deployment guide ensures a smooth, secure, and reliable integration between your Next.js trading bot and N8N workflows.