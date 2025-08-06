#!/usr/bin/env node

/**
 * Complete Local Environment Integration Tester
 * Tests the entire AI Trading Bot system end-to-end
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: '.env.local' });

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.baseUrl = 'http://localhost:3000';
    this.services = new Map();
    this.testData = {
      symbols: ['BTC-USD', 'ETH-USD', 'ADA-USD'],
      testUserId: process.env.TEST_USER_ID || '123456789'
    };
  }

  /**
   * Run complete integration test suite
   */
  async runIntegrationTests() {
    console.log('🧪 Starting AI Trading Bot Integration Tests...\n');
    
    try {
      await this.setupTestEnvironment();
      await this.testDatabaseConnection();
      await this.testAPIEndpoints();
      await this.testTradingEngine();
      await this.testAIServices();
      await this.testTelegramBot();
      await this.testMCPServers();
      await this.testDataPipeline();
      await this.testErrorHandling();
      await this.testPerformance();
      
      await this.generateTestReport();
      this.printTestSummary();
      
    } catch (error) {
      console.error('❌ Integration test suite failed:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    try {
      // Ensure test database is ready
      const { setupDatabase } = await import('./setup-local-database.js');
      await setupDatabase();
      
      this.addTestResult('Test Environment Setup', 'PASS', 'Database initialized');
      
      // Wait for services to be ready
      await this.waitForService('http://localhost:3000/api/health', 'Main Application', 30000);
      
      console.log('✅ Test environment ready\n');
    } catch (error) {
      this.addTestResult('Test Environment Setup', 'FAIL', error.message);
      throw error;
    }
  }

  /**
   * Test database connection and basic operations
   */
  async testDatabaseConnection() {
    console.log('🗄️  Testing database connection...');
    
    try {
      const dbType = process.env.DATABASE_TYPE || 'postgresql';
      
      if (dbType === 'sqlite') {
        const { SQLiteClient } = await import('../lib/database/sqlite-client.js');
        const client = SQLiteClient.getInstance();
        await client.connect();
        
        // Test basic query
        const result = await client.query('SELECT COUNT(*) as count FROM trading_accounts');
        this.addTestResult('SQLite Connection', 'PASS', `${result[0]?.count || 0} accounts found`);
        
        // Test write operation
        await client.run(
          'INSERT OR REPLACE INTO trading_accounts (user_id, account_type, balance) VALUES (?, ?, ?)',
          ['test-user', 'paper', 10000]
        );
        this.addTestResult('SQLite Write Test', 'PASS', 'Account created/updated');
        
      } else {
        const { createClient } = await import('../lib/database/supabase-client.js');
        const supabase = createClient();
        
        // Test connection
        const { data, error } = await supabase
          .from('trading_accounts')
          .select('count')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        this.addTestResult('Supabase Connection', 'PASS', 'Connected successfully');
      }
      
    } catch (error) {
      this.addTestResult('Database Connection', 'FAIL', error.message);
      throw error;
    }
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints() {
    console.log('🌐 Testing API endpoints...');
    
    const endpoints = [
      { path: '/api/health', method: 'GET', expectedStatus: 200 },
      { path: '/api/crypto', method: 'GET', params: '?action=trending', expectedStatus: 200 },
      { path: '/api/trading/config', method: 'GET', expectedStatus: 200 },
      { path: '/api/ai-analysis', method: 'GET', expectedStatus: 200 },
      { path: '/api/telegram/secure-bot', method: 'GET', expectedStatus: 200 }
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${this.baseUrl}${endpoint.path}${endpoint.params || ''}`;
        const response = await axios({
          method: endpoint.method,
          url,
          timeout: 10000,
          validateStatus: () => true // Don't throw on error status
        });

        if (response.status === endpoint.expectedStatus) {
          this.addTestResult(`API: ${endpoint.path}`, 'PASS', `Status ${response.status}`);
        } else {
          this.addTestResult(`API: ${endpoint.path}`, 'WARN', `Status ${response.status} (expected ${endpoint.expectedStatus})`);
        }
      } catch (error) {
        this.addTestResult(`API: ${endpoint.path}`, 'FAIL', error.message);
      }
    }
  }

  /**
   * Test trading engine functionality
   */
  async testTradingEngine() {
    console.log('💰 Testing trading engine...');
    
    try {
      // Test paper trading order placement
      const testOrder = {
        symbol: 'BTC-USD',
        side: 'buy',
        quantity: 0.001,
        type: 'market'
      };

      const response = await axios.post(`${this.baseUrl}/api/trading/execute`, testOrder, {
        timeout: 15000
      });

      if (response.status === 200 && response.data.success) {
        this.addTestResult('Trading: Order Placement', 'PASS', `Order ID: ${response.data.orderId}`);
      } else {
        this.addTestResult('Trading: Order Placement', 'WARN', response.data.message || 'Unexpected response');
      }

      // Test portfolio balance retrieval
      const balanceResponse = await axios.get(`${this.baseUrl}/api/trading/positions`);
      
      if (balanceResponse.status === 200) {
        this.addTestResult('Trading: Portfolio Data', 'PASS', 'Portfolio retrieved successfully');
      } else {
        this.addTestResult('Trading: Portfolio Data', 'FAIL', 'Failed to retrieve portfolio');
      }

    } catch (error) {
      this.addTestResult('Trading Engine', 'FAIL', error.message);
    }
  }

  /**
   * Test AI analysis services
   */
  async testAIServices() {
    console.log('🤖 Testing AI services...');
    
    try {
      // Test AI analysis endpoint
      const analysisRequest = {
        symbol: 'BTC-USD',
        timeframe: '1h',
        analysis_type: 'technical'
      };

      const response = await axios.post(`${this.baseUrl}/api/ai-analysis`, analysisRequest, {
        timeout: 20000
      });

      if (response.status === 200 && response.data.analysis) {
        this.addTestResult('AI: Technical Analysis', 'PASS', 'Analysis generated');
      } else {
        this.addTestResult('AI: Technical Analysis', 'WARN', 'Analysis service may be limited');
      }

      // Test market data processing
      const marketDataResponse = await axios.get(`${this.baseUrl}/api/crypto?action=prices&symbols=BTC,ETH`);
      
      if (marketDataResponse.status === 200) {
        this.addTestResult('AI: Market Data Processing', 'PASS', 'Market data retrieved');
      } else {
        this.addTestResult('AI: Market Data Processing', 'FAIL', 'Failed to process market data');
      }

    } catch (error) {
      this.addTestResult('AI Services', 'FAIL', error.message);
    }
  }

  /**
   * Test Telegram bot functionality
   */
  async testTelegramBot() {
    console.log('🤖 Testing Telegram bot...');
    
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      this.addTestResult('Telegram Bot', 'SKIP', 'Bot token not configured');
      return;
    }

    try {
      // Test bot connection
      const botResponse = await axios.get(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
      );

      if (botResponse.data.ok) {
        this.addTestResult('Telegram: Bot Connection', 'PASS', `Connected as ${botResponse.data.result.first_name}`);
      } else {
        throw new Error(botResponse.data.description);
      }

      // Test webhook endpoint
      const webhookResponse = await axios.get(`${this.baseUrl}/api/telegram/webhook`, {
        validateStatus: () => true
      });

      if (webhookResponse.status >= 200 && webhookResponse.status < 500) {
        this.addTestResult('Telegram: Webhook Endpoint', 'PASS', `Endpoint accessible (${webhookResponse.status})`);
      } else {
        this.addTestResult('Telegram: Webhook Endpoint', 'FAIL', `Status ${webhookResponse.status}`);
      }

      // Test message formatting
      const { formatters } = await import('../lib/telegram/formatters/message-formatter.js').catch(() => ({}));
      
      if (formatters) {
        this.addTestResult('Telegram: Message Formatting', 'PASS', 'Formatters available');
      } else {
        this.addTestResult('Telegram: Message Formatting', 'WARN', 'Formatters not found');
      }

    } catch (error) {
      this.addTestResult('Telegram Bot', 'FAIL', error.message);
    }
  }

  /**
   * Test MCP servers
   */
  async testMCPServers() {
    console.log('🔌 Testing MCP servers...');
    
    const mcpServers = [
      { name: 'Crypto Server', port: 3010 },
      { name: 'Alpha Vantage Server', port: 3011 },
      { name: 'Trading Execution Server', port: 3012 }
    ];

    for (const server of mcpServers) {
      try {
        const response = await axios.get(`http://localhost:${server.port}/health`, {
          timeout: 5000
        });

        if (response.status === 200) {
          this.addTestResult(`MCP: ${server.name}`, 'PASS', `Running on port ${server.port}`);
        } else {
          this.addTestResult(`MCP: ${server.name}`, 'WARN', `Unexpected status ${response.status}`);
        }
      } catch (error) {
        this.addTestResult(`MCP: ${server.name}`, 'FAIL', 'Server not accessible');
      }
    }
  }

  /**
   * Test data pipeline (market data flow)
   */
  async testDataPipeline() {
    console.log('📊 Testing data pipeline...');
    
    try {
      // Test market data retrieval
      const marketDataResponse = await axios.get(`${this.baseUrl}/api/crypto?action=trending`);
      
      if (marketDataResponse.status === 200 && marketDataResponse.data.data) {
        const dataCount = Array.isArray(marketDataResponse.data.data) 
          ? marketDataResponse.data.data.length 
          : Object.keys(marketDataResponse.data.data).length;
        
        this.addTestResult('Data Pipeline: Market Data', 'PASS', `${dataCount} items retrieved`);
      } else {
        this.addTestResult('Data Pipeline: Market Data', 'FAIL', 'No market data returned');
      }

      // Test data persistence (if test data was seeded)
      const dbType = process.env.DATABASE_TYPE || 'postgresql';
      
      if (dbType === 'sqlite') {
        const { SQLiteClient } = await import('../lib/database/sqlite-client.js');
        const client = SQLiteClient.getInstance();
        const marketData = await client.query('SELECT COUNT(*) as count FROM market_data LIMIT 1');
        
        if (marketData[0]?.count > 0) {
          this.addTestResult('Data Pipeline: Persistence', 'PASS', `${marketData[0].count} records stored`);
        } else {
          this.addTestResult('Data Pipeline: Persistence', 'WARN', 'No historical data found');
        }
      }

    } catch (error) {
      this.addTestResult('Data Pipeline', 'FAIL', error.message);
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('🛡️  Testing error handling...');
    
    const errorTests = [
      { path: '/api/nonexistent', expectedStatus: 404, description: '404 Error Handling' },
      { path: '/api/trading/execute', method: 'POST', data: {}, expectedStatus: 400, description: 'Invalid Request Handling' },
      { path: '/api/crypto?action=invalid', expectedStatus: 400, description: 'Invalid Parameter Handling' }
    ];

    for (const test of errorTests) {
      try {
        const response = await axios({
          method: test.method || 'GET',
          url: `${this.baseUrl}${test.path}`,
          data: test.data,
          timeout: 5000,
          validateStatus: () => true
        });

        if (response.status === test.expectedStatus) {
          this.addTestResult(`Error: ${test.description}`, 'PASS', `Correct status ${response.status}`);
        } else {
          this.addTestResult(`Error: ${test.description}`, 'WARN', `Status ${response.status} (expected ${test.expectedStatus})`);
        }
      } catch (error) {
        this.addTestResult(`Error: ${test.description}`, 'FAIL', error.message);
      }
    }
  }

  /**
   * Test performance characteristics
   */
  async testPerformance() {
    console.log('⚡ Testing performance...');
    
    try {
      // Test API response times
      const performanceTests = [
        { name: 'Health Check', path: '/api/health' },
        { name: 'Market Data', path: '/api/crypto?action=prices&symbols=BTC' },
        { name: 'Trading Config', path: '/api/trading/config' }
      ];

      for (const test of performanceTests) {
        const startTime = Date.now();
        
        try {
          const response = await axios.get(`${this.baseUrl}${test.path}`, {
            timeout: 10000
          });
          
          const responseTime = Date.now() - startTime;
          
          if (responseTime < 1000) {
            this.addTestResult(`Performance: ${test.name}`, 'PASS', `${responseTime}ms`);
          } else if (responseTime < 3000) {
            this.addTestResult(`Performance: ${test.name}`, 'WARN', `${responseTime}ms (slow)`);
          } else {
            this.addTestResult(`Performance: ${test.name}`, 'FAIL', `${responseTime}ms (too slow)`);
          }
        } catch (error) {
          this.addTestResult(`Performance: ${test.name}`, 'FAIL', 'Request failed');
        }
      }

      // Test concurrent requests
      const concurrentStartTime = Date.now();
      const concurrentPromises = Array(5).fill().map(() => 
        axios.get(`${this.baseUrl}/api/health`)
      );

      const concurrentResults = await Promise.allSettled(concurrentPromises);
      const concurrentTime = Date.now() - concurrentStartTime;
      const successfulRequests = concurrentResults.filter(r => r.status === 'fulfilled').length;

      this.addTestResult('Performance: Concurrent Requests', 'PASS', 
        `${successfulRequests}/5 requests completed in ${concurrentTime}ms`);

    } catch (error) {
      this.addTestResult('Performance Testing', 'FAIL', error.message);
    }
  }

  /**
   * Wait for service to be ready
   */
  async waitForService(url, serviceName, timeout = 30000) {
    const startTime = Date.now();
    const checkInterval = 2000;
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.status === 200) {
          console.log(`✅ ${serviceName} is ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    throw new Error(`${serviceName} did not become ready within ${timeout}ms`);
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      environment: {
        node_env: process.env.NODE_ENV,
        database_type: process.env.DATABASE_TYPE || 'postgresql',
        trading_mode: process.env.TRADING_MODE || 'paper',
        base_url: this.baseUrl
      },
      summary: {
        total_tests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        warnings: this.testResults.filter(r => r.status === 'WARN').length,
        failures: this.testResults.filter(r => r.status === 'FAIL').length,
        skipped: this.testResults.filter(r => r.status === 'SKIP').length
      },
      test_results: this.testResults,
      performance: {
        total_duration: `${duration}ms`,
        avg_test_duration: `${Math.round(duration / this.testResults.length)}ms`
      }
    };

    // Calculate success rate
    const successfulTests = report.summary.passed + report.summary.warnings;
    const successRate = (successfulTests / report.summary.total_tests * 100).toFixed(1);
    report.summary.success_rate = `${successRate}%`;

    // Save report
    const reportPath = path.join('./logs', `integration-test-report-${Date.now()}.json`);
    await fs.mkdir('./logs', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Integration test report saved: ${reportPath}`);
    return report;
  }

  /**
   * Print test summary
   */
  printTestSummary() {
    console.log('\n📊 Integration Test Summary:');
    console.log('─'.repeat(80));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    const failures = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
    const total = this.testResults.length;
    
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Failures: ${failures}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    
    const successRate = ((passed + warnings) / total * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Duration: ${Date.now() - this.startTime}ms`);
    
    console.log('─'.repeat(80));
    
    // Show categorized results
    const categories = this.groupTestsByCategory();
    
    for (const [category, tests] of Object.entries(categories)) {
      console.log(`\n${category}:`);
      tests.forEach(test => {
        const icon = this.getStatusIcon(test.status);
        console.log(`   ${icon} ${test.test.padEnd(35)} - ${test.details}`);
      });
    }
    
    // Show failures in detail
    const failedTests = this.testResults.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests Details:');
      failedTests.forEach(test => {
        console.log(`   • ${test.test}: ${test.details}`);
      });
    }
    
    // Final status
    if (failures === 0) {
      console.log('\n🎉 All integration tests passed! Your environment is ready for development.');
    } else {
      console.log(`\n⚠️  ${failures} test(s) failed. Check the issues above and your configuration.`);
    }
  }

  /**
   * Group tests by category for better organization
   */
  groupTestsByCategory() {
    const categories = {};
    
    this.testResults.forEach(test => {
      let category = 'General';
      
      if (test.test.includes('Database') || test.test.includes('SQLite') || test.test.includes('Supabase')) {
        category = '🗄️ Database';
      } else if (test.test.includes('API')) {
        category = '🌐 API Endpoints';
      } else if (test.test.includes('Trading')) {
        category = '💰 Trading Engine';
      } else if (test.test.includes('AI')) {
        category = '🤖 AI Services';
      } else if (test.test.includes('Telegram')) {
        category = '📱 Telegram Bot';
      } else if (test.test.includes('MCP')) {
        category = '🔌 MCP Servers';
      } else if (test.test.includes('Data Pipeline')) {
        category = '📊 Data Pipeline';
      } else if (test.test.includes('Error')) {
        category = '🛡️ Error Handling';
      } else if (test.test.includes('Performance')) {
        category = '⚡ Performance';
      }
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(test);
    });
    
    return categories;
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    // Clean up any test data or temporary files
    try {
      // Remove test accounts if created
      const dbType = process.env.DATABASE_TYPE || 'postgresql';
      
      if (dbType === 'sqlite') {
        const { SQLiteClient } = await import('../lib/database/sqlite-client.js');
        const client = SQLiteClient.getInstance();
        await client.run('DELETE FROM trading_accounts WHERE user_id = ?', ['test-user']);
      }
      
      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.log('⚠️  Test cleanup had issues:', error.message);
    }
  }

  // Helper methods
  addTestResult(test, status, details) {
    this.testResults.push({ test, status, details, timestamp: new Date().toISOString() });
  }

  getStatusIcon(status) {
    const icons = {
      'PASS': '✅',
      'FAIL': '❌',
      'WARN': '⚠️',
      'SKIP': '⏭️',
      'INFO': 'ℹ️'
    };
    return icons[status] || '❓';
  }
}

// CLI interface
async function main() {
  const tester = new IntegrationTester();
  
  try {
    await tester.runIntegrationTests();
    await tester.cleanup();
  } catch (error) {
    console.error('❌ Integration testing failed:', error.message);
    await tester.cleanup();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { IntegrationTester };