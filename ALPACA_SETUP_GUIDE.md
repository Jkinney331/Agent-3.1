# Alpaca API Setup Guide

This guide will help you set up Alpaca paper trading credentials for the AI Crypto Trading Bot.

## 🎯 Quick Start

1. **Create an Alpaca Account** (Free)
2. **Get Paper Trading API Keys**
3. **Configure Environment Variables**
4. **Test Connection**

---

## 📋 Step-by-Step Setup

### 1. Create Alpaca Account

1. Go to [Alpaca Markets](https://alpaca.markets)
2. Click "Get Started" or "Sign Up"
3. Complete the account registration
4. **Important**: You can start using paper trading immediately without funding your account

### 2. Access Paper Trading Dashboard

1. Login to your Alpaca account
2. Navigate to: [https://app.alpaca.markets/paper/dashboard/overview](https://app.alpaca.markets/paper/dashboard/overview)
3. This is your **Paper Trading** dashboard (not live trading)

### 3. Generate API Keys

1. In the paper trading dashboard, go to **"View API Keys"** or **"API Keys"** section
2. Click **"Generate New Key"** or **"Create API Key"**
3. Give it a descriptive name like "AI Trading Bot - Paper Trading"
4. **Copy both the API Key and Secret Key immediately** (you won't be able to see the secret again)

Example keys will look like:
- API Key: `PKTEST1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P`
- Secret Key: `abcdef123456789ABCDEF123456789abcdef123456789ABCDEF`

### 4. Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Find the Alpaca configuration section (around line 69-76)
3. Replace the placeholder values:

```bash
# Alpaca Trading (US Stocks/Crypto) - Paper Trading Configuration
ALPACA_API_KEY=PKTEST1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P     # Your actual API key
ALPACA_SECRET_KEY=abcdef123456789ABCDEF123456789abcdef123456789ABCDEF  # Your actual secret key
ALPACA_PAPER=true                               # Enable paper trading (REQUIRED)
ALPACA_BASE_URL=https://paper-api.alpaca.markets  # Paper trading API URL
ALPACA_DATA_URL=https://data.alpaca.markets      # Market data API URL
```

### 5. Test Your Configuration

Run the test script to verify your setup:

```bash
# Navigate to project directory
cd /path/to/ai-crypto-trading-bot

# Run the Alpaca connection test
node scripts/simple-alpaca-test.js
```

Expected successful output:
```
🎉 Alpaca API Connection Test Completed Successfully!
✅ Connected to REAL Alpaca paper trading account
🎯 Overall Result: SUCCESS - Alpaca integration is working
```

---

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `ALPACA_API_KEY` | Your Alpaca paper trading API key | `PKTEST...` |
| `ALPACA_SECRET_KEY` | Your Alpaca paper trading secret key | `abcdef123...` |
| `ALPACA_PAPER` | Enable paper trading mode | `true` |
| `ALPACA_BASE_URL` | Alpaca paper trading API endpoint | `https://paper-api.alpaca.markets` |
| `ALPACA_DATA_URL` | Alpaca market data API endpoint | `https://data.alpaca.markets` |

### Paper Trading vs Live Trading

| Mode | API Endpoint | Risk | Purpose |
|------|-------------|------|---------|
| **Paper Trading** | `https://paper-api.alpaca.markets` | ✅ No Risk | Testing & Development |
| **Live Trading** | `https://api.alpaca.markets` | ⚠️ Real Money | Production Trading |

**Always use paper trading for development and testing!**

---

## 🚀 Testing Your Setup

### Basic Connection Test

```bash
node scripts/simple-alpaca-test.js
```

### Advanced Testing

```bash
# Test the full trading pipeline
npm run integrated:test:quick
```

### What the Test Checks

1. **Configuration Validation** - All required environment variables
2. **API Connection** - Can connect to Alpaca servers
3. **Account Access** - Can retrieve account information
4. **Portfolio Data** - Can get positions and orders
5. **Order Placement** - Can place and cancel test orders

---

## 🛠 Troubleshooting

### Common Issues

#### 1. "403 Forbidden" Error
- **Cause**: Invalid API credentials
- **Solution**: Double-check your API key and secret key
- **Verify**: Make sure you're using paper trading keys (they start with `PK` for API key)

#### 2. "404 Not Found" Error
- **Cause**: Wrong API endpoint
- **Solution**: Ensure `ALPACA_BASE_URL=https://paper-api.alpaca.markets`

#### 3. "Network Error" or "Timeout"
- **Cause**: Network connectivity issues
- **Solution**: Check your internet connection and firewall settings

#### 4. "Invalid JSON" Error
- **Cause**: Malformed API response
- **Solution**: Check Alpaca service status at [status.alpaca.markets](https://status.alpaca.markets)

### Debug Steps

1. **Verify Environment Variables**:
   ```bash
   echo $ALPACA_API_KEY
   echo $ALPACA_SECRET_KEY
   echo $ALPACA_PAPER
   ```

2. **Check API Key Format**:
   - Paper trading API keys start with `PK`
   - Live trading API keys start with `AK`
   - Make sure you're using paper trading keys!

3. **Test with curl**:
   ```bash
   curl -H "APCA-API-KEY-ID: your-api-key" \
        -H "APCA-API-SECRET-KEY: your-secret-key" \
        https://paper-api.alpaca.markets/v2/account
   ```

---

## 📊 Paper Trading Account Features

### What You Get with Paper Trading

- **$100,000 virtual cash** to start trading
- **Real-time market data** for testing strategies
- **All order types supported** (market, limit, stop, etc.)
- **Portfolio tracking** and performance metrics
- **No risk** - it's all simulated

### Limitations

- **No real money involved** - gains/losses are virtual
- **Some market conditions** may behave differently than live trading
- **Reset capability** - you can reset your paper account if needed

---

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
2. **Use paper trading keys only** for development
3. **Rotate keys periodically** for security
4. **Store keys securely** in environment variables
5. **Limit API key permissions** to what's needed

---

## 🎯 Next Steps

After successful setup:

1. **Run Integration Tests**: `npm run integrated:test`
2. **Start Trading Bot**: `npm run integrated:start:test`
3. **Monitor Dashboard**: Access the web interface at `http://localhost:3000`
4. **Configure Strategies**: Set up your trading strategies in the dashboard

---

## 📚 Additional Resources

- [Alpaca API Documentation](https://alpaca.markets/docs/)
- [Paper Trading Guide](https://alpaca.markets/docs/trading/paper-trading/)
- [Market Data API](https://alpaca.markets/docs/market-data/)
- [Trading API Reference](https://alpaca.markets/docs/trading/orders/)

---

## 💡 Tips for Success

1. **Start with paper trading** - Always test strategies with virtual money first
2. **Monitor logs** - Check console output for any connection issues  
3. **Test during market hours** - Some features work better when markets are open
4. **Use small quantities** - Even in paper trading, practice with realistic position sizes
5. **Keep credentials secure** - Never share your API keys with anyone

---

## ✅ Verification Checklist

- [ ] Created Alpaca account
- [ ] Accessed paper trading dashboard
- [ ] Generated API keys
- [ ] Updated `.env.local` file with real credentials
- [ ] Ran connection test successfully
- [ ] Verified account information displays correctly
- [ ] Can place and cancel test orders
- [ ] Integration tests pass

Once all items are checked, your Alpaca paper trading setup is complete! 🎉