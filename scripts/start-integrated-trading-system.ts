#!/usr/bin/env node
/**
 * Integrated Trading System Startup Script
 * Initializes and coordinates all trading bot components
 */

import dotenv from 'dotenv';
import { TradingBotServer, createTradingBot } from '../lib/telegram/bot-server';
import { tradingSystemIntegration } from '../lib/trading/integration/trading-system-integration';
import { dynamicStopCalculator } from '../lib/trading/dynamic-trailing-stops';
import { aiReasoningEngine } from '../lib/ai/reasoning-engine';
import { TelegramBotConfig } from '../lib/telegram/types';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface StartupConfig {
  enableTelegramBot: boolean;
  enableDynamicStops: boolean;
  enableAILearning: boolean;
  enableNotifications: boolean;
  testMode: boolean;
}

class IntegratedTradingSystemLauncher {
  private config: StartupConfig;
  private telegramBot?: TradingBotServer;
  private isRunning: boolean = false;
  private startupTime?: Date;

  constructor(config?: Partial<StartupConfig>) {
    this.config = {
      enableTelegramBot: process.env.TELEGRAM_BOT_TOKEN ? true : false,
      enableDynamicStops: process.env.DYNAMIC_STOPS_NOTIFICATIONS === 'true',
      enableAILearning: process.env.AI_LEARNING_ENABLED === 'true',
      enableNotifications: process.env.TRADING_NOTIFICATIONS_ENABLED === 'true',
      testMode: process.env.NODE_ENV === 'development',
      ...config
    };

    console.log('🔧 System Configuration:', this.config);
  }

  /**
   * Start the complete integrated trading system
   */
  async start(): Promise<void> {
    try {
      console.log('\n🚀 Starting Integrated AI Trading Bot System...\n');
      this.startupTime = new Date();

      // Step 1: Validate environment configuration
      await this.validateEnvironment();

      // Step 2: Initialize Telegram bot if enabled
      if (this.config.enableTelegramBot) {
        await this.initializeTelegramBot();
      }

      // Step 3: Initialize the trading system integration
      await this.initializeTradingSystem();

      // Step 4: Start all systems
      await this.startAllSystems();

      // Step 5: Setup monitoring and health checks
      this.setupMonitoring();

      // Step 6: Setup graceful shutdown handlers
      this.setupShutdownHandlers();

      this.isRunning = true;
      
      console.log('\n✅ Integrated AI Trading Bot System started successfully!');
      console.log('🎯 System Status:', this.getSystemStatus());
      
      if (this.config.testMode) {
        console.log('\n🧪 Running in TEST MODE - No real trades will be executed\n');
        await this.runTestSequence();
      }

      console.log('\n📊 System is now running. Press Ctrl+C to stop.\n');

    } catch (error) {
      console.error('\n❌ Failed to start Integrated Trading System:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Stop the integrated trading system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ System is not running');
      return;
    }

    try {
      console.log('\n🛑 Shutting down Integrated AI Trading Bot System...');

      // Stop trading system integration
      await tradingSystemIntegration.stop();

      // Stop Telegram bot
      if (this.telegramBot) {
        await this.telegramBot.stop();
      }

      await this.cleanup();
      this.isRunning = false;

      console.log('✅ System shutdown completed successfully');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment configuration...');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate Telegram configuration if enabled
    if (this.config.enableTelegramBot) {
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.log('⚠️ TELEGRAM_BOT_TOKEN not found - Telegram bot will be disabled');
        this.config.enableTelegramBot = false;
        this.config.enableNotifications = false;
      } else if (process.env.TELEGRAM_BOT_TOKEN === 'your-telegram-bot-token-from-botfather') {
        console.log('⚠️ Please configure a real Telegram bot token - Using mock mode');
        this.config.testMode = true;
      }
    }

    // Validate API keys
    const apiKeys = ['COINGECKO_API_KEY', 'ALPHA_VANTAGE_API_KEY'];
    apiKeys.forEach(key => {
      if (!process.env[key]) {
        console.log(`⚠️ ${key} not configured - Some features may be limited`);
      }
    });

    console.log('✅ Environment validation completed');
  }

  /**
   * Initialize Telegram bot
   */
  private async initializeTelegramBot(): Promise<void> {
    console.log('🤖 Initializing Telegram bot...');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || botToken === 'your-telegram-bot-token-from-botfather') {
      console.log('⚠️ Using mock Telegram bot for testing');
      return; // Skip actual bot initialization in test mode
    }

