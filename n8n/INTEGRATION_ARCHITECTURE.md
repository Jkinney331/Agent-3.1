# N8N Integration Architecture Documentation

## Overview
This document outlines the complete integration architecture between the Next.js AI Crypto Trading Bot and the existing n8n workflows. The integration provides a unified API interface to communicate with three active n8n workflows through a centralized routing system.

## Architecture Components

### 1. Integration Layer Architecture

```mermaid
graph TB
    subgraph "Next.js Trading Bot Application"
        UI[User Interface]
        API[API Routes]
        CLIENT[N8N Integration Client]
        AUTH[Authentication Layer]
    end
    
    subgraph "N8N Integration Hub"
        WEBHOOK[API Integration Webhook]
        VALIDATOR[Auth & Validation]
        ROUTER[Action-Based Router]
        FORMATTER[Response Formatter]
    end
    
    subgraph "Active N8N Workflows"
        TRADING["🚀 ADVANCED AI TRADING ENGINE<br/>- Trade Execution<br/>- Market Data<br/>- Strategy Management"]
        PORTFOLIO["💼 PORTFOLIO & RISK MONITOR<br/>- Performance Tracking<br/>- Risk Assessment<br/>- Position Monitoring"]
        NOTIFY["📱 SMART NOTIFICATION SYSTEM<br/>- Multi-Channel Alerts<br/>- Report Generation<br/>- Status Updates"]
    end
    
    subgraph "External APIs & Services"
        ALPACA[Alpaca API<br/>Paper Trading]
        BINANCE[Binance API<br/>Market Data]
        COINGECKO[CoinGecko API<br/>Price Data]
        SUPABASE[(Supabase Database<br/>Data Storage)]
    end
    
    UI --> API
    API --> CLIENT
    CLIENT --> AUTH
    AUTH --> WEBHOOK
    
    WEBHOOK --> VALIDATOR
    VALIDATOR --> ROUTER
    ROUTER --> TRADING
    ROUTER --> PORTFOLIO  
    ROUTER --> NOTIFY
    
    TRADING --> FORMATTER
    PORTFOLIO --> FORMATTER
    NOTIFY --> FORMATTER
    
    TRADING --> ALPACA
    TRADING --> BINANCE
    PORTFOLIO --> SUPABASE
    NOTIFY --> SUPABASE
```

### 2. Request Flow Architecture

```mermaid
sequenceDiagram
    participant App as Next.js App
    participant API as API Route
    participant Client as N8N Client
    participant Hub as N8N Router
    participant WF as Target Workflow
    participant Ext as External API
    
    App->>API: POST /api/n8n/integration
    API->>Client: Process Request
    Client->>Hub: POST /webhook/api-integration
    
    Hub->>Hub: Validate Bearer Token
    Hub->>Hub: Parse & Route by Action
    Hub->>WF: Execute Workflow
    WF->>Ext: API Calls (if needed)
    Ext-->>WF: Response
    WF-->>Hub: Workflow Result
    Hub->>Hub: Format Response
    Hub-->>Client: Standardized Response
    Client-->>API: Typed Response
    API-->>App: JSON Response
```

## Security Implementation

### Bearer Token Authentication

The system uses bearer token authentication at multiple levels:

1. **Environment Variables**:
   ```bash
   N8N_API_INTEGRATION_TOKEN=your-secure-bearer-token-here
   N8N_WEBHOOK_URL=http://localhost:5678
   ```

2. **Request Headers**:
   ```typescript
   {
     "Authorization": "Bearer your-secure-bearer-token-here",
     "Content-Type": "application/json",
     "Accept": "application/json"
   }
   ```

3. **N8N Validation**:
   - Token validation in the first Code node
   - Automatic rejection of unauthorized requests
   - Request metadata tracking for audit trails

### Security Best Practices

- **Token Rotation**: Implement regular token rotation
- **Rate Limiting**: Configure request rate limits in n8n
- **Input Validation**: Comprehensive payload validation
- **Error Handling**: Sanitized error responses
- **Audit Logging**: Request tracking and monitoring

## API Specifications

### Standardized Request Format

```typescript
interface N8NRequest {
  action: string;                    // Required: Action to execute
  workflow?: 'trading' | 'portfolio' | 'notification' | 'auto';
  payload: Record<string, any>;      // Action-specific parameters
  metadata?: {
    userId?: string;
    source?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };
}
```

### Standardized Response Format

```typescript
interface N8NResponse<T = any> {
  success: boolean;                  // Operation success status
  data?: T;                         // Response data
  error?: string;                   // Error message if failed
  source: 'trading_engine' | 'portfolio_monitor' | 'notification_system';
  timestamp: string;                // ISO timestamp
  executionId?: string;             // N8N execution ID
  workflow?: string;                // Source workflow name
  statusCode: number;               // HTTP status code
  requestId?: string;               // Unique request identifier
}
```

## Workflow Action Mappings

### Trading Engine Actions

| Action | Description | Required Payload | Response Data |
|--------|-------------|------------------|---------------|
| `execute_trade` | Execute buy/sell order | `symbol`, `side`, `quantity` | Order details, execution status |
| `get_market_data` | Retrieve market prices | `symbols[]`, `timeframe` | OHLCV data, current prices |
| `manage_positions` | Position management | `action`, `positionId` | Position updates |
| `create_strategy` | Create trading strategy | `strategy` object | Strategy ID, status |

