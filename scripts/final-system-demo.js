#!/usr/bin/env node

/**
 * Final System Demonstration Script
 * 
 * This script demonstrates the complete AI + Telegram bot system working end-to-end.
 * Shows the entire pipeline from market analysis → AI insights → report generation → Telegram delivery.
 * 
 * Complete System Features Demonstrated:
 * ✅ Dynamic Trailing Stops with AI-driven adjustments
 * ✅ Pattern Recognition and Market Analysis
 * ✅ AI Learning and Adaptation System
 * ✅ Comprehensive Report Generation
 * ✅ Telegram Bot Integration and Formatting
 * ✅ Risk Management and Performance Tracking
 * ✅ Real-time Market Simulation
 * ✅ User Interaction Simulation
 * 
 * Usage: node scripts/final-system-demo.js [--interactive] [--scenario=mixed] [--duration=300]
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');

// System Component Simulators
class DynamicTrailingStopsSimulator extends EventEmitter {
  constructor() {
    super();
    this.activeStops = new Map();
    this.isRunning = false;
    this.updateInterval = null;
    this.config = {
      baseTrailingPercentage: 2.0,
      updateFrequency: 5000, // 5 seconds for demo
      aiConfidenceThresholds: { high: 80, medium: 60, low: 40 },
      confidenceMultipliers: { high: 0.8, medium: 1.0, low: 1.3 }
    };
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🎯 Dynamic Trailing Stops System: STARTED');
    
    this.updateInterval = setInterval(() => {
      this.updateAllStops();
    }, this.config.updateFrequency);
    
    this.emit('started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('🎯 Dynamic Trailing Stops System: STOPPED');
    this.emit('stopped');
  }

  addPosition(position) {
    const aiConfidence = 60 + Math.random() * 30;
    const marketRegime = ['BULL', 'BEAR', 'RANGE', 'VOLATILE'][Math.floor(Math.random() * 4)];
    
    const stopData = {
      positionId: position.id,
      symbol: position.symbol,
      side: position.side,
      currentPrice: position.currentPrice,
      stopPrice: position.stopLoss,
      originalStopPrice: position.stopLoss,
      aiConfidence,
      marketRegime,
      updateCount: 0,
      lastUpdated: new Date(),
      performanceMetrics: {
        profitProtected: 0,
        lossesReduced: 0,
        adjustmentCount: 0
      }
    };
    
    this.activeStops.set(position.id, stopData);
    console.log(`📊 Added position ${position.symbol} to dynamic stops (AI Confidence: ${aiConfidence.toFixed(0)}%)`);
    
    this.emit('positionAdded', { positionId: position.id, symbol: position.symbol });
  }

  removePosition(positionId) {
    const stopData = this.activeStops.get(positionId);
    if (stopData) {
      this.activeStops.delete(positionId);
      console.log(`🗑️ Removed position ${stopData.symbol} from dynamic stops`);
      this.emit('positionRemoved', { positionId, finalMetrics: stopData.performanceMetrics });
    }
  }

  updateAllStops() {
    if (this.activeStops.size === 0) return;

    this.activeStops.forEach((stopData, positionId) => {
      // Simulate price movement
      const priceChange = (Math.random() - 0.5) * 0.02; // ±1% movement
      stopData.currentPrice *= (1 + priceChange);
      
      // Update AI confidence based on market conditions
      const confidenceChange = (Math.random() - 0.5) * 10;
      stopData.aiConfidence = Math.max(30, Math.min(95, stopData.aiConfidence + confidenceChange));
      
      // Calculate new stop based on AI confidence
      const oldStop = stopData.stopPrice;
      const baseDistance = stopData.currentPrice * (this.config.baseTrailingPercentage / 100);
      
      // Adjust based on AI confidence
      let multiplier = this.config.confidenceMultipliers.medium;
      if (stopData.aiConfidence >= this.config.aiConfidenceThresholds.high) {
        multiplier = this.config.confidenceMultipliers.high;
      } else if (stopData.aiConfidence <= this.config.aiConfidenceThresholds.low) {
        multiplier = this.config.confidenceMultipliers.low;
      }
      
      const adjustedDistance = baseDistance * multiplier;
      const newStop = stopData.side === 'LONG' 
        ? stopData.currentPrice - adjustedDistance
        : stopData.currentPrice + adjustedDistance;
      
      // Only update if it's an improvement (LONG: higher stop, SHORT: lower stop)
      const shouldUpdate = stopData.side === 'LONG' 
        ? newStop > stopData.stopPrice 
        : newStop < stopData.stopPrice;
      
      if (shouldUpdate && Math.abs(newStop - oldStop) > 0.01) {
        stopData.stopPrice = newStop;
        stopData.updateCount++;
        stopData.lastUpdated = new Date();
        
        // Update performance metrics
        if (stopData.side === 'LONG' && newStop > oldStop) {
          stopData.performanceMetrics.profitProtected += (newStop - oldStop) * 0.1; // Simulate position size
        }
        stopData.performanceMetrics.adjustmentCount++;
        
        const update = {
          positionId,
          symbol: stopData.symbol,
          oldStop,
          newStop,
          aiConfidence: stopData.aiConfidence,
          reason: 'AI confidence adjustment',
          timestamp: new Date()
        };
        
        console.log(`📊 Stop updated: ${stopData.symbol} ${oldStop.toFixed(2)} → ${newStop.toFixed(2)} (AI: ${stopData.aiConfidence.toFixed(0)}%)`);
        this.emit('stopUpdated', update);
      }
    });
  }

  getStats() {
    const positions = Array.from(this.activeStops.values());
    const totalAdjustments = positions.reduce((sum, pos) => sum + pos.updateCount, 0);
    const avgConfidence = positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos.aiConfidence, 0) / positions.length 
      : 0;
    const totalProtected = positions.reduce((sum, pos) => sum + pos.performanceMetrics.profitProtected, 0);
    
    return {
      activePositions: positions.length,
      totalAdjustments,
      averageConfidence: avgConfidence,
      totalProtectedProfits: totalProtected,
      systemStatus: this.isRunning ? 'ACTIVE' : 'STOPPED'
    };
  }
}

class AILearningSystemSimulator extends EventEmitter {
  constructor() {
    super();
    this.patterns = [];
    this.insights = [];
    this.learningMetrics = {
      dataPointsProcessed: 0,
      patternsRecognized: 0,
      adaptationsMade: 0,
      accuracyScore: 75.5
    };
  }

  async analyzeMarket(marketData) {
    console.log('🧠 AI Learning System: Analyzing market patterns...');
    
    // Simulate pattern recognition
    await this.sleep(1000); // Processing delay
    
    const symbols = Array.from(marketData.keys());
    const detectedPatterns = [];
    
    symbols.forEach(symbol => {
      const data = marketData.get(symbol);
      if (!data || data.length < 10) return;
      
      const recentPrices = data.slice(-10).map(c => c.close);
      const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
      
      // Pattern recognition logic
      if (Math.abs(priceChange) > 0.03) {
        const pattern = {
          type: priceChange > 0 ? 'BULLISH_MOMENTUM' : 'BEARISH_MOMENTUM',
          symbol,
          confidence: 0.7 + Math.random() * 0.25,
          strength: Math.abs(priceChange) * 10,
          timeframe: '1h',
          expectedDuration: 4 + Math.random() * 8,
          targetPrice: recentPrices[recentPrices.length - 1] * (1 + priceChange * 0.6),
          successProbability: 0.65 + Math.random() * 0.25
        };
        
        detectedPatterns.push(pattern);
        this.learningMetrics.patternsRecognized++;
      }
      
      // Volume analysis
      const avgVolume = data.slice(-5).reduce((sum, c) => sum + c.volume, 0) / 5;
      const currentVolume = data[data.length - 1].volume;
      
      if (currentVolume > avgVolume * 1.5) {
        detectedPatterns.push({
          type: 'VOLUME_BREAKOUT',
          symbol,
          confidence: 0.6 + Math.random() * 0.3,
          description: 'Unusual volume spike detected',
          implications: 'Potential significant price movement incoming'
        });
      }
    });
    
    this.patterns = detectedPatterns;
    this.learningMetrics.dataPointsProcessed += symbols.length * 50; // Simulate data points
    
    console.log(`🧠 AI Analysis Complete: ${detectedPatterns.length} patterns detected`);
    this.emit('patternsDetected', detectedPatterns);
    
    return detectedPatterns;
  }

  async generateInsights(patterns, performanceData) {
    console.log('💡 AI Learning System: Generating actionable insights...');
    
    await this.sleep(800);
    
    const insights = [];
    
    // Performance-based insights
    if (performanceData.winRate > 0.65) {
      insights.push({
        id: 'performance_strength',
        type: 'PERFORMANCE_OPTIMIZATION',
        title: 'Strong Performance Detected',
        description: `Win rate of ${(performanceData.winRate * 100).toFixed(1)}% indicates optimal strategy execution`,
        impact: 18.5,
        confidence: 87,
        priority: 'HIGH',
        actionable: true,
        recommendations: [
          'Consider increasing position sizes by 10-15%',
          'Maintain current risk parameters',
          'Monitor for potential overconfidence bias'
        ],
        timeframe: 'immediate'
      });
    }
    
    // Pattern-based insights
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    if (highConfidencePatterns.length > 2) {
      insights.push({
        id: 'pattern_opportunity',
        type: 'MARKET_OPPORTUNITY',
        title: 'High-Confidence Pattern Cluster',
        description: `${highConfidencePatterns.length} high-confidence patterns aligned - strong opportunity window`,
        impact: 25.3,
        confidence: 82,
        priority: 'HIGH',
        actionable: true,
        recommendations: [
          'Increase trading frequency in next 4-6 hours',
          'Focus on momentum-based strategies',
          'Set tighter profit targets for quick gains'
        ],
        timeframe: '4-6 hours'
      });
    }
    
    // Risk management insights
    if (Math.random() > 0.4) {
      insights.push({
        id: 'risk_adjustment',
        type: 'RISK_MANAGEMENT',
        title: 'Dynamic Risk Adjustment Opportunity',
        description: 'Current market volatility suggests optimal stop-loss parameter adjustment',
        impact: -8.2,
        confidence: 74,
        priority: 'MEDIUM',
        actionable: true,
        recommendations: [
          'Widen stop-losses by 0.5% in volatile conditions',
          'Implement time-based exit strategy',
          'Monitor correlation changes between assets'
        ],
        timeframe: 'next trading session'
      });
    }
    
    // AI learning insights
    insights.push({
      id: 'learning_adaptation',
      type: 'AI_EVOLUTION',
      title: 'Algorithm Learning Progress',
      description: 'AI system has successfully adapted to recent market regime changes',
      impact: 12.1,
      confidence: 79,
      priority: 'MEDIUM',
      actionable: false,
      recommendations: [
        'Continue monitoring adaptation effectiveness',
        'Validate pattern recognition accuracy'
      ],
      timeframe: 'ongoing'
    });
    
    this.insights = insights;
    this.learningMetrics.adaptationsMade += insights.filter(i => i.actionable).length;
    this.learningMetrics.accuracyScore += (Math.random() - 0.5) * 2; // Simulate learning
    
    console.log(`💡 Insights Generated: ${insights.length} actionable insights created`);
    this.emit('insightsGenerated', insights);
    
    return insights;
  }

  async adaptStrategy(insights) {
    console.log('🔄 AI Learning System: Adapting strategy based on insights...');
    
    const adaptations = [];
    
    insights.forEach(insight => {
      if (insight.actionable && insight.priority === 'HIGH') {
        const adaptation = {
          type: insight.type,
          parameter: this.determineParameterAdjustment(insight),
          oldValue: this.getCurrentParameter(insight.type),
          newValue: this.calculateNewParameter(insight),
          reasoning: insight.description,
          expectedImpact: insight.impact,
          timestamp: new Date()
        };
        
        adaptations.push(adaptation);
        this.learningMetrics.adaptationsMade++;
      }
    });
    
    if (adaptations.length > 0) {
      console.log(`🔄 Strategy Adaptations: ${adaptations.length} parameters adjusted`);
      adaptations.forEach(adapt => {
        console.log(`   • ${adapt.parameter}: ${adapt.oldValue} → ${adapt.newValue}`);
      });
    }
    
    this.emit('strategyAdapted', adaptations);
    return adaptations;
  }

  getLearningMetrics() {
    return {
      ...this.learningMetrics,
      patternsActive: this.patterns.length,
      insightsGenerated: this.insights.length,
      systemUptime: Date.now()
    };
  }

  // Helper methods
  determineParameterAdjustment(insight) {
    const parameterMap = {
      'PERFORMANCE_OPTIMIZATION': 'position_size_multiplier',
      'MARKET_OPPORTUNITY': 'trading_frequency',
      'RISK_MANAGEMENT': 'stop_loss_distance'
    };
    return parameterMap[insight.type] || 'unknown_parameter';
  }

  getCurrentParameter(type) {
    const defaults = {
      'PERFORMANCE_OPTIMIZATION': 1.0,
      'MARKET_OPPORTUNITY': 1.0,
      'RISK_MANAGEMENT': 2.0
    };
    return defaults[type] || 1.0;
  }

  calculateNewParameter(insight) {
    const current = this.getCurrentParameter(insight.type);
    const adjustment = insight.impact > 0 ? 1.1 : 0.9;
    return +(current * adjustment).toFixed(2);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class TelegramBotSimulator extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.messageQueue = [];
    this.isConnected = false;
    this.setupMockUsers();
  }

  setupMockUsers() {
    const mockUsers = [
      {
        id: 123456789,
        username: 'crypto_trader_alice',
        firstName: 'Alice',
        isAuthorized: true,
        preferences: {
          notifications: true,
          reportFrequency: 'daily',
          riskTolerance: 'medium',
          timezone: 'America/New_York'
        },
        subscriptions: ['daily_reports', 'alerts', 'insights']
      },
      {
        id: 987654321,
        username: 'bitcoin_bob',
        firstName: 'Bob',
        isAuthorized: true,
        preferences: {
          notifications: true,
          reportFrequency: 'hourly',
          riskTolerance: 'high',
          timezone: 'Europe/London'
        },
        subscriptions: ['daily_reports', 'real_time_updates']
      }
    ];

    mockUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  connect() {
    this.isConnected = true;
    console.log('📱 Telegram Bot: Connected and ready to receive commands');
    this.emit('connected');
  }

  disconnect() {
    this.isConnected = false;
    console.log('📱 Telegram Bot: Disconnected');
    this.emit('disconnected');
  }

  async sendDailyReport(report, telegramFormat) {
    if (!this.isConnected) {
      console.log('❌ Telegram Bot: Not connected - cannot send report');
      return;
    }

    console.log('📱 Telegram Bot: Sending daily reports to subscribers...');

    const reportChunks = this.splitReportIntoMessages(telegramFormat);
    
    for (const [userId, user] of this.users) {
      if (user.subscriptions.includes('daily_reports')) {
        console.log(`📤 Sending report to ${user.firstName} (@${user.username})`);
        
        for (let i = 0; i < reportChunks.length; i++) {
          const chunk = reportChunks[i];
          await this.simulateMessageSend(userId, chunk, i + 1, reportChunks.length);
          await this.sleep(500); // Simulate rate limiting
        }
        
        // Simulate user interaction
        if (Math.random() > 0.6) {
          await this.sleep(2000);
          this.simulateUserResponse(userId, user);
        }
      }
    }

    this.emit('reportSent', { recipientCount: this.users.size, chunkCount: reportChunks.length });
  }

  async sendAlert(alert) {
    if (!this.isConnected) return;

    console.log(`🚨 Telegram Bot: Broadcasting ${alert.severity} alert`);
    
    const alertMessage = this.formatAlert(alert);
    
    for (const [userId, user] of this.users) {
      if (user.subscriptions.includes('alerts')) {
        await this.simulateMessageSend(userId, alertMessage);
        await this.sleep(200);
      }
    }
  }

  async sendInsight(insight) {
    if (!this.isConnected) return;

    console.log(`💡 Telegram Bot: Sharing AI insight - ${insight.title}`);
    
    const insightMessage = this.formatInsight(insight);
    
    for (const [userId, user] of this.users) {
      if (user.subscriptions.includes('insights') && insight.priority === 'HIGH') {
        await this.simulateMessageSend(userId, insightMessage);
        await this.sleep(300);
      }
    }
  }

  splitReportIntoMessages(telegramFormat) {
    const maxLength = 4096;
    const chunks = [];
    
    // Summary chunk
    chunks.push({
      type: 'summary',
      content: telegramFormat.summary,
      parseMode: 'Markdown'
    });
    
    // Metrics chunk
    if (telegramFormat.keyMetrics.length <= maxLength) {
      chunks.push({
        type: 'metrics',
        content: telegramFormat.keyMetrics,
        parseMode: 'HTML'
      });
    } else {
      // Split large metrics if needed
      const parts = this.splitLongContent(telegramFormat.keyMetrics, maxLength);
      parts.forEach((part, index) => {
        chunks.push({
          type: `metrics_part_${index + 1}`,
          content: part,
          parseMode: 'HTML'
        });
      });
    }
    
    // Other sections
    ['insights', 'dynamicStops', 'recommendations', 'aiAnalysis'].forEach(section => {
      if (telegramFormat[section]) {
        chunks.push({
          type: section,
          content: telegramFormat[section],
          parseMode: 'HTML'
        });
      }
    });
    
    return chunks;
  }

  splitLongContent(content, maxLength) {
    if (content.length <= maxLength) return [content];
    
    const parts = [];
    const lines = content.split('\n');
    let currentPart = '';
    
    for (const line of lines) {
      if ((currentPart + line + '\n').length > maxLength) {
        if (currentPart) {
          parts.push(currentPart.trim());
          currentPart = '';
        }
      }
      currentPart += line + '\n';
    }
    
    if (currentPart) {
      parts.push(currentPart.trim());
    }
    
    return parts;
  }

  async simulateMessageSend(userId, message, chunkIndex = 1, totalChunks = 1) {
    const user = this.users.get(userId);
    const chunkInfo = totalChunks > 1 ? ` (${chunkIndex}/${totalChunks})` : '';
    
    console.log(`   → Message sent to ${user.firstName}${chunkInfo}: ${message.content ? message.content.substring(0, 50) + '...' : message.substring(0, 50) + '...'}`);
    
    this.messageQueue.push({
      userId,
      message,
      timestamp: new Date(),
      delivered: true
    });

    // Simulate small delay for message delivery
    await this.sleep(100 + Math.random() * 200);
  }

  simulateUserResponse(userId, user) {
    const responses = [
      '/status',
      '/balance', 
      'Thanks for the update!',
      'What about BTC?',
      '/settings',
      '👍',
      'Any recommendations?'
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    console.log(`   ← ${user.firstName} responded: "${response}"`);
    
    // Simulate bot response to user commands
    if (response.startsWith('/')) {
      setTimeout(() => {
        this.handleCommand(userId, response);
      }, 1000 + Math.random() * 2000);
    }
  }

  handleCommand(userId, command) {
    const user = this.users.get(userId);
    let botResponse = '';
    
    switch (command) {
      case '/status':
        botResponse = `🤖 System Status: ACTIVE\n📊 Monitoring 4 positions\n🎯 Dynamic stops: ENABLED\n💡 AI confidence: 87%`;
        break;
      case '/balance':
        botResponse = `💰 Portfolio Balance: $51,247.83\n📈 Today's P&L: +$247.83 (+0.48%)\n🎯 Win rate: 73.2%`;
        break;
      case '/settings':
        botResponse = `⚙️ Your Settings:\n• Notifications: ✅ Enabled\n• Reports: Daily\n• Risk tolerance: ${user.preferences.riskTolerance}\n• Timezone: ${user.preferences.timezone}`;
        break;
      default:
        botResponse = `🤖 Command received: ${command}`;
    }
    
    console.log(`   → Bot responded to ${user.firstName}: "${botResponse.substring(0, 50)}..."`);
  }

  formatAlert(alert) {
    const severityEmoji = {
      'info': 'ℹ️',
      'warning': '⚠️', 
      'critical': '🚨',
      'emergency': '🚨'
    };
    
    return {
      content: `${severityEmoji[alert.severity]} **${alert.title}**\n\n${alert.message}`,
      parseMode: 'Markdown'
    };
  }

  formatInsight(insight) {
    const priorityEmoji = insight.priority === 'HIGH' ? '🔥' : '💡';
    
    return {
      content: `${priorityEmoji} **${insight.title}**\n\n${insight.description}\n\n*Impact: ${insight.impact > 0 ? '+' : ''}${insight.impact.toFixed(1)}% | Confidence: ${insight.confidence}%*`,
      parseMode: 'Markdown'
    };
  }

  getStats() {
    return {
      connectedUsers: this.users.size,
      messagesSent: this.messageQueue.length,
      isConnected: this.isConnected,
      lastActivity: this.messageQueue.length > 0 ? this.messageQueue[this.messageQueue.length - 1].timestamp : null
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class MarketDataSimulator extends EventEmitter {
  constructor() {
    super();
    this.symbols = ['BTC/USD', 'ETH/USD', 'ADA/USD', 'SOL/USD'];
    this.marketData = new Map();
    this.isRunning = false;
    this.updateInterval = null;
    this.scenario = 'mixed';
    
    this.initializeMarketData();
  }

  initializeMarketData() {
    this.symbols.forEach(symbol => {
      const basePrice = this.getBasePrice(symbol);
      const initialData = this.generateInitialCandles(basePrice, 50);
      this.marketData.set(symbol, initialData);
    });
  }

  setScenario(scenario) {
    this.scenario = scenario;
    console.log(`📊 Market Simulator: Scenario set to ${scenario}`);
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('📊 Market Data Simulator: Started generating live data');
    
    this.updateInterval = setInterval(() => {
      this.updateMarketData();
    }, 3000); // Update every 3 seconds
    
    this.emit('started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('📊 Market Data Simulator: Stopped');
    this.emit('stopped');
  }

  updateMarketData() {
    const updates = new Map();
    
    this.symbols.forEach(symbol => {
      const currentData = this.marketData.get(symbol);
      const lastCandle = currentData[currentData.length - 1];
      
      const newCandle = this.generateNextCandle(lastCandle, this.scenario);
      currentData.push(newCandle);
      
      // Keep only last 100 candles
      if (currentData.length > 100) {
        currentData.shift();
      }
      
      updates.set(symbol, newCandle);
    });
    
    this.emit('marketUpdate', updates);
    
    // Log occasional price updates
    if (Math.random() > 0.7) {
      const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
      const price = updates.get(randomSymbol).close;
      console.log(`📊 ${randomSymbol}: $${price.toFixed(2)}`);
    }
  }

  generateNextCandle(lastCandle, scenario) {
    const open = lastCandle.close;
    let volatility = 0.005; // 0.5%
    let trend = 0;
    
    // Adjust based on scenario
    switch (scenario) {
      case 'bullMarket':
        trend = 0.0003;
        volatility = 0.008;
        break;
      case 'bearMarket':
        trend = -0.0003;
        volatility = 0.012;
        break;
      case 'sideways':
        trend = 0;
        volatility = 0.003;
        break;
      case 'volatile':
        trend = 0;
        volatility = 0.02;
        break;
      default: // mixed
        trend = (Math.random() - 0.5) * 0.0006;
        volatility = 0.005 + Math.random() * 0.01;
    }
    
    const priceChange = (Math.random() - 0.5) * 2 * volatility * open + trend * open;
    const close = Math.max(0.01, open + priceChange);
    
    const high = Math.max(open, close) + Math.random() * volatility * open * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * open * 0.5;
    
    const volume = 800000 + Math.random() * 1500000;
    
    return {
      timestamp: new Date(),
      open,
      high: Math.max(high, Math.max(open, close)),
      low: Math.min(low, Math.min(open, close)),
      close,
      volume
    };
  }

  generateInitialCandles(basePrice, count) {
    const candles = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < count; i++) {
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 0.02 * currentPrice;
      const close = Math.max(0.01, open + change);
      
      const high = Math.max(open, close) + Math.random() * 0.005 * currentPrice;
      const low = Math.min(open, close) - Math.random() * 0.005 * currentPrice;
      
      candles.push({
        timestamp: new Date(Date.now() - (count - i) * 3600000), // Hourly candles
        open,
        high,
        low,
        close,
        volume: 500000 + Math.random() * 1000000
      });
      
      currentPrice = close;
    }
    
    return candles;
  }

  getBasePrice(symbol) {
    const basePrices = {
      'BTC/USD': 50000,
      'ETH/USD': 3000,
      'ADA/USD': 0.5,
      'SOL/USD': 100
    };
    return basePrices[symbol] || 1000;
  }

  getCurrentPrices() {
    const prices = new Map();
    this.symbols.forEach(symbol => {
      const data = this.marketData.get(symbol);
      prices.set(symbol, data[data.length - 1].close);
    });
    return prices;
  }

  getMarketData() {
    return new Map(this.marketData);
  }
}

// Performance Monitor
class SystemPerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      eventsProcessed: 0,
      messagesDelivered: 0,
      patternsDetected: 0,
      stopAdjustments: 0,
      systemErrors: 0,
      averageResponseTime: 0
    };
    this.responseTimeData = [];
  }

  recordEvent(eventType, responseTime = null) {
    this.metrics.eventsProcessed++;
    
    switch (eventType) {
      case 'messageDelivered':
        this.metrics.messagesDelivered++;
        break;
      case 'patternDetected':
        this.metrics.patternsDetected++;
        break;
      case 'stopAdjusted':
        this.metrics.stopAdjustments++;
        break;
      case 'error':
        this.metrics.systemErrors++;
        break;
    }
    
    if (responseTime) {
      this.responseTimeData.push(responseTime);
      if (this.responseTimeData.length > 100) {
        this.responseTimeData.shift();
      }
      this.metrics.averageResponseTime = this.responseTimeData.reduce((a, b) => a + b, 0) / this.responseTimeData.length;
    }
  }

  getSystemStats() {
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      ...this.metrics,
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      eventsPerSecond: this.metrics.eventsProcessed / (uptime / 1000),
      systemHealth: this.calculateSystemHealth()
    };
  }

  calculateSystemHealth() {
    const errorRate = this.metrics.systemErrors / Math.max(1, this.metrics.eventsProcessed);
    const avgResponseTime = this.metrics.averageResponseTime;
    
    if (errorRate > 0.05 || avgResponseTime > 2000) return 'DEGRADED';
    if (errorRate > 0.01 || avgResponseTime > 1000) return 'FAIR';
    return 'EXCELLENT';
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// Main Demonstration Orchestrator
class SystemDemonstrator {
  constructor() {
    this.components = {
      marketSimulator: new MarketDataSimulator(),
      trailingStops: new DynamicTrailingStopsSimulator(),
      aiLearning: new AILearningSystemSimulator(),
      telegramBot: new TelegramBotSimulator(),
      performanceMonitor: new SystemPerformanceMonitor()
    };
    
    this.positions = [];
    this.isRunning = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Market data updates trigger AI analysis
    this.components.marketSimulator.on('marketUpdate', async (updates) => {
      this.components.performanceMonitor.recordEvent('marketUpdate');
      
      // Occasionally trigger AI analysis
      if (Math.random() > 0.7) {
        const patterns = await this.components.aiLearning.analyzeMarket(this.components.marketSimulator.getMarketData());
        this.components.performanceMonitor.recordEvent('patternDetected');
        
        // Generate insights based on patterns
        const mockPerformance = { winRate: 0.68 + Math.random() * 0.15 };
        const insights = await this.components.aiLearning.generateInsights(patterns, mockPerformance);
        
        // Send high-priority insights via Telegram
        insights.forEach(insight => {
          if (insight.priority === 'HIGH') {
            this.components.telegramBot.sendInsight(insight);
            this.components.performanceMonitor.recordEvent('messageDelivered');
          }
        });
      }
      
      // Update position prices
      this.updatePositionPrices(updates);
    });

    // Trailing stops events
    this.components.trailingStops.on('stopUpdated', (update) => {
      console.log(`🎯 Stop Update: ${update.symbol} → $${update.newStop.toFixed(2)} (${update.reason})`);
      this.components.performanceMonitor.recordEvent('stopAdjusted');
      
      // Occasionally send stop update alerts
      if (Math.random() > 0.8) {
        const alert = {
          severity: 'info',
          title: 'Stop Loss Updated',
          message: `${update.symbol} stop moved to $${update.newStop.toFixed(2)} based on AI analysis (${update.aiConfidence.toFixed(0)}% confidence)`
        };
        this.components.telegramBot.sendAlert(alert);
        this.components.performanceMonitor.recordEvent('messageDelivered');
      }
    });

    // AI learning adaptations
    this.components.aiLearning.on('strategyAdapted', (adaptations) => {
      console.log(`🔄 Strategy Adapted: ${adaptations.length} parameters adjusted`);
      
      if (adaptations.length > 0) {
        const alert = {
          severity: 'info',
          title: 'AI Strategy Update',
          message: `AI system adapted ${adaptations.length} trading parameters based on market analysis`
        };
        this.components.telegramBot.sendAlert(alert);
        this.components.performanceMonitor.recordEvent('messageDelivered');
      }
    });
  }

  async start(options = {}) {
    const { scenario = 'mixed', duration = 60, interactive = false } = options;
    
    console.log('🚀 STARTING COMPLETE AI TRADING SYSTEM DEMONSTRATION');
    console.log('=' .repeat(80));
    console.log(`Scenario: ${scenario} | Duration: ${duration}s | Interactive: ${interactive}`);
    console.log('=' .repeat(80));
    
    this.isRunning = true;
    
    // Set market scenario
    this.components.marketSimulator.setScenario(scenario);
    
    // Start all components
    console.log('\n📋 INITIALIZING SYSTEM COMPONENTS...');
    this.components.marketSimulator.start();
    this.components.trailingStops.start();
    this.components.telegramBot.connect();
    
    // Create some initial positions
    await this.createInitialPositions();
    
    // Generate and send initial report
    await this.generateAndSendDailyReport();
    
    // Start demonstration loop
    console.log('\n🔄 SYSTEM DEMONSTRATION RUNNING...\n');
    const endTime = Date.now() + (duration * 1000);
    
    while (this.isRunning && Date.now() < endTime) {
      await this.runDemoCycle();
      
      if (interactive) {
        console.log('\n⏸️  Press Enter to continue or Ctrl+C to stop...');
        await this.waitForInput();
      } else {
        await this.sleep(5000); // 5-second cycles
      }
    }
    
    await this.stop();
  }

  async createInitialPositions() {
    console.log('💼 Creating initial positions...');
    
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
    const currentPrices = this.components.marketSimulator.getCurrentPrices();
    
    symbols.forEach((symbol, index) => {
      const currentPrice = currentPrices.get(symbol);
      const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
      
      const position = {
        id: `pos_demo_${Date.now()}_${index}`,
        symbol,
        side,
        quantity: 0.1 + Math.random() * 0.4,
        entryPrice: currentPrice * (0.98 + Math.random() * 0.04),
        currentPrice,
        stopLoss: side === 'LONG' 
          ? currentPrice * 0.97 
          : currentPrice * 1.03,
        takeProfit: side === 'LONG'
          ? currentPrice * 1.05
          : currentPrice * 0.95,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      position.unrealizedPnL = (position.currentPrice - position.entryPrice) * position.quantity * (side === 'LONG' ? 1 : -1);
      position.unrealizedPnLPercentage = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100 * (side === 'LONG' ? 1 : -1);
      
      this.positions.push(position);
      this.components.trailingStops.addPosition(position);
      
      console.log(`   • ${symbol} ${side} position created at $${currentPrice.toFixed(2)}`);
    });
  }

  async generateAndSendDailyReport() {
    console.log('📊 Generating and sending daily report...');
    
    try {
      // Use the mock report generator from the other script
      const { execSync } = require('child_process');
      const reportPath = path.join(__dirname, 'generate-test-report.js');
      
      // Execute the report generator and capture output
      const reportOutput = execSync(`node "${reportPath}" --format=telegram`, { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      // Extract the Telegram report data (this is simplified for demo)
      const mockTelegramReport = this.createMockTelegramReport();
      
      // Send the report via Telegram bot
      await this.components.telegramBot.sendDailyReport({}, mockTelegramReport);
      
      console.log('✅ Daily report sent successfully');
      
    } catch (error) {
      console.log('⚠️ Report generation error (using fallback):', error.message);
      
      // Fallback: create simple mock report
      const fallbackReport = this.createMockTelegramReport();
      await this.components.telegramBot.sendDailyReport({}, fallbackReport);
    }
  }

  createMockTelegramReport() {
    const stats = this.getSystemStats();
    
    return {
      summary: `🤖 *AI Trading Bot Daily Report*\n\n` +
               `📊 *Performance Grade: A-*\n` +
               `📈 Return: *+2.34%* ($1,247.83)\n` +
               `🎯 Win Rate: *72.1%*\n` +
               `📊 Trades: *28*\n` +
               `⚡ Sharpe: *1.87*\n` +
               `💰 Balance: *$52,247.83*\n\n` +
               `✨ *Highlights:*\n• ${stats.patternsDetected} patterns detected\n• Dynamic stops made ${stats.stopAdjustments} adjustments\n• AI system operating at 94% efficiency`,

      keyMetrics: `<b>📊 Key Performance Metrics</b>\n\n` +
                  `<b>Trading Performance:</b>\n` +
                  `• Win Rate: 72.1%\n• Profit Factor: 2.31\n• Average Win: $89.50\n• Average Loss: $38.70\n\n` +
                  `<b>AI Performance:</b>\n` +
                  `• Pattern Recognition: 87.4%\n• Signal Generation: Sub-second\n• Adaptation Rate: 91.2%\n• Learning Efficiency: 88.5%`,

      insights: `<b>💡 Key AI Insights</b>\n\n` +
                `🔥 <b>Strong Momentum Detected</b>\n   Multiple bullish patterns aligned across major pairs\n   Impact: +15.2% | Confidence: 87%\n\n` +
                `⚡ <b>Volatility Window Opening</b>\n   AI predicts increased volatility in next 4-6 hours\n   Impact: +12.8% | Confidence: 82%`,

      dynamicStops: `<b>🎯 Dynamic Trailing Stops</b>\n\n` +
                    `<b>System Status:</b> ACTIVE\n<b>Active Stops:</b> ${stats.activePositions}\n` +
                    `<b>Total Adjustments:</b> ${stats.stopAdjustments}\n<b>Avg Confidence:</b> 84%\n` +
                    `<b>Protected Profits:</b> $1,284.50\n\n<b>Active Stop Levels:</b>\n` +
                    `• <b>BTC/USD:</b> $49,250 (2.1%)\n  Current: $50,247 | AI: 87%\n` +
                    `• <b>ETH/USD:</b> $2,940 (1.8%)\n  Current: $2,994 | AI: 79%`,

      recommendations: `<b>🎯 AI Recommendations</b>\n\n` +
                       `🟡 <b>Position Sizing:</b> Consider increasing position sizes by 10%\n   Strong performance metrics support higher allocation\n\n` +
                       `🟢 <b>Risk Management:</b> Current parameters optimal for market conditions\n   Continue monitoring dynamic stop performance`,

      aiAnalysis: `<b>🧠 AI System Analysis</b>\n\n` +
                  `<b>Model Performance:</b>\n• Accuracy: 87.4%\n• Precision: 82.1%\n• F1 Score: 81.0%\n\n` +
                  `<b>Pattern Recognition:</b>\n• Patterns Analyzed: ${stats.patternsDetected}\n• High Confidence: 12\n• Prediction Accuracy: 74.5%\n\n` +
                  `<b>System Health:</b>\n• Status: ${stats.systemHealth}\n• Uptime: ${stats.uptimeFormatted}\n• Processing Speed: Sub-second`
    };
  }

  async runDemoCycle() {
    // Simulate various system activities
    const activities = [
      () => this.simulatePatternDetection(),
      () => this.simulateUserInteraction(), 
      () => this.simulateMarketEvent(),
      () => this.displaySystemStats()
    ];
    
    // Run a random activity
    const activity = activities[Math.floor(Math.random() * activities.length)];
    await activity();
  }

  async simulatePatternDetection() {
    console.log('🔍 AI System: Scanning for new patterns...');
    
    const patterns = await this.components.aiLearning.analyzeMarket(this.components.marketSimulator.getMarketData());
    
    if (patterns.length > 0) {
      const pattern = patterns[0];
      console.log(`   • ${pattern.type} detected on ${pattern.symbol} (${(pattern.confidence * 100).toFixed(0)}% confidence)`);
      
      if (pattern.confidence > 0.8) {
        const insight = {
          id: 'pattern_' + Date.now(),
          title: `High-Confidence ${pattern.type.replace('_', ' ')}`,
          description: `Strong ${pattern.type.toLowerCase()} pattern detected on ${pattern.symbol}`,
          impact: 15.0 + Math.random() * 10,
          confidence: Math.round(pattern.confidence * 100),
          priority: 'HIGH',
          actionable: true
        };
        
        await this.components.telegramBot.sendInsight(insight);
      }
    }
  }

  async simulateUserInteraction() {
    const commands = ['/status', '/balance', '/help', 'Any updates?'];
    const command = commands[Math.floor(Math.random() * commands.length)];
    
    console.log(`👤 User Activity: Simulating command "${command}"`);
    
    // Simulate bot response delay
    await this.sleep(500 + Math.random() * 1000);
    
    let response = '';
    switch (command) {
      case '/status':
        const stats = this.getSystemStats();
        response = `System running smoothly - ${stats.activePositions} positions monitored`;
        break;
      case '/balance':
        response = 'Portfolio: $52,247.83 (+2.34% today)';
        break;
      case '/help':
        response = 'Available commands: /status, /balance, /report, /settings';
        break;
      default:
        response = 'AI system detected 3 new patterns in the last hour';
    }
    
    console.log(`🤖 Bot Response: ${response}`);
  }

  async simulateMarketEvent() {
    const events = [
      'High volume spike detected on BTC/USD',
      'Correlation breakdown between major pairs',
      'Unusual options flow detected',
      'News sentiment shift detected'
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    console.log(`📈 Market Event: ${event}`);
    
    if (Math.random() > 0.6) {
      const alert = {
        severity: 'warning',
        title: 'Market Alert',
        message: event
      };
      
      await this.components.telegramBot.sendAlert(alert);
    }
  }

  updatePositionPrices(priceUpdates) {
    this.positions.forEach(position => {
      if (priceUpdates.has(position.symbol)) {
        const newPrice = priceUpdates.get(position.symbol).close;
        position.currentPrice = newPrice;
        
        // Recalculate P&L
        position.unrealizedPnL = (position.currentPrice - position.entryPrice) * position.quantity * (position.side === 'LONG' ? 1 : -1);
        position.unrealizedPnLPercentage = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100 * (position.side === 'LONG' ? 1 : -1);
        position.updatedAt = new Date();
      }
    });
  }

  displaySystemStats() {
    const stats = this.getSystemStats();
    
    console.log('\n📊 SYSTEM STATUS UPDATE:');
    console.log(`   • Uptime: ${stats.uptimeFormatted}`);
    console.log(`   • Active Positions: ${stats.activePositions}`);
    console.log(`   • Patterns Detected: ${stats.patternsDetected}`);
    console.log(`   • Stop Adjustments: ${stats.stopAdjustments}`);
    console.log(`   • Messages Delivered: ${stats.messagesDelivered}`);
    console.log(`   • System Health: ${stats.systemHealth}`);
    console.log(`   • Events/sec: ${stats.eventsPerSecond.toFixed(2)}\n`);
  }

  getSystemStats() {
    const perfStats = this.components.performanceMonitor.getSystemStats();
    const trailingStats = this.components.trailingStops.getStats();
    const learningStats = this.components.aiLearning.getLearningMetrics();
    const telegramStats = this.components.telegramBot.getStats();
    
    return {
      ...perfStats,
      activePositions: trailingStats.activePositions,
      stopAdjustments: trailingStats.totalAdjustments,
      patternsDetected: learningStats.patternsRecognized,
      messagesDelivered: telegramStats.messagesSent,
      connectedUsers: telegramStats.connectedUsers
    };
  }

  async stop() {
    console.log('\n🛑 STOPPING SYSTEM DEMONSTRATION...');
    
    this.isRunning = false;
    
    // Stop all components
    this.components.marketSimulator.stop();
    this.components.trailingStops.stop();
    this.components.telegramBot.disconnect();
    
    // Display final statistics
    console.log('\n📈 DEMONSTRATION COMPLETE - FINAL STATISTICS:');
    console.log('=' .repeat(80));
    
    const finalStats = this.getSystemStats();
    console.log(`✅ Total Runtime: ${finalStats.uptimeFormatted}`);
    console.log(`✅ Events Processed: ${finalStats.eventsProcessed}`);
    console.log(`✅ Patterns Detected: ${finalStats.patternsDetected}`);
    console.log(`✅ Stop Adjustments: ${finalStats.stopAdjustments}`);
    console.log(`✅ Messages Delivered: ${finalStats.messagesDelivered}`);
    console.log(`✅ Connected Users: ${finalStats.connectedUsers}`);
    console.log(`✅ System Health: ${finalStats.systemHealth}`);
    console.log(`✅ Average Response Time: ${finalStats.averageResponseTime.toFixed(0)}ms`);
    console.log(`✅ Processing Rate: ${finalStats.eventsPerSecond.toFixed(2)} events/sec`);
    
    if (finalStats.systemErrors > 0) {
      console.log(`⚠️ System Errors: ${finalStats.systemErrors}`);
    }
    
    console.log('\n🎉 COMPLETE AI TRADING SYSTEM DEMONSTRATION FINISHED SUCCESSFULLY!');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✅ Dynamic Trailing Stops with AI-driven adjustments');
    console.log('  ✅ Real-time Pattern Recognition and Market Analysis');
    console.log('  ✅ AI Learning and Strategy Adaptation');
    console.log('  ✅ Comprehensive Daily Report Generation');
    console.log('  ✅ Telegram Bot Integration with User Interaction');
    console.log('  ✅ Risk Management and Performance Monitoring');
    console.log('  ✅ End-to-End Pipeline: Market Data → AI Analysis → Telegram Delivery');
    
    console.log('\n💡 What a user would see:');
    console.log('  📱 Daily reports delivered via Telegram with AI insights');
    console.log('  🎯 Real-time alerts when stops are adjusted by AI');
    console.log('  💡 High-priority trading insights sent immediately');
    console.log('  📊 Interactive commands to check status and balance');
    console.log('  🔔 Market event notifications and warnings');
    
    // Save demonstration results to file
    try {
      const resultsDir = path.join(__dirname, '..', 'logs');
      await fs.mkdir(resultsDir, { recursive: true });
      
      const results = {
        timestamp: new Date().toISOString(),
        duration: finalStats.uptime,
        statistics: finalStats,
        positions: this.positions.map(p => ({
          symbol: p.symbol,
          side: p.side,
          pnl: p.unrealizedPnL,
          pnlPercentage: p.unrealizedPnLPercentage
        })),
        demonstration: 'complete'
      };
      
      const filename = `system-demo-results-${Date.now()}.json`;
      const filepath = path.join(resultsDir, filename);
      await fs.writeFile(filepath, JSON.stringify(results, null, 2));
      
      console.log(`\n💾 Demonstration results saved to: ${filepath}`);
    } catch (error) {
      console.log(`⚠️ Could not save results: ${error.message}`);
    }
  }

  async waitForInput() {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Help display function
function displayHelp() {
  console.log(`
🤖 AI Trading Bot Complete System Demonstration

Usage: node scripts/final-system-demo.js [OPTIONS]

Options:
  --interactive       Run in interactive mode (press Enter to advance)
  --scenario=TYPE     Market scenario to simulate:
                     • mixed       - Mixed market conditions (default)
                     • bullMarket  - Strong upward trend
                     • bearMarket  - Downward pressure
                     • sideways    - Range-bound trading  
                     • volatile    - High volatility chaos

  --duration=SECONDS  How long to run demo (default: 60 seconds)

Examples:
  node scripts/final-system-demo.js
  node scripts/final-system-demo.js --interactive --scenario=bullMarket
  node scripts/final-system-demo.js --duration=120 --scenario=volatile

Features Demonstrated:
  🎯 Dynamic Trailing Stops - AI-driven stop adjustments in real-time
  🧠 AI Learning System - Pattern recognition and strategy adaptation  
  📊 Report Generation - Complete daily reports with AI insights
  📱 Telegram Integration - Formatted message delivery and user interaction
  🔄 Real-time Pipeline - Market data → AI analysis → Telegram delivery
  📈 Performance Monitoring - System health and performance tracking
  💼 Position Management - Multi-asset portfolio monitoring
  🚨 Alert System - Real-time notifications for important events

What Users Experience:
  📱 Receive daily AI-generated reports via Telegram
  🎯 Get notified when AI adjusts stop-losses for better protection
  💡 Receive high-priority trading insights immediately
  📊 Use interactive commands (/status, /balance, etc.)
  🔔 Get alerts for significant market events
  ⚙️ Personalized settings and preferences

The demonstration simulates the complete end-to-end system without requiring
real API keys or live market connections.
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    process.exit(0);
  }
  
  // Parse arguments
  const interactive = args.includes('--interactive');
  const scenarioArg = args.find(arg => arg.startsWith('--scenario='));
  const durationArg = args.find(arg => arg.startsWith('--duration='));
  
  const scenario = scenarioArg ? scenarioArg.split('=')[1] : 'mixed';
  const duration = durationArg ? parseInt(durationArg.split('=')[1]) : 60;
  
  // Validate arguments
  const validScenarios = ['mixed', 'bullMarket', 'bearMarket', 'sideways', 'volatile'];
  if (!validScenarios.includes(scenario)) {
    console.error(`❌ Invalid scenario: ${scenario}. Valid options: ${validScenarios.join(', ')}`);
    process.exit(1);
  }
  
  if (duration < 10 || duration > 600) {
    console.error('❌ Duration must be between 10 and 600 seconds');
    process.exit(1);
  }
  
  // Create and start demonstration
  const demonstrator = new SystemDemonstrator();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Received interrupt signal, shutting down gracefully...');
    await demonstrator.stop();
    process.exit(0);
  });
  
  try {
    await demonstrator.start({
      scenario,
      duration,
      interactive
    });
  } catch (error) {
    console.error('❌ Demonstration error:', error);
    await demonstrator.stop();
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SystemDemonstrator };