    const authorizedUsers = process.env.TELEGRAM_AUTHORIZED_USERS
      ?.split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id)) || [];

    const botConfig: TelegramBotConfig = {
      token: botToken,
      polling: process.env.TELEGRAM_POLLING_ENABLED === 'true',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_ENABLED === 'true' 
        ? process.env.TELEGRAM_WEBHOOK_URL 
        : undefined,
      rateLimit: {
        window: parseInt(process.env.TELEGRAM_RATE_LIMIT_WINDOW || '60'),
        max: parseInt(process.env.TELEGRAM_RATE_LIMIT_MAX || '30')
      },
      session: {
        timeout: 24 * 60 * 60, // 24 hours
        cleanup: 5 * 60        // 5 minutes
      },
      features: {
        analytics: true,
        notifications: this.config.enableNotifications,
        exports: true,
        webhooks: process.env.TELEGRAM_WEBHOOK_ENABLED === 'true'
      },
      security: {
        requireAuth: true,
        encryptSessions: true,
        allowedUsers: authorizedUsers.length > 0 ? authorizedUsers : undefined,
        blacklistedUsers: []
      }
    };

    this.telegramBot = createTradingBot(botConfig);
    console.log('✅ Telegram bot initialized');
  }

  /**
   * Initialize trading system integration
   */
  private async initializeTradingSystem(): Promise<void> {
    console.log('⚙️ Initializing trading system integration...');

    await tradingSystemIntegration.initialize({
      telegramBot: this.telegramBot,
      enableAILearning: this.config.enableAILearning,
      enableNotifications: this.config.enableNotifications,
      dynamicStopsConfig: {
        // Custom configuration can be added here
        baseTrailingPercentage: parseFloat(process.env.STOP_LOSS_PERCENT || '0.05') * 100,
        updateFrequency: 30000, // 30 seconds
        enablePositionSpecific: true,
        enableAcceleration: true
      }
    });

    console.log('✅ Trading system integration initialized');
  }

  /**
   * Start all systems
   */
  private async startAllSystems(): Promise<void> {
    console.log('🚀 Starting all systems...');

    // Start the trading system integration (includes dynamic stops)
    await tradingSystemIntegration.start();

    console.log('✅ All systems started');
  }

  /**
   * Setup system monitoring
   */
  private setupMonitoring(): void {
    console.log('📊 Setting up system monitoring...');

    // Health check every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Metrics logging every 15 minutes
    setInterval(() => {
      this.logSystemMetrics();
    }, 15 * 60 * 1000);

    console.log('✅ System monitoring setup completed');
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}. Initiating graceful shutdown...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGQUIT', () => handleShutdown('SIGQUIT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught Exception:', error);
      await this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      await this.stop();
      process.exit(1);
    });
  }

  /**
   * Run test sequence in test mode
   */
  private async runTestSequence(): Promise<void> {
    console.log('🧪 Running test sequence...');

    try {
      // Test 1: Generate mock trading signal
      console.log('📊 Testing AI signal generation...');
      const mockMarketData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000000,
        prices: Array.from({ length: 50 }, (_, i) => 50000 + (Math.random() - 0.5) * 1000),
        fearGreed: 45,
        capital: 10000
      };

      const signal = await aiReasoningEngine.analyzeMarket(mockMarketData);
      console.log('✅ AI signal generated:', {
        symbol: signal.symbol,
        action: signal.action,
        confidence: signal.confidence,
        riskReward: signal.riskReward
      });

      // Test 2: Process signal through integration
      console.log('🔄 Testing signal processing...');
      const result = await tradingSystemIntegration.processTradingSignal(signal);
      console.log('✅ Signal processed:', {
        shouldExecute: result.shouldExecute,
        adjustedConfidence: result.adjustedSignal.confidence
      });

      // Test 3: Test dynamic stops calculation
      console.log('🎯 Testing dynamic stops...');
      const optimalDistance = await dynamicStopCalculator.getOptimalStopDistance(
        'BTC/USD',
        50000,
        'LONG',
        signal.confidence,
        signal.marketRegime
      );
      console.log('✅ Optimal stop distance calculated:', optimalDistance.toFixed(2) + '%');

      // Test 4: Test system status
      console.log('📊 Testing system status...');
      const status = tradingSystemIntegration.getStatus();
      console.log('✅ System status retrieved:', {
        isRunning: status.isRunning,
        activeStops: status.activeStops
      });

      console.log('🎉 Test sequence completed successfully!\n');

    } catch (error) {
      console.error('❌ Test sequence failed:', error);
    }
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    try {
      const status = tradingSystemIntegration.getStatus();
      const metrics = tradingSystemIntegration.getMetrics();
      
      console.log('💓 Health Check:', {
        timestamp: new Date().toISOString(),
        uptime: Math.round(metrics.uptime / 1000 / 60) + ' minutes',
        isRunning: status.isRunning,
        activeStops: status.activeStops,
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      });

      // Check for potential issues
      if (metrics.uptime > 24 * 60 * 60 * 1000) { // 24 hours
        console.log('⚠️ System has been running for over 24 hours - consider restart');
      }

      if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
        console.log('⚠️ High memory usage detected');
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  /**
   * Log system metrics
   */
  private logSystemMetrics(): void {
    try {
      const metrics = tradingSystemIntegration.getMetrics();
      const dynamicStopsStats = dynamicStopCalculator.getStats();
      
      console.log('📈 System Metrics:', {
        timestamp: new Date().toISOString(),
        uptime: Math.round(metrics.uptime / 1000 / 60) + ' minutes',
        tradesExecuted: metrics.tradesExecuted,
        aiSignals: metrics.aiSignals,
        stopUpdates: metrics.stopUpdates,
        notifications: metrics.notifications,
        activePositions: dynamicStopsStats.activePositions,
        totalStopUpdates: dynamicStopsStats.totalUpdates
      });

    } catch (error) {
      console.error('❌ Failed to log system metrics:', error);
    }
  }

  /**
   * Get current system status
   */
  private getSystemStatus(): any {
    return {
      isRunning: this.isRunning,
      startupTime: this.startupTime,
      config: this.config,
      telegramBotEnabled: !!this.telegramBot,
      tradingSystemStatus: tradingSystemIntegration.getStatus()
    };
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up resources...');
      
      // Additional cleanup logic can be added here
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test') || args.includes('-t');
  const skipTelegram = args.includes('--no-telegram');
  const skipAI = args.includes('--no-ai');

  const launcher = new IntegratedTradingSystemLauncher({
    testMode,
    enableTelegramBot: !skipTelegram,
    enableAILearning: !skipAI
  });

  try {
    await launcher.start();
  } catch (error) {
    console.error('💥 Failed to start system:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error in main:', error);
    process.exit(1);
  });
}

export { IntegratedTradingSystemLauncher };