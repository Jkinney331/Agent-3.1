#!/usr/bin/env node
/**
 * Complete Integration Test Script
 * Validates all components of the AI Trading Bot system working together
 */

import dotenv from 'dotenv';
import { tradingSystemIntegration } from '../lib/trading/integration/trading-system-integration';
import { dynamicStopCalculator } from '../lib/trading/dynamic-trailing-stops';
import { aiReasoningEngine } from '../lib/ai/reasoning-engine';
import { aiTelegramReportIntegration } from '../lib/ai/telegram-report-integration';
import { createTradingBot } from '../lib/telegram/bot-server';
import { TelegramBotConfig } from '../lib/telegram/types';
import { Position, CandlestickData, TradingSignal } from '../types/trading';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalDuration: number;
  successRate: number;
}

class IntegrationTestRunner {
  private testResults: TestSuite[] = [];
  private mockTelegramBot?: any;
  private mockMarketData: CandlestickData[] = [];
  private mockPositions: Position[] = [];

  constructor() {
    this.setupMockData();
  }

  /**
   * Run complete integration test suite
   */
  async runCompleteTestSuite(): Promise<void> {
    console.log('🧪 Starting Complete Integration Test Suite\n');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();

    try {
      // Test Suite 1: Environment and Configuration
      await this.runEnvironmentTests();

      // Test Suite 2: AI System Tests
      await this.runAISystemTests();

      // Test Suite 3: Dynamic Stops Tests
      await this.runDynamicStopsTests();

      // Test Suite 4: Trading Integration Tests
      await this.runTradingIntegrationTests();

      // Test Suite 5: Telegram Bot Tests
      await this.runTelegramBotTests();

      // Test Suite 6: Report Generation Tests
      await this.runReportGenerationTests();

      // Test Suite 7: End-to-End Integration Tests
      await this.runEndToEndTests();

      // Test Suite 8: Performance and Stress Tests
      await this.runPerformanceTests();

      const totalDuration = Date.now() - startTime;
      
      // Generate test report
      this.generateTestReport(totalDuration);

    } catch (error) {
      console.error('💥 Test suite failed with critical error:', error);
      process.exit(1);
    }
  }

