# 🎮 Paper Trading Quick Reference

## 🚀 System Status Check

### ✅ Daily Startup Checklist
- [ ] Alpaca account status: ACTIVE
- [ ] n8n workflows: Running
- [ ] Risk monitor: Alert-free
- [ ] Account balance: Sufficient

### 📊 Key Endpoints to Monitor

#### Account Status
```
GET https://paper-api.alpaca.markets/v2/account
```
**Check**: `status: "ACTIVE"`, `trading_blocked: false`

#### Current Positions
```
GET https://paper-api.alpaca.markets/v2/positions
```
**Monitor**: Position count, unrealized P&L

#### Recent Orders
```
GET https://paper-api.alpaca.markets/v2/orders?status=all&limit=10
```
**Check**: Order success rate, rejections

## 🛡️ Risk Alert Levels

| Level | Description | Action |
|-------|-------------|---------|
| 🟢 **LOW** | Normal operations | Continue monitoring |
| 🟡 **MEDIUM** | Increased risk | Monitor closely |
| 🟠 **HIGH** | Concerning levels | Consider reducing positions |
| 🔴 **CRITICAL** | Emergency stop triggered | All trading halted |

## 📈 Performance Metrics

### Daily Targets
- **Win Rate**: > 50%
- **Risk Level**: LOW-MEDIUM
- **Position Utilization**: < 70%
- **Order Success Rate**: > 80%

### Weekly Goals
- **Total Return**: Track vs. benchmark
- **Max Drawdown**: < 10%
- **Sharpe Ratio**: > 1.0
- **Trading Frequency**: Optimal range

## 🔧 Emergency Controls

### Immediate Actions
1. **Stop All Trading**
   ```
   Deactivate: "Master Trading Orchestrator - Alpaca"
   ```

2. **Close All Positions**
   ```
   DELETE https://paper-api.alpaca.markets/v2/positions
   ```

3. **Cancel All Orders**
   ```
   DELETE https://paper-api.alpaca.markets/v2/orders
   ```

### n8n Workflow Controls
- **Pause Execution**: Click pause button in workflow
- **Manual Execution**: Test individual nodes
- **Error Logs**: Check execution history for errors

## 🎯 Trading Symbols

### Current Watchlist
- **BTCUSD** - Bitcoin
- **ETHUSD** - Ethereum  
- **ADAUSD** - Cardano
- **SOLUSD** - Solana
- **LINKUSD** - Chainlink
- **DOTUSD** - Polkadot
- **AVAXUSD** - Avalanche

### Position Limits
- **Max Positions**: 3-5 concurrent
- **Position Size**: 5-10% of account
- **Single Symbol**: Max 25% allocation

## 📱 Mobile Monitoring

### Alpaca Mobile App
- **Account Overview**: Real-time balance
- **Position Tracking**: P&L monitoring
- **Order History**: Trade confirmations

### n8n Mobile Access
- **Workflow Status**: Check executions
- **Error Alerts**: Monitor failures
- **Manual Controls**: Emergency stops

## 🔔 Alert Settings

### High Priority (Immediate Action)
- Risk level: CRITICAL
- Account status: BLOCKED
- Large position loss: > 10%
- Order rejection rate: > 50%

### Medium Priority (Monitor)
- Risk level: HIGH
- Win rate: < 40%
- Position concentration: > 50%
- Unusual trading volume

### Low Priority (Informational)
- Daily summary reports
- Performance updates
- System health checks

## 📞 Emergency Contacts

### Technical Support
- **n8n Community**: https://community.n8n.io/
- **Alpaca Support**: https://alpaca.markets/support

### System Access
- **n8n Dashboard**: Your n8n instance URL
- **Alpaca Paper Trading**: https://app.alpaca.markets/paper/dashboard

## 🔍 Troubleshooting Quick Fixes

### Common Issues

#### 🚫 Order Rejections
1. Check account buying power
2. Verify symbol format (e.g., BTCUSD not BTC)
3. Confirm market hours (9:30 AM - 4:00 PM ET)

#### ⚠️ Authentication Errors
1. Verify API keys in n8n credentials
2. Check Alpaca account status
3. Test connection with simple API call

#### 🔄 Workflow Errors
1. Check n8n execution logs
2. Test individual nodes
3. Verify data format between nodes

#### 📊 Data Issues
1. Confirm market data availability
2. Check symbol mapping
3. Verify timestamp formats

## 💡 Optimization Tips

### Performance Tuning
- **Execution Frequency**: Start with 5-minute intervals
- **Position Sizing**: Begin with 1-2% of account
- **Risk Limits**: Conservative thresholds initially

### Best Practices
- **Monitor First**: Observe for 1-2 days before trusting
- **Start Small**: Test with minimal position sizes
- **Document Issues**: Track errors and solutions
- **Regular Reviews**: Daily performance analysis

---

## 🎯 Success Indicators

✅ **System Running Smoothly**
- Consistent executions every 30 seconds
- Risk level staying LOW-MEDIUM
- Order success rate > 80%
- Account equity trending positive

⚠️ **Needs Attention**
- Error rates increasing
- Risk level frequently HIGH
- Large drawdowns
- System connectivity issues

🔴 **Immediate Action Required**
- CRITICAL risk alerts
- Account blocked/suspended
- Multiple execution failures
- Unexpected large losses

**Stay vigilant and trade responsibly!** 📈 