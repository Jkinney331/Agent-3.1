# 🗄️ **Supabase Integration Setup Guide**

## 🎯 **Overview**

This guide will help you connect your AI Crypto Trading Bot to Supabase for real data persistence. Currently, the system is using mock data, which is why portfolio numbers aren't updating in real-time.

## ✅ **What's Already Set Up**

- ✅ Supabase CLI installed (v2.31.8)
- ✅ MCP Supabase server created (`lib/mcp/supabase-server.js`)
- ✅ MCP configuration updated
- ✅ Database schema ready (`database/schema.sql`)

## 🚀 **Step-by-Step Setup Process**

### **Step 1: Create Supabase Project**

1. **Go to Supabase Dashboard**
   ```bash
   # Open Supabase in browser
   open https://supabase.com/dashboard
   ```

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `ai-trading-bot`
   - Set database password (save this!)
   - Choose region closest to you
   - Click "Create new project"

### **Step 2: Get Your Supabase Credentials**

1. **Project Settings**
   - Go to Project Settings → API
   - Copy your **Project URL** (looks like: `https://xyz.supabase.co`)
   - Copy your **anon public key** (starts with `eyJ...`)

2. **Service Role Key** (for admin operations)
   - In the same API settings
   - Copy your **service_role key** (also starts with `eyJ...`)

### **Step 3: Update Environment Variables**

Update your `.env.local` file with real Supabase credentials:

```bash
# Replace placeholder values with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **Step 4: Set Up Database Schema**

1. **Run the schema setup**
   ```bash
   # Option A: Use the setup script
   node scripts/setup-database-direct.js
   
   # Option B: Use Supabase CLI
   supabase db push
   ```

2. **Verify tables created**
   - Go to Supabase Dashboard → Table Editor
   - You should see: `portfolios`, `trades`, `positions`, `ai_analyses`, `market_data`

### **Step 5: Test the Connection**

1. **Restart your development server**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Test the API endpoints**
   ```bash
   # Test portfolio data
   curl "http://localhost:3000/api/trading/enhanced-paper-trading?action=balance"
   
   # Test trade execution
   curl "http://localhost:3000/api/trading/enhanced-paper-trading?action=execute&symbol=BTCUSD&side=buy&quantity=0.001"
   ```

## 🔧 **Database Schema Overview**

The system uses these main tables:

### **`portfolios`**
- `user_id` (primary key)
- `balance` (current cash balance)
- `total_pnl` (total profit/loss)
- `created_at`, `updated_at`

### **`trades`**
- `id` (auto-increment)
- `user_id`, `symbol`, `side` (buy/sell)
- `quantity`, `price`, `total_amount`
- `status`, `created_at`

### **`positions`**
- `id` (auto-increment)
- `user_id`, `symbol`
- `quantity`, `entry_price`, `current_price`
- `unrealized_pnl`, `status` (open/closed)

### **`ai_analyses`**
- `id` (auto-increment)
- `symbol`, `analysis_type`
- `confidence_score`, `recommendation`
- `analysis_data` (JSON), `created_at`

### **`market_data`**
- `id` (auto-increment)
- `symbol`, `timeframe`
- `open`, `high`, `low`, `close`, `volume`
- `timestamp`

## 🧪 **Testing Real Data Flow**

### **Test 1: Portfolio Initialization**
```bash
curl "http://localhost:3000/api/trading/enhanced-paper-trading?action=balance"
```
**Expected**: Returns real balance from database

### **Test 2: Trade Execution**
```bash
curl "http://localhost:3000/api/trading/enhanced-paper-trading?action=execute&symbol=BTCUSD&side=buy&quantity=0.001"
```
**Expected**: Creates trade record, updates portfolio balance

### **Test 3: Position Tracking**
```bash
curl "http://localhost:3000/api/trading/enhanced-paper-trading?action=positions"
```
**Expected**: Shows real positions with live P&L calculations

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"Invalid URL" Error**
   - Check your `NEXT_PUBLIC_SUPABASE_URL` format
   - Should be: `https://project-id.supabase.co`

2. **"Connection failed" Error**
   - Verify your API keys are correct
   - Check if your Supabase project is active

3. **"Table doesn't exist" Error**
   - Run the database schema setup
   - Check Supabase Dashboard → Table Editor

4. **"Permission denied" Error**
   - Use service role key for admin operations
   - Check Row Level Security (RLS) policies

### **Debug Commands**

```bash
# Check Supabase connection
curl "http://localhost:3000/api/test-portfolio"

# View database logs
supabase logs

# Reset database (if needed)
supabase db reset
```

## 🎯 **Expected Results After Setup**

✅ **Real-time Portfolio Updates**: Balance and P&L change with each trade  
✅ **Persistent Trade History**: All trades saved to database  
✅ **Live Position Tracking**: Positions update with market prices  
✅ **AI Analysis Storage**: All AI decisions logged  
✅ **Market Data Persistence**: Historical data stored  

## 🚀 **Next Steps After Setup**

1. **Monitor the Dashboard**: Watch real numbers update
2. **Test AI Trading**: Let the bot make real decisions
3. **Review Analytics**: Check trading performance
4. **Scale Up**: Add more sophisticated strategies

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase Dashboard logs
3. Test individual API endpoints
4. Verify environment variables

---

**Ready to proceed?** Once you have your Supabase credentials, we can implement this step by step! 