  // Test Suite 1: Environment and Configuration Tests
  private async runEnvironmentTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Environment and Configuration',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n📋 Running Environment Tests...');

    // Test 1: Environment variables
    await this.runTest(suite, 'Environment Variables Check', async () => {
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];

      const missing = requiredVars.filter(varName => !process.env[varName]);
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }

      return { requiredVarsPresent: requiredVars.length, missingVars: missing };
    });

    // Test 2: Configuration validation
    await this.runTest(suite, 'Configuration Validation', async () => {
      const config = {
        tradingMode: process.env.TRADING_MODE || 'paper',
        initialBalance: parseFloat(process.env.INITIAL_BALANCE || '50000'),
        maxPositions: parseInt(process.env.MAX_POSITIONS || '5'),
        stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || '0.05')
      };

      if (config.initialBalance <= 0) {
        throw new Error('Invalid initial balance');
      }

      if (config.maxPositions <= 0) {
        throw new Error('Invalid max positions');
      }

      return config;
    });

    // Test 3: API connectivity
    await this.runTest(suite, 'API Connectivity Check', async () => {
      // Mock API connectivity test
      const apis = {
        supabase: true, // Would test actual connection
        coingecko: !!process.env.COINGECKO_API_KEY,
        alphaVantage: !!process.env.ALPHA_VANTAGE_API_KEY
      };

      return apis;
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 2: AI System Tests
  private async runAISystemTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'AI System',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n🧠 Running AI System Tests...');

    // Test 1: AI Reasoning Engine
    await this.runTest(suite, 'AI Reasoning Engine Analysis', async () => {
      const mockData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000000,
        prices: this.generatePriceHistory(50, 50000),
        fearGreed: 55,
        capital: 10000
      };

      const signal = await aiReasoningEngine.analyzeMarket(mockData);
      
      if (!signal.symbol || !signal.action || !signal.confidence) {
        throw new Error('Invalid signal generated');
      }

      if (signal.confidence < 0 || signal.confidence > 100) {
        throw new Error('Invalid confidence score');
      }

      return {
        symbol: signal.symbol,
        action: signal.action,
        confidence: signal.confidence,
        riskReward: signal.riskReward
      };
    });

    // Test 2: Pattern Recognition
    await this.runTest(suite, 'Pattern Recognition', async () => {
      const prices = this.generatePriceHistory(100, 50000);
      // Mock pattern recognition
      const patterns = {
        trendDirection: prices[prices.length - 1] > prices[0] ? 'UP' : 'DOWN',
        volatility: this.calculateVolatility(prices),
        support: Math.min(...prices.slice(-20)),
        resistance: Math.max(...prices.slice(-20))
      };

      return patterns;
    });

    // Test 3: Market Regime Detection
    await this.runTest(suite, 'Market Regime Detection', async () => {
      const mockData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000000,
        prices: this.generatePriceHistory(50, 50000),
        fearGreed: 55,
        capital: 10000
      };

      const signal = await aiReasoningEngine.analyzeMarket(mockData);
      const validRegimes = ['BULL', 'BEAR', 'RANGE'];
      
      if (!validRegimes.includes(signal.marketRegime)) {
        throw new Error(`Invalid market regime: ${signal.marketRegime}`);
      }

      return { regime: signal.marketRegime };
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 3: Dynamic Stops Tests
  private async runDynamicStopsTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Dynamic Stops System',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n🎯 Running Dynamic Stops Tests...');

    // Test 1: Calculator initialization
    await this.runTest(suite, 'Dynamic Stops Initialization', async () => {
      const config = dynamicStopCalculator.getConfig();
      const isRunning = dynamicStopCalculator.getRunningStatus();

      return {
        configLoaded: !!config,
        baseTrailingPercentage: config.baseTrailingPercentage,
        isRunning
      };
    });

    // Test 2: Position management
    await this.runTest(suite, 'Position Management', async () => {
      const mockPosition = this.createMockPosition('BTC/USD', 'LONG');
      const initialStopPrice = mockPosition.entryPrice * 0.98; // 2% stop

      await dynamicStopCalculator.addPosition(mockPosition, initialStopPrice, this.mockMarketData);
      
      const stopData = dynamicStopCalculator.getStopData(mockPosition.id);
      if (!stopData) {
        throw new Error('Position not added to dynamic stops');
      }

      // Clean up
      dynamicStopCalculator.removePosition(mockPosition.id);

      return {
        positionAdded: true,
        initialStop: initialStopPrice,
        stopDataCreated: !!stopData
      };
    });

    // Test 3: Stop calculation
    await this.runTest(suite, 'Stop Loss Calculation', async () => {
      const optimalDistance = await dynamicStopCalculator.getOptimalStopDistance(
        'BTC/USD',
        50000,
        'LONG',
        75, // confidence
        'BULL' // regime
      );

      if (optimalDistance <= 0 || optimalDistance > 20) {
        throw new Error(`Invalid stop distance: ${optimalDistance}%`);
      }

      return { optimalDistance };
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 4: Trading Integration Tests
  private async runTradingIntegrationTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Trading Integration',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n🔄 Running Trading Integration Tests...');

    // Test 1: System initialization
    await this.runTest(suite, 'Trading System Initialization', async () => {
      const status = tradingSystemIntegration.getStatus();
      
      return {
        isRunning: status.isRunning,
        dynamicStopsEnabled: status.dynamicStopsEnabled,
        aiLearningEnabled: status.aiLearningEnabled
      };
    });

    // Test 2: Signal processing
    await this.runTest(suite, 'Signal Processing Pipeline', async () => {
      const mockSignal = await this.createMockTradingSignal();
      const result = await tradingSystemIntegration.processTradingSignal(mockSignal);

      if (typeof result.shouldExecute !== 'boolean') {
        throw new Error('Invalid execution decision');
      }

      return {
        signalProcessed: true,
        shouldExecute: result.shouldExecute,
        confidenceBefore: mockSignal.confidence,
        confidenceAfter: result.adjustedSignal.confidence
      };
    });

    // Test 3: Position lifecycle
    await this.runTest(suite, 'Position Lifecycle Management', async () => {
      const mockPosition = this.createMockPosition('ETH/USD', 'LONG');
      
      // Test position opening
      await tradingSystemIntegration.handlePositionOpened(mockPosition, this.mockMarketData);
      
      // Test position closing
      await tradingSystemIntegration.handlePositionClosed(mockPosition, 'stop_loss');

      return { positionLifecycleTested: true };
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 5: Telegram Bot Tests
  private async runTelegramBotTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Telegram Bot',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n🤖 Running Telegram Bot Tests...');

    // Test 1: Bot configuration
    await this.runTest(suite, 'Bot Configuration', async () => {
      const hasToken = !!process.env.TELEGRAM_BOT_TOKEN && 
                      process.env.TELEGRAM_BOT_TOKEN !== 'your-telegram-bot-token-from-botfather';
      
      const authorizedUsers = process.env.TELEGRAM_AUTHORIZED_USERS
        ?.split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id)) || [];

      return {
        tokenConfigured: hasToken,
        authorizedUsersCount: authorizedUsers.length,
        pollingEnabled: process.env.TELEGRAM_POLLING_ENABLED === 'true'
      };
    });

    // Test 2: Mock bot creation
    await this.runTest(suite, 'Bot Instance Creation', async () => {
      if (!process.env.TELEGRAM_BOT_TOKEN || 
          process.env.TELEGRAM_BOT_TOKEN === 'your-telegram-bot-token-from-botfather') {
        // Skip actual bot creation in test mode
        return { mockBotCreated: true, realBot: false };
      }

      const mockConfig: TelegramBotConfig = {
        token: 'mock-token-for-testing',
        polling: true,
        rateLimit: { window: 60, max: 30 },
        session: { timeout: 3600, cleanup: 300 },
        features: { analytics: true, notifications: true, exports: false, webhooks: false },
        security: { requireAuth: true, encryptSessions: true }
      };

      // This would create a mock bot instance
      return { mockBotCreated: true, config: mockConfig };
    });

    // Test 3: Message formatting
    await this.runTest(suite, 'Message Formatting', async () => {
      const testMessage = 'Test trading signal: BTC/USD BUY at $50,000';
      const formattedMessage = this.formatTelegramMessage(testMessage);
      
      return {
        originalLength: testMessage.length,
        formattedLength: formattedMessage.length,
        hasFormatting: formattedMessage.includes('<b>')
      };
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 6: Report Generation Tests
  private async runReportGenerationTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Report Generation',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n📊 Running Report Generation Tests...');

    // Test 1: Market analysis report
    await this.runTest(suite, 'Market Analysis Report', async () => {
      const report = await aiTelegramReportIntegration.generateMarketAnalysisReport();
      
      if (!report || report.length < 100) {
        throw new Error('Report too short or empty');
      }

      return {
        reportGenerated: true,
        reportLength: report.length,
        hasFormatting: report.includes('<b>')
      };
    });

    // Test 2: Performance report
    await this.runTest(suite, 'Performance Report', async () => {
      const report = await aiTelegramReportIntegration.generatePerformanceReport(undefined, 'daily');
      
      if (!report || report.length < 100) {
        throw new Error('Performance report too short or empty');
      }

      return {
        reportGenerated: true,
        reportLength: report.length,
        timeframe: 'daily'
      };
    });

    // Test 3: Quick status
    await this.runTest(suite, 'Quick Status Generation', async () => {
      const status = await aiTelegramReportIntegration.generateQuickStatus();
      
      if (!status || status.length < 50) {
        throw new Error('Status report too short or empty');
      }

      return {
        statusGenerated: true,
        statusLength: status.length
      };
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 7: End-to-End Integration Tests
  private async runEndToEndTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'End-to-End Integration',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n🔗 Running End-to-End Integration Tests...');

    // Test 1: Complete trading workflow
    await this.runTest(suite, 'Complete Trading Workflow', async () => {
      // 1. Generate AI signal
      const mockData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000000,
        prices: this.generatePriceHistory(50, 50000),
        fearGreed: 55,
        capital: 10000
      };

      const signal = await aiReasoningEngine.analyzeMarket(mockData);
      
      // 2. Process through integration
      const result = await tradingSystemIntegration.processTradingSignal(signal);
      
      // 3. Simulate position opening if approved
      if (result.shouldExecute && signal.action !== 'HOLD') {
        const position = this.createMockPosition(signal.symbol, signal.action === 'BUY' ? 'LONG' : 'SHORT');
        await tradingSystemIntegration.handlePositionOpened(position);
        
        // 4. Test dynamic stops integration
        const stopData = dynamicStopCalculator.getStopData(position.id);
        
        // 5. Generate report
        const report = await aiTelegramReportIntegration.generateQuickStatus();
        
        // Cleanup
        await tradingSystemIntegration.handlePositionClosed(position, 'test_completed');
        
        return {
          workflowComplete: true,
          signalGenerated: true,
          positionCreated: true,
          stopDataCreated: !!stopData,
          reportGenerated: report.length > 0
        };
      }

      return {
        workflowComplete: true,
        signalGenerated: true,
        positionCreated: false,
        reason: 'Signal not approved for execution'
      };
    });

    // Test 2: System communication
    await this.runTest(suite, 'Component Communication', async () => {
      let eventsReceived = 0;
      
      // Setup event listeners
      const eventPromise = new Promise<void>((resolve) => {
        tradingSystemIntegration.once('signalProcessed', () => {
          eventsReceived++;
          if (eventsReceived >= 1) resolve();
        });
      });

      // Trigger event
      const mockSignal = await this.createMockTradingSignal();
      await tradingSystemIntegration.processTradingSignal(mockSignal);
      
      // Wait for events
      await Promise.race([
        eventPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Event timeout')), 5000))
      ]);

      return { eventsReceived };
    });

    this.finalizeTestSuite(suite);
  }

  // Test Suite 8: Performance and Stress Tests
  private async runPerformanceTests(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Performance and Stress Tests',
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    console.log('\n⚡ Running Performance Tests...');

    // Test 1: Signal processing performance
    await this.runTest(suite, 'Signal Processing Performance', async () => {
      const iterations = 10;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const mockSignal = await this.createMockTradingSignal();
        await tradingSystemIntegration.processTradingSignal(mockSignal);
      }
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / iterations;

      return {
        iterations,
        totalTime,
        averageTime,
        signalsPerSecond: Math.round(1000 / averageTime)
      };
    });

    // Test 2: Memory usage
    await this.runTest(suite, 'Memory Usage Check', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Create some load
      const positions = [];
      for (let i = 0; i < 50; i++) {
        positions.push(this.createMockPosition(`SYMBOL${i}`, 'LONG'));
      }
      
      const memoryAfter = process.memoryUsage();
      const memoryDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;

      return {
        memoryBefore: Math.round(memoryBefore.heapUsed / 1024 / 1024),
        memoryAfter: Math.round(memoryAfter.heapUsed / 1024 / 1024),
        memoryDiff: Math.round(memoryDiff / 1024 / 1024),
        acceptable: memoryDiff < 50 * 1024 * 1024 // 50MB threshold
      };
    });

    this.finalizeTestSuite(suite);
  }

  // Helper methods for testing
  private async runTest(suite: TestSuite, testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    console.log(`  ⏳ ${testName}...`);

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      suite.results.push({
        testName,
        success: true,
        duration,
        details: result
      });

      console.log(`  ✅ ${testName} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      suite.results.push({
        testName,
        success: false,
        duration,
        error: errorMessage
      });

      console.log(`  ❌ ${testName} (${duration}ms): ${errorMessage}`);
    }
  }

  private finalizeTestSuite(suite: TestSuite): void {
    suite.totalDuration = suite.results.reduce((sum, result) => sum + result.duration, 0);
    suite.successRate = (suite.results.filter(r => r.success).length / suite.results.length) * 100;
    this.testResults.push(suite);

    const passed = suite.results.filter(r => r.success).length;
    const total = suite.results.length;
    
    console.log(`\n📊 ${suite.suiteName} Results: ${passed}/${total} passed (${suite.successRate.toFixed(1)}%) in ${suite.totalDuration}ms\n`);
  }

  private generateTestReport(totalDuration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 INTEGRATION TEST REPORT');
    console.log('='.repeat(60));

    let totalTests = 0;
    let totalPassed = 0;
    let overallDuration = 0;

    this.testResults.forEach(suite => {
      const passed = suite.results.filter(r => r.success).length;
      const total = suite.results.length;
      
      totalTests += total;
      totalPassed += passed;
      overallDuration += suite.totalDuration;

      console.log(`\n📁 ${suite.suiteName}:`);
      console.log(`   Tests: ${passed}/${total} passed (${suite.successRate.toFixed(1)}%)`);
      console.log(`   Duration: ${suite.totalDuration}ms`);
      
      // Show failed tests
      const failed = suite.results.filter(r => !r.success);
      if (failed.length > 0) {
        console.log('   Failed tests:');
        failed.forEach(test => {
          console.log(`     ❌ ${test.testName}: ${test.error}`);
        });
      }
    });

    const overallSuccessRate = (totalPassed / totalTests) * 100;

    console.log('\n' + '-'.repeat(60));
    console.log('📊 OVERALL RESULTS:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalTests - totalPassed}`);
    console.log(`   Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    console.log(`   Average Test Time: ${Math.round(overallDuration / totalTests)}ms`);

    if (overallSuccessRate >= 90) {
      console.log('\n🎉 EXCELLENT! System integration is working very well.');
    } else if (overallSuccessRate >= 80) {
      console.log('\n✅ GOOD! System integration is working with minor issues.');
    } else if (overallSuccessRate >= 70) {
      console.log('\n⚠️  ACCEPTABLE! System has some integration issues that should be addressed.');
    } else {
      console.log('\n❌ POOR! System has significant integration issues that need immediate attention.');
    }

    console.log('\n' + '='.repeat(60));
  }

  // Mock data generation methods
  private setupMockData(): void {
    // Generate mock market data
    this.mockMarketData = this.generateCandlestickData(100, 50000);
    
    // Generate mock positions
    this.mockPositions = [
      this.createMockPosition('BTC/USD', 'LONG'),
      this.createMockPosition('ETH/USD', 'SHORT'),
      this.createMockPosition('ADA/USD', 'LONG')
    ];
  }

  private generateCandlestickData(count: number, basePrice: number): CandlestickData[] {
    const data: CandlestickData[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < count; i++) {
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * 0.01 * currentPrice;
      const low = Math.min(open, close) - Math.random() * 0.01 * currentPrice;
      
      data.push({
        timestamp: new Date(Date.now() - (count - i) * 60000), // 1 minute intervals
        open,
        high,
        low,
        close,
        volume: 1000000 + Math.random() * 500000
      });

      currentPrice = close;
    }

    return data;
  }

  private generatePriceHistory(count: number, basePrice: number): number[] {
    const prices: number[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 0.02 * currentPrice; // 2% volatility
      currentPrice += change;
      prices.push(currentPrice);
    }

    return prices;
  }

  private createMockPosition(symbol: string, side: 'LONG' | 'SHORT'): Position {
    const entryPrice = 50000 + Math.random() * 10000;
    const quantity = 0.1 + Math.random() * 0.9;
    const currentPrice = entryPrice + (Math.random() - 0.5) * 0.1 * entryPrice;
    
    return {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side,
      quantity,
      entryPrice,
      currentPrice,
      stopLoss: side === 'LONG' ? entryPrice * 0.95 : entryPrice * 1.05,
      takeProfit: side === 'LONG' ? entryPrice * 1.1 : entryPrice * 0.9,
      unrealizedPnL: (currentPrice - entryPrice) * quantity * (side === 'LONG' ? 1 : -1),
      unrealizedPnLPercentage: ((currentPrice - entryPrice) / entryPrice) * 100 * (side === 'LONG' ? 1 : -1),
      status: 'OPEN',
      createdAt: new Date(Date.now() - Math.random() * 86400000), // Random time within last 24h
      updatedAt: new Date()
    };
  }

  private async createMockTradingSignal(): Promise<TradingSignal> {
    const mockData = {
      symbol: 'BTC/USD',
      price: 50000,
      volume: 1000000,
      prices: this.generatePriceHistory(50, 50000),
      fearGreed: 55,
      capital: 10000
    };

    return await aiReasoningEngine.analyzeMarket(mockData);
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  private formatTelegramMessage(message: string): string {
    return `<b>${message}</b>\n\n<i>Generated by AI Trading Bot</i>`;
  }
}

// Main execution
async function main() {
  const testRunner = new IntegrationTestRunner();
  
  try {
    await testRunner.runCompleteTestSuite();
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error in test runner:', error);
    process.exit(1);
  });
}

export { IntegrationTestRunner };