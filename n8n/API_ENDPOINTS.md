# N8N Integration API Endpoints

## Base Configuration

- **Base URL**: `http://localhost:3000/api/n8n/integration`
- **Authentication**: Bearer Token (set in environment variables)
- **Content-Type**: `application/json`
- **Timeout**: 45 seconds

## Main Integration Endpoint

### POST `/api/n8n/integration`

Central endpoint for all n8n workflow interactions.

#### Request Headers

```http
POST /api/n8n/integration HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json
Authorization: Bearer your-token-here
```

#### Standard Request Body

```typescript
{
  "action": string,                    // Required: Action to execute
  "workflow"?: "trading" | "portfolio" | "notification" | "auto",
  "payload": {                         // Action-specific parameters
    [key: string]: any
  },
  "metadata"?: {
    "userId"?: string,
    "source"?: string,
    "priority"?: "low" | "medium" | "high" | "critical"
  }
}
```

#### Standard Response Body

```typescript
{
  "success": boolean,
  "data"?: any,
  "error"?: string,
  "source": "trading_engine" | "portfolio_monitor" | "notification_system",
  "timestamp": string,
  "executionId"?: string,
  "workflow"?: string,
  "statusCode": number,
  "requestId"?: string
}
```

## Trading Engine Actions

### Execute Trade

Execute a buy or sell order through the trading engine.

**Request:**
```json
{
  "action": "execute_trade",
  "payload": {
    "symbol": "BTCUSD",
    "side": "buy",
    "quantity": 0.01,
    "orderType": "market",
    "price": 45000,
    "stopLoss": 43000,
    "takeProfit": 47000
  },
  "metadata": {
    "userId": "user123",
    "source": "web-dashboard",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_12345",
    "symbol": "BTCUSD",
    "side": "buy",
    "quantity": 0.01,
    "status": "filled",
    "executedPrice": 45123.45,
    "fees": 0.001,
    "timestamp": "2025-08-08T12:00:00.000Z"
  },
  "source": "trading_engine",
  "timestamp": "2025-08-08T12:00:01.234Z",
  "executionId": "exec_abc123",
  "workflow": "advanced-ai-trading-engine",
  "statusCode": 200
}
```

### Get Market Data

Retrieve real-time market data for specified symbols.

**Request:**
```json
{
  "action": "get_market_data",
  "payload": {
    "symbols": ["BTCUSD", "ETHUSD", "ADAUSD"],
    "timeframe": "1m"
  },
  "metadata": {
    "source": "dashboard-refresh"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "BTCUSD": {
      "price": 45123.45,
      "change": 123.45,
      "changePercent": 0.27,
      "volume": 1234567.89,
      "high": 45500.00,
      "low": 44800.00,
      "timestamp": "2025-08-08T12:00:00.000Z"
    },
    "ETHUSD": {
      "price": 2851.23,
      "change": -15.67,
      "changePercent": -0.55,
      "volume": 234567.89,
      "high": 2875.00,
      "low": 2840.00,
      "timestamp": "2025-08-08T12:00:00.000Z"
    }
  },
  "source": "trading_engine",
  "timestamp": "2025-08-08T12:00:01.123Z",
  "statusCode": 200
}
```

### Create Strategy

Create a new trading strategy configuration.

**Request:**
```json
{
  "action": "create_strategy",
  "payload": {
    "strategy": {
      "id": "momentum_v1",
      "name": "Momentum Trading Strategy",
      "type": "momentum",
      "parameters": {
        "riskLevel": 0.02,
        "maxPositionSize": 0.1,
        "stopLoss": 0.05,
        "takeProfit": 0.10,
        "timeframe": "1h",
        "symbols": ["BTCUSD", "ETHUSD"]
      }
    }
  },
  "metadata": {
    "userId": "user123",
    "source": "strategy-builder"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "strategyId": "momentum_v1",
    "status": "created",
    "active": false,
    "createdAt": "2025-08-08T12:00:00.000Z",
    "parameters": {
      "riskLevel": 0.02,
      "maxPositionSize": 0.1,
      "stopLoss": 0.05,
      "takeProfit": 0.10,
      "timeframe": "1h",
      "symbols": ["BTCUSD", "ETHUSD"]
    }
  },
  "source": "trading_engine",
  "timestamp": "2025-08-08T12:00:01.456Z",
  "statusCode": 200
}
```

