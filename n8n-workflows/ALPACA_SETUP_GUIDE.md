# 🎯 Alpaca Paper Trading Setup Guide

## Overview
This guide will help you configure your n8n workflows to use Alpaca's paper trading API for live trading operations while maintaining Binance integration for additional data sources.

## 📋 Prerequisites
- n8n instance running (self-hosted or cloud)
- Alpaca paper trading account
- Binance account (optional, for additional market data)
- Access to n8n workflow management

## 🔧 Step 1: Configure API Credentials in n8n

### Alpaca API Setup
1. **Open n8n and go to Credentials**
   - Click on "Credentials" in the left sidebar
   - Click "+ Add Credential"

2. **Create Alpaca HTTP Header Auth Credential**
   - Search for "HTTP Header Auth"
   - Name: `Alpaca Paper Trading API`
   - Add the following headers:
     ```
     Header 1:
     Name: APCA-API-KEY-ID
     Value: PK6V8YP89R7JPD2O5BA4
     
     Header 2:
     Name: APCA-API-SECRET-KEY
     Value: XfjX2P0pvowkkQP0fkkwbhMJBBcDnMorBW5e73DZ
     ```
   - Save the credential

3. **Test the Credential**
   - Create a test HTTP Request node
   - URL: `https://paper-api.alpaca.markets/v2/account`
   - Method: GET
   - Authentication: Use the Alpaca credential you just created
   - Execute to verify connection

### Binance API Setup (Optional)
1. **Create Binance HTTP Header Auth Credential**
   - Name: `Binance API`
   - Add headers:
     ```
     Header 1:
     Name: X-MBX-APIKEY
     Value: 428pEV4wB7JeFNUS8w5v0QBw7ed12L7A7pCpUwkSSsfnRtPWvJr1lgrFeoqpCpLB
     ```
   - Save the credential

## 🔄 Step 2: Import Updated Workflows

### Import the Alpaca-Integrated Workflows
1. **Master Trading Orchestrator - Alpaca**
   - Import `01-master-trading-orchestrator-alpaca.json`
   - Configure credential references to use your Alpaca credential
   - Activate the workflow

2. **Risk Management Monitor - Alpaca**
   - Import `02-risk-management-monitor-alpaca.json`
   - Configure credential references to use your Alpaca credential
   - Activate the workflow

3. **Keep Original Workflows as Backup**
   - Rename original workflows with "-backup" suffix
   - Keep them deactivated

## 📊 Step 3: Verify Account Connection

### Test Account Access
Run a test execution on the following endpoint:
```
GET https://paper-api.alpaca.markets/v2/account
```

Expected response should include:
```json
{
  "account_blocked": false,
  "account_number": "...",
  "buying_power": "...",
  "cash": "...",
  "created_at": "...",
  "currency": "USD",
  "equity": "...",
  "id": "...",
  "initial_margin": "...",
  "last_equity": "...",
  "long_market_value": "...",
  "maintenance_margin": "...",
  "multiplier": "1",
  "pattern_day_trader": false,
  "portfolio_value": "...",
  "regt_buying_power": "...",
  "short_market_value": "...",
  "status": "ACTIVE",
  "trade_suspended_by_user": false,
  "trading_blocked": false
}
```

## 🚀 Step 4: Start Paper Trading

### Initial Configuration
1. **Adjust Trading Parameters**
   - Open the Master Trading Orchestrator workflow
   - Modify the "Set Trading Parameters" node:
     ```javascript
     {
       "cryptoSymbols": ["BTCUSD", "ETHUSD", "ADAUSD", "SOLUSD"], // Adjust symbols
       "tradingCapital": "={{ Math.min(1000, parseFloat($json.buying_power) * 0.05) }}", // 5% of buying power, max $1000
       "maxPositions": 3 // Limit concurrent positions
     }
     ```

2. **Risk Management Settings**
   - Open the Risk Management Monitor workflow
   - Adjust risk thresholds in the "Advanced Risk Analysis" node if needed

3. **Trading Schedule**
   - Default: Every 30 seconds (for testing)
   - For production: Consider 5-15 minute intervals
   - Market hours: 9:30 AM - 4:00 PM ET

