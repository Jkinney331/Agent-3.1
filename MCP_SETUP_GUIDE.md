# 🚀 MCP (Model Context Protocol) Integration Setup Guide

## ✅ **What We've Accomplished**

Your AI Trading Bot now has **complete MCP integration** with working data sources! Here's what's installed:

### **📦 Installed Packages**
- `@modelcontextprotocol/sdk` - MCP framework
- `axios` - HTTP client for API calls
- `ws` - WebSocket support
- `ccxt` - Crypto exchange integration
- `node-fetch` - Fetch API for Node.js

### **🏗️ MCP Server Architecture**

#### **1. Crypto Data Server (`lib/mcp/crypto-server.js`)**
- **API**: CoinGecko with your API key `CG-aQhKqxLWkcvpJdBi5gHKfQtB`
- **Features**:
  - ✅ Real-time crypto prices
  - ✅ Trending coins analysis
  - ✅ Fear & Greed Index
  - ✅ Global market data
  - ✅ Top gainers/losers
- **Status**: Ready to use

#### **2. Alpha Vantage Server (`lib/mcp/alpha-vantage-server.js`)**
- **API**: Alpha Vantage with your API key `8PQA774S43BSMFME`
- **Features**:
  - ✅ Stock quotes (AAPL, GOOGL, etc.)
  - ✅ Crypto daily/intraday data
  - ✅ Forex rates
  - ✅ Market sentiment analysis
  - ✅ Economic indicators
- **Status**: Ready to use

#### **3. Free Analytics Server (`lib/mcp/free-crypto-analytics-server.js`)**
- **APIs**: Multiple free sources (no keys required)
- **Features**:
  - ✅ CoinCap market data
  - ✅ Binance public API (24hr ticker, order book)
  - ✅ CryptoPanic news
  - ✅ Blockchain statistics
  - ✅ Bitcoin mempool data
  - ✅ DeFi metrics
- **Status**: Ready to use

### **📋 Configuration Files**
- ✅ `mcp-config.json` - Complete server configuration
- ✅ `lib/mcp/crypto-api-client.ts` - TypeScript client for Next.js
- ✅ `app/api/crypto/route.ts` - Crypto API endpoints
- ✅ `app/api/alpha-vantage/route.ts` - Financial API endpoints

## 🧪 **Testing Your MCP Integration**

### **Method 1: Direct API Testing**

Test your crypto APIs directly:

```bash
# Test Bitcoin price
curl "http://localhost:3000/api/crypto?action=price&symbol=bitcoin"

# Test trending coins
curl "http://localhost:3000/api/crypto?action=trending"

# Test fear & greed index
curl "http://localhost:3000/api/crypto?action=fear-greed"

# Test stock quote
curl "http://localhost:3000/api/alpha-vantage?action=stock-quote&symbol=AAPL"
```

### **Method 2: Browser Testing**

Visit these URLs in your browser:
- http://localhost:3000/api/crypto?action=trending
- http://localhost:3000/api/crypto?action=fear-greed  
- http://localhost:3000/api/crypto?action=gainers&limit=5

### **Method 3: MCP Test Dashboard**

Navigate to: http://localhost:3000/mcp-test

## 🎯 **Available API Endpoints**

### **Crypto API (`/api/crypto`)**
| Action | Parameters | Description |
|--------|------------|-------------|
| `price` | `symbol` | Get crypto price (e.g., bitcoin, ethereum) |
| `trending` | - | Get trending cryptocurrencies |
| `fear-greed` | - | Get Fear & Greed Index |
| `global` | - | Get global market statistics |
| `gainers` | `limit` (optional) | Get top gaining cryptos |
| `losers` | `limit` (optional) | Get top losing cryptos |
| `news` | `currencies` (optional) | Get crypto news |
| `binance-ticker` | `symbol` (optional) | Get Binance 24hr ticker |
| `orderbook` | `symbol`, `limit` | Get Binance order book |

### **Alpha Vantage API (`/api/alpha-vantage`)**
| Action | Parameters | Description |
|--------|------------|-------------|
| `stock-quote` | `symbol` | Get stock quote (e.g., AAPL) |
| `sentiment` | `tickers` (optional) | Get market sentiment |

## 🔧 **Next Steps: Integration with Your Trading Dashboard**

### **1. Update Dashboard Components**

Add real data to your dashboard:

```typescript
// In your dashboard components
import { cryptoAPI } from '@/lib/mcp/crypto-api-client';

// Get real-time Bitcoin price
const btcPrice = await cryptoAPI.getCryptoPrice('bitcoin');

// Get fear & greed index for market sentiment
const fearGreed = await cryptoAPI.getFearGreedIndex();

// Get trending coins for hot picks
const trending = await cryptoAPI.getTrendingCoins();
```