### Portfolio Monitor Actions

| Action | Description | Required Payload | Response Data |
|--------|-------------|------------------|---------------|
| `check_portfolio` | Get portfolio overview | `timeframe` | Holdings, P&L, metrics |
| `assess_risk` | Risk level assessment | `symbols[]`, `threshold` | Risk scores, recommendations |
| `get_performance` | Performance analytics | `timeframe`, `metrics` | Returns, Sharpe ratio, drawdown |
| `monitor_positions` | Position monitoring | `symbols[]` | Position status, alerts |

### Notification System Actions

| Action | Description | Required Payload | Response Data |
|--------|-------------|------------------|---------------|
| `send_notification` | Send message | `type`, `message`, `channels[]` | Delivery status |
| `create_alert` | Create alert rule | `message`, `priority`, `channels[]` | Alert ID, status |
| `send_report` | Generate report | `type`, `recipients[]` | Report ID, delivery status |

## Example API Requests

### Execute Trade

```bash
curl -X POST http://localhost:3000/api/n8n/integration \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_trade",
    "payload": {
      "symbol": "BTCUSD",
      "side": "buy",
      "quantity": 0.01,
      "orderType": "market"
    },
    "metadata": {
      "userId": "user123",
      "source": "web-dashboard"
    }
  }'
```

### Get Market Data

```bash
curl -X GET "http://localhost:3000/api/n8n/integration?action=market_data&symbols=BTCUSD,ETHUSD&timeframe=1h"
```

### Send Risk Alert

```bash
curl -X POST http://localhost:3000/api/n8n/integration \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_alert",
    "payload": {
      "message": "High risk detected in BTCUSD position",
      "channels": ["telegram", "email"],
      "priority": "high"
    }
  }'
```

## Error Handling Strategy

### Error Categories

1. **Authentication Errors** (401)
   - Invalid or missing bearer token
   - Token expired or revoked

2. **Validation Errors** (400)
   - Missing required fields
   - Invalid request format
   - Unsupported actions

3. **Workflow Errors** (500)
   - N8N execution failures
   - External API timeouts
   - Data processing errors

4. **Timeout Errors** (408)
   - Request timeout (45 seconds default)
   - Workflow execution timeout

### Error Response Format

```typescript
{
  "success": false,
  "error": "Descriptive error message",
  "statusCode": 400,
  "timestamp": "2025-08-08T12:00:00.000Z",
  "requestId": "req_1691491200_xyz123",
  "supportedActions": ["execute_trade", "get_market_data", ...]
}
```

## Deployment Configuration

### Environment Variables

```bash
# N8N Configuration
N8N_API_INTEGRATION_TOKEN=your-secure-bearer-token
N8N_WEBHOOK_URL=http://localhost:5678
N8N_BASE_URL=http://localhost:5678

# Trading APIs
ALPACA_API_KEY=PK6V8YP89R7JPD2O5BA4
ALPACA_SECRET_KEY=XfjX2P0pvowkkQP0fkkwbhMJBBcDnMorBW5e73DZ
BINANCE_API_KEY=428pEV4wB7JeFNUS8w5v0QBw7ed12L7A7pCpUwkSSsfnRtPWvJr1lgrFeoqpCpLB

# Database
SUPABASE_URL=https://sjtulkkhxojiitpjhgrt.supabase.co
```

### N8N Workflow IDs

```javascript
// Workflow ID mappings for Execute Workflow nodes
const WORKFLOW_IDS = {
  trading: "01-master-trading-orchestrator-alpaca",
  portfolio: "04-portfolio-performance", 
  notification: "05-notification-manager"
};
```

## Performance Optimization

### Timeout Configuration

- **Default Request Timeout**: 45 seconds
- **Workflow Execution**: Synchronous (waitForSubWorkflow: true)
- **Response Caching**: Not implemented (real-time data required)

### Scaling Considerations

1. **Horizontal Scaling**: Multiple n8n instances behind load balancer
2. **Workflow Optimization**: Parallel execution where possible
3. **Database Connection Pooling**: Supabase connection management
4. **API Rate Limiting**: Respect external API limits

## Monitoring and Health Checks

### Health Check Endpoint

```bash
curl -X GET "http://localhost:3000/api/n8n/integration?action=health"
```

### Key Metrics to Monitor

- Request success rate (target: >95%)
- Average response time (target: <5 seconds)
- Workflow execution success rate (target: >99%)
- External API success rate (target: >95%)

### Alerting Thresholds

- **Critical**: >10% error rate in 5 minutes
- **Warning**: >5% error rate in 10 minutes
- **Info**: Response time >10 seconds

## Troubleshooting Guide

### Common Issues

1. **"Unauthorized" Errors**
   - Verify N8N_API_INTEGRATION_TOKEN environment variable
   - Check bearer token format in requests
   - Ensure n8n workflow is active

2. **"Workflow not found" Errors**
   - Verify workflow IDs in Execute Workflow nodes
   - Check workflow is published and active
   - Confirm workflow permissions

3. **Timeout Errors**
   - Increase timeout in client configuration
   - Check external API response times
   - Review workflow complexity

4. **Data Format Errors**
   - Validate request payload structure
   - Check required fields in action mappings
   - Review response format expectations

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=n8n:integration:*
```

This comprehensive integration architecture provides a robust, scalable foundation for connecting your Next.js trading bot with the existing n8n workflows while maintaining security, reliability, and performance standards.