### Activate Workflows
1. **Start with Risk Management**
   - Activate "Risk Management Monitor - Alpaca" first
   - Monitor for 10-15 minutes to ensure it's working correctly

2. **Activate Trading Orchestrator**
   - Activate "Master Trading Orchestrator - Alpaca"
   - Start with small position sizes for testing

## 📈 Step 5: Monitor Performance

### Real-time Monitoring
- **Account Dashboard**: Monitor via Alpaca web interface
- **n8n Execution Log**: Watch workflow executions
- **Risk Alerts**: Monitor for risk management notifications

### Key Metrics to Watch
- **Account Equity**: Starting vs. current value
- **Position Count**: Number of open positions
- **Win Rate**: Percentage of profitable trades
- **Risk Level**: Current portfolio risk assessment
- **Order Success Rate**: Percentage of successfully filled orders

## 🛡️ Risk Management Features

### Automatic Safeguards
- **Emergency Stop**: Triggers if risk level reaches CRITICAL
- **Position Limits**: Maximum number of concurrent positions
- **Capital Allocation**: Limited percentage of account per trade
- **Day Trading Protection**: PDT rule monitoring

### Manual Controls
- **Workflow Deactivation**: Stop all trading immediately
- **Position Closure**: Manual position closing via Alpaca interface
- **Risk Threshold Adjustment**: Modify risk parameters as needed

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Errors
- **Solution**: Verify API keys are correctly entered
- **Check**: Ensure using paper trading endpoint URLs
- **Verify**: Account status is ACTIVE and trading_blocked is false

#### 2. Order Rejections
- **Causes**: Insufficient buying power, invalid symbol, market closed
- **Solution**: Check account balance and market hours
- **Monitor**: Order rejection rate in risk analysis

#### 3. Workflow Execution Errors
- **Check**: n8n error logs for specific error messages
- **Verify**: All HTTP request nodes use correct authentication
- **Test**: Individual nodes in isolation

### Market Data Issues
- **Alpaca Data**: Limited to market hours for live data
- **Alternative**: Use Binance or other data sources for 24/7 crypto data
- **Fallback**: Implement data source redundancy

## 📞 Support & Resources

### Alpaca Resources
- **Documentation**: https://alpaca.markets/docs/
- **API Reference**: https://alpaca.markets/docs/api-references/
- **Paper Trading**: https://app.alpaca.markets/paper/dashboard/overview

### n8n Resources
- **Documentation**: https://docs.n8n.io/
- **Community**: https://community.n8n.io/
- **HTTP Request Node**: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/

## 🎯 Next Steps

### Phase 1: Paper Trading Validation (1-2 weeks)
- [ ] Monitor automated trades
- [ ] Verify risk management effectiveness
- [ ] Optimize position sizing and timing
- [ ] Document performance metrics

### Phase 2: Strategy Refinement (2-4 weeks)  
- [ ] Implement additional technical indicators
- [ ] Enhance AI decision-making logic
- [ ] Add more sophisticated risk models
- [ ] Integrate additional data sources

### Phase 3: Live Trading Preparation (Future)
- [ ] Switch to live Alpaca API endpoints
- [ ] Implement additional compliance checks
- [ ] Add real-money risk management
- [ ] Establish monitoring and alerting systems

## ⚠️ Important Notes

### Paper Trading Limitations
- **Execution Differences**: Paper trades may not reflect real market conditions
- **Liquidity**: No real liquidity constraints in paper trading
- **Slippage**: Real trading may experience more slippage
- **Latency**: Paper trading may have different latency characteristics

### Security Considerations
- **API Keys**: Never share or commit API keys to version control
- **Permissions**: Use minimal required permissions for API keys
- **Monitoring**: Regularly monitor for unusual account activity
- **Backup**: Keep secure backups of workflow configurations

### Legal & Compliance
- **Paper Trading Only**: Current setup is for paper trading only
- **No Financial Advice**: This is for educational/testing purposes
- **Risk Disclosure**: All trading involves risk of loss
- **Compliance**: Ensure compliance with local financial regulations

---

**Ready to Start Paper Trading!** 🚀

Your Alpaca paper trading integration is now configured and ready to go. Start with small position sizes and closely monitor the automated trading behavior before scaling up. 