### **2. Enhance Market Overview Component**

```typescript
// components/dashboard/market-overview.tsx
const marketData = await fetch('/api/crypto?action=global');
const fearGreed = await fetch('/api/crypto?action=fear-greed');
const gainers = await fetch('/api/crypto?action=gainers&limit=5');
```

### **3. Add AI Analysis Data Sources**

```typescript
// For AI decision-making
const sentiment = await fetch('/api/alpha-vantage?action=sentiment&tickers=BTC,ETH');
const news = await fetch('/api/crypto?action=news&currencies=BTC,ETH,ADA');
const orderbook = await fetch('/api/crypto?action=orderbook&symbol=BTCUSDT');
```

## 🚀 **Advanced Features to Implement**

### **Phase 2: AI Trading Engine Integration**

1. **Risk Management Engine**
   - Real-time portfolio monitoring
   - Position sizing calculations
   - Stop-loss automation

2. **Signal Generation**
   - Technical analysis indicators
   - Sentiment analysis
   - Cross-asset correlations

3. **News & Sentiment Integration**
   - Social media sentiment
   - News impact scoring
   - Market event detection

### **Phase 3: Advanced MCP Servers (Future)**

These require additional API keys (backlogged):
- 🔒 **Coinbase Advanced Trade** (KYC required)
- 🔒 **Alpaca Trading** (KYC required) 
- 🔒 **TradingView Indicators** (Premium)
- 🔒 **On-chain Analytics** (Dune, Glassnode)

## 💡 **Usage Examples**

### **Real-time Price Integration**

```typescript
// Update your trading chart with real prices
useEffect(() => {
  const updatePrices = async () => {
    const btc = await cryptoAPI.getCryptoPrice('bitcoin');
    const eth = await cryptoAPI.getCryptoPrice('ethereum');
    
    // Update your chart state
    setChartData(prevData => ({
      ...prevData,
      btc: btc.price,
      eth: eth.price
    }));
  };
  
  const interval = setInterval(updatePrices, 30000); // Every 30 seconds
  return () => clearInterval(interval);
}, []);
```

### **Market Sentiment Dashboard**

```typescript
// Add to your AI Analysis component
const [marketSentiment, setMarketSentiment] = useState();

useEffect(() => {
  const fetchSentiment = async () => {
    const [fearGreed, news, sentiment] = await Promise.all([
      fetch('/api/crypto?action=fear-greed'),
      fetch('/api/crypto?action=news&currencies=BTC,ETH'),
      fetch('/api/alpha-vantage?action=sentiment&tickers=BTC-USD,ETH-USD')
    ]);
    
    setMarketSentiment({
      fearGreed: await fearGreed.json(),
      news: await news.json(),
      sentiment: await sentiment.json()
    });
  };
  
  fetchSentiment();
}, []);
```

## ⚡ **Performance & Rate Limits**

### **API Rate Limits**
- **CoinGecko**: 30 calls/minute (with your API key)
- **Alpha Vantage**: 25 calls/minute (with your API key)
- **Binance Public**: 1200 requests/minute
- **CryptoPanic**: 200 calls/hour (free tier)

### **Optimization Tips**
- Cache API responses for 30-60 seconds
- Use WebSocket connections for real-time data
- Implement retry logic with exponential backoff
- Batch multiple symbol requests when possible

## 🔐 **Security Notes**

- ✅ API keys are properly configured in MCP servers
- ✅ No sensitive keys exposed in frontend code
- ✅ All API calls go through your backend routes
- ⚠️ Consider environment variables for production

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Module not found" errors**
   ```bash
   npm install @modelcontextprotocol/sdk axios ws ccxt node-fetch
   ```

2. **MCP servers not starting**
   ```bash
   chmod +x lib/mcp/*.js
   node lib/mcp/crypto-server.js  # Test directly
   ```

3. **API rate limits**
   - Implement caching
   - Add delays between requests
   - Use multiple data sources

### **Debug Commands**

```bash
# Test MCP server directly
node lib/mcp/crypto-server.js

# Check API responses
curl -v "http://localhost:3000/api/crypto?action=trending"

# Monitor server logs
npm run dev  # Watch for console outputs
```

## 🎉 **Success! Your MCP Integration is Complete**

You now have:
- ✅ **3 working MCP servers** with your API keys
- ✅ **Real-time crypto data** from CoinGecko
- ✅ **Financial market data** from Alpha Vantage  
- ✅ **Free analytics** from multiple sources
- ✅ **Next.js API routes** ready for frontend integration
- ✅ **TypeScript client** for easy usage

**Ready to integrate into your trading dashboard!** 🚀

---

*Next: Start integrating these APIs into your existing dashboard components for real-time data visualization and AI-powered trading decisions.* 