## Portfolio Monitor Actions

### Check Portfolio Performance

Get comprehensive portfolio performance metrics.

**Request:**
```json
{
  "action": "check_portfolio",
  "payload": {
    "timeframe": "1d",
    "includeMetrics": true
  },
  "metadata": {
    "source": "dashboard"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 10542.31,
    "totalReturn": 542.31,
    "totalReturnPercent": 5.43,
    "dayReturn": 123.45,
    "dayReturnPercent": 1.19,
    "positions": [
      {
        "symbol": "BTCUSD",
        "quantity": 0.25,
        "averagePrice": 44000.00,
        "currentPrice": 45123.45,
        "marketValue": 11280.86,
        "unrealizedPnL": 280.86,
        "unrealizedPnLPercent": 2.55
      }
    ],
    "metrics": {
      "sharpeRatio": 1.23,
      "maxDrawdown": 0.05,
      "winRate": 0.67,
      "profitFactor": 1.85
    }
  },
  "source": "portfolio_monitor",
  "timestamp": "2025-08-08T12:00:01.789Z",
  "statusCode": 200
}
```

### Assess Risk

Perform risk assessment on current positions and market conditions.

**Request:**
```json
{
  "action": "assess_risk",
  "payload": {
    "symbols": ["BTCUSD", "ETHUSD"],
    "riskThreshold": 0.05
  },
  "metadata": {
    "source": "risk-monitor"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallRiskLevel": "MEDIUM",
    "portfolioVar": 0.0347,
    "positionRisks": [
      {
        "symbol": "BTCUSD",
        "riskLevel": "HIGH",
        "var": 0.0523,
        "beta": 1.15,
        "recommendations": [
          "Consider reducing position size",
          "Set tighter stop loss"
        ]
      }
    ],
    "marketRisk": {
      "volatilityIndex": 0.45,
      "correlationRisk": 0.67,
      "liquidityRisk": 0.23
    },
    "recommendations": [
      "Diversify across more assets",
      "Consider hedging positions"
    ]
  },
  "source": "portfolio_monitor",
  "timestamp": "2025-08-08T12:00:02.123Z",
  "statusCode": 200
}
```

## Notification System Actions

### Send Notification

Send immediate notification through specified channels.

**Request:**
```json
{
  "action": "send_notification",
  "payload": {
    "type": "trade_execution",
    "message": "BTCUSD buy order executed: 0.01 BTC at $45,123.45",
    "channels": ["telegram", "email"],
    "priority": "medium"
  },
  "metadata": {
    "userId": "user123",
    "source": "trade-executor"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_xyz789",
    "deliveryStatus": {
      "telegram": {
        "sent": true,
        "messageId": "tg_123456",
        "timestamp": "2025-08-08T12:00:00.000Z"
      },
      "email": {
        "sent": true,
        "messageId": "email_789012",
        "timestamp": "2025-08-08T12:00:01.000Z"
      }
    },
    "totalRecipients": 2,
    "successfulDeliveries": 2
  },
  "source": "notification_system",
  "timestamp": "2025-08-08T12:00:02.456Z",
  "statusCode": 200
}
```

### Create Alert

Create persistent alert rule for monitoring conditions.

**Request:**
```json
{
  "action": "create_alert",
  "payload": {
    "message": "BTCUSD price dropped below $44,000",
    "channels": ["telegram"],
    "priority": "critical"
  },
  "metadata": {
    "source": "price-monitor"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": "alert_456789",
    "status": "active",
    "createdAt": "2025-08-08T12:00:00.000Z",
    "triggerCondition": "BTCUSD < 44000",
    "channels": ["telegram"],
    "priority": "critical"
  },
  "source": "notification_system",
  "timestamp": "2025-08-08T12:00:02.789Z",
  "statusCode": 200
}
```

### Send Daily Report

Generate and send comprehensive daily trading report.

