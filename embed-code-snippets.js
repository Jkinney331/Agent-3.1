// 🚀 Agent 3.1 - n8n API Integration Code Snippets
// Ready-to-embed JavaScript code for your trading dashboard

/**
 * Execute Trade via n8n Workflow
 * Triggers the Advanced AI Trading Engine workflow
 */
async function query(data) {
    const response = await fetch(
        "https://your-n8n-host/webhook/api-integration",
        {
            headers: {
                Authorization: "Bearer ai-trading-bot-secure-2025-integration",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}

// Usage Examples:

// 1. Execute a trade
query({
    "action": "execute_trade",
    "payload": {
        "symbol": "BTCUSD", 
        "side": "buy",
        "quantity": 0.01
    }
}).then((response) => {
    console.log(response);
});

// 2. Check portfolio status
query({
    "action": "check_portfolio",
    "payload": {
        "userId": "user123"
    }
}).then((response) => {
    console.log('Portfolio:', response);
});

// 3. Send notification
query({
    "action": "send_notification",
    "payload": {
        "message": "Trade executed successfully",
        "channels": ["telegram"],
        "priority": "high"
    }
}).then((response) => {
    console.log('Notification sent:', response);
});

// 4. Get market data
query({
    "action": "get_market_data",
    "payload": {
        "symbols": ["BTCUSD", "ETHUSD"],
        "timeframe": "1h"
    }
}).then((response) => {
    console.log('Market data:', response);
});

/**
 * Agent 3.1 Client Class
 * Easy-to-use wrapper for all n8n workflow integrations
 */
class Agent31Client {
    constructor(apiKey, baseUrl = "https://your-n8n-host") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    
    async request(action, payload) {
        const response = await fetch(`${this.baseUrl}/webhook/api-integration`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, payload })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Trading Operations
    async executeTrade(symbol, side, quantity) {
        return this.request('execute_trade', { symbol, side, quantity });
    }
    
    async getMarketData(symbols, timeframe = '1h') {
        return this.request('get_market_data', { symbols, timeframe });
    }
    
    // Portfolio Management  
    async getPortfolio(userId = 'default') {
        return this.request('check_portfolio', { userId });
    }
    
    async getRiskAssessment(userId = 'default') {
        return this.request('assess_risk', { userId });
    }
    
    async getPerformance(timeframe = '1d') {
        return this.request('get_performance', { timeframe });
    }
    
    // Notifications
    async sendAlert(message, priority = 'normal', channels = ['telegram']) {
        return this.request('send_notification', { 
            message, 
            channels, 
            priority 
        });
    }
    
    async createAlert(condition, message, channels = ['telegram']) {
        return this.request('create_alert', {
            condition,
            message,
            channels
        });
    }
    
    // System Health
    async getSystemStatus() {
        return this.request('health_check', {});
    }
    
    async getWorkflowStatus() {
        return this.request('workflow_status', {});
    }
}

// Ready-to-use client instance
const agent31 = new Agent31Client('ai-trading-bot-secure-2025-integration');

// Usage examples with the client:
/*
// Execute trades
await agent31.executeTrade('BTCUSD', 'buy', 0.01);
await agent31.executeTrade('ETHUSD', 'sell', 0.5);

// Get portfolio data
const portfolio = await agent31.getPortfolio();
console.log('Current portfolio:', portfolio);

// Get market data
const marketData = await agent31.getMarketData(['BTCUSD', 'ETHUSD', 'ADAUSD']);
console.log('Market prices:', marketData);

// Send alerts
await agent31.sendAlert('BTC price above $100k!', 'high');

// Check system health
const status = await agent31.getSystemStatus();
console.log('System status:', status);
*/

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { query, Agent31Client, agent31 };
}

// Export for ES6 modules
if (typeof exports !== 'undefined') {
    exports.query = query;
    exports.Agent31Client = Agent31Client;
    exports.agent31 = agent31;
}