**Request:**
```json
{
  "action": "send_report",
  "payload": {
    "recipients": ["user@example.com"],
    "type": "daily_performance"
  },
  "metadata": {
    "source": "scheduled-reporter"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "report_daily_20250808",
    "generatedAt": "2025-08-08T12:00:00.000Z",
    "reportType": "daily_performance",
    "deliveryStatus": {
      "email": {
        "sent": true,
        "recipients": ["user@example.com"],
        "attachments": ["daily_report_20250808.pdf"]
      }
    },
    "reportMetrics": {
      "totalTrades": 15,
      "winRate": 0.73,
      "dailyReturn": 1.19,
      "topPerformer": "ETHUSD"
    }
  },
  "source": "notification_system",
  "timestamp": "2025-08-08T12:00:03.123Z",
  "statusCode": 200
}
```

## GET Endpoint Quick Access

### GET `/api/n8n/integration`

Provides quick access to common read-only operations.

#### Health Check

```bash
curl -X GET "http://localhost:3000/api/n8n/integration?action=health"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "details": "Connected to n8n. Execution ID: exec_health_123"
  },
  "timestamp": "2025-08-08T12:00:00.000Z"
}
```

#### Market Data

```bash
curl -X GET "http://localhost:3000/api/n8n/integration?action=market_data&symbols=BTCUSD,ETHUSD&timeframe=1h"
```

#### Portfolio Overview

```bash
curl -X GET "http://localhost:3000/api/n8n/integration?action=portfolio&timeframe=1d"
```

## Error Responses

### Authentication Error (401)

```json
{
  "success": false,
  "error": "Unauthorized - Invalid or missing bearer token",
  "statusCode": 401,
  "timestamp": "2025-08-08T12:00:00.000Z"
}
```

### Validation Error (400)

```json
{
  "success": false,
  "error": "Missing required field: action",
  "statusCode": 400,
  "timestamp": "2025-08-08T12:00:00.000Z",
  "supportedActions": [
    "execute_trade", "get_market_data", "create_strategy",
    "check_portfolio", "assess_risk", "get_performance",
    "send_notification", "create_alert", "send_report"
  ]
}
```

### Workflow Error (500)

```json
{
  "success": false,
  "error": "N8N workflow execution failed: External API timeout",
  "statusCode": 500,
  "timestamp": "2025-08-08T12:00:00.000Z",
  "requestId": "req_1691491200_xyz123",
  "executionId": "exec_failed_456"
}
```

### Timeout Error (408)

```json
{
  "success": false,
  "error": "N8N request timed out after 45000ms",
  "statusCode": 408,
  "timestamp": "2025-08-08T12:00:00.000Z"
}
```

## Rate Limits

- **Default Rate Limit**: 100 requests per minute per API key
- **Trading Actions**: 10 requests per minute (higher impact)
- **Market Data**: 60 requests per minute
- **Notifications**: 30 requests per minute

## Request/Response Headers

### Standard Headers

**Request:**
```http
Authorization: Bearer your-token-here
Content-Type: application/json
Accept: application/json
User-Agent: NextJS-Trading-Bot/1.0
```

**Response:**
```http
Content-Type: application/json
X-Execution-ID: exec_abc123
X-Request-ID: req_1691491200_xyz123
X-Source-Workflow: trading_engine
X-RateLimit-Remaining: 95
```

## Usage Examples

### TypeScript Client Usage

```typescript
import { n8nClient } from '@/lib/api/n8n-integration-client';

// Execute a trade
const tradeResult = await n8nClient.executeTrade({
  symbol: 'BTCUSD',
  side: 'buy',
  quantity: 0.01,
  orderType: 'market'
});

// Get portfolio performance
const portfolio = await n8nClient.getPortfolioPerformance('1d');

// Send alert
const alert = await n8nClient.createAlert({
  message: 'Risk threshold exceeded',
  channels: ['telegram'],
  priority: 'high'
});
```

### cURL Examples

```bash
# Health check
curl -X GET "http://localhost:3000/api/n8n/integration?action=health"

# Execute trade
curl -X POST http://localhost:3000/api/n8n/integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"action":"execute_trade","payload":{"symbol":"BTCUSD","side":"buy","quantity":0.01}}'

# Get market data
curl -X GET "http://localhost:3000/api/n8n/integration?action=market_data&symbols=BTCUSD"
```

This API specification provides comprehensive documentation for integrating with the n8n workflows through a unified interface, enabling seamless communication between the Next.js trading bot and the automated trading systems.