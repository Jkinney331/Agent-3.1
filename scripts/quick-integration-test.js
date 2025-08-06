#!/usr/bin/env node

/**
 * Quick Integration Test Script
 * Tests minimal system integration without full complexity
 * Verifies: Environment, Database, Bot, and AI Report Generation
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config();

class QuickIntegrationTester {
  constructor() {
    this.testResults = {
      environment: false,
      database: false,
      telegram: false,
      ai: false
    };
    this.db = null;
  }

  async run() {
    console.log('🚀 Quick Integration Test Starting...\n');
    console.log('Testing core system components without full complexity\n');
    
    try {
      // Test 1: Environment Variables
      await this.testEnvironmentVariables();
      
      // Test 2: Database Connectivity
      await this.testDatabaseConnection();
      
      // Test 3: Telegram Bot Configuration
      await this.testTelegramConfiguration();
      
      // Test 4: AI Report Generation
      await this.testAIReportGeneration();
      
      // Summary
      this.printTestSummary();
      
      if (this.allTestsPassed()) {
        console.log('✅ All integration tests passed!');
        console.log('🎉 System is ready for development and testing');
        console.log('\n📋 Next Steps:');
        console.log('   1. Run: node scripts/test-db-connection.js');
        console.log('   2. Run: node scripts/simple-test-bot.js');
        console.log('   3. Test Telegram bot with /start command');
        process.exit(0);
      } else {
        console.log('❌ Some integration tests failed');
        console.log('🔧 Please fix the issues before proceeding');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 Integration test error:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async testEnvironmentVariables() {
    console.log('1. 🔧 Testing Environment Variables...');
    
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'OPENAI_API_KEY'
    ];
    
    const optionalVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SQLITE_DATABASE_PATH'
    ];
    
    let passed = true;
    
    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        console.log(`   ❌ Missing required: ${varName}`);
        passed = false;
      } else {
        const masked = this.maskSensitiveValue(value);
        console.log(`   ✅ Found: ${varName} = ${masked}`);
      }
    }
    
    // Check optional variables
    for (const varName of optionalVars) {
      const value = process.env[varName];
      if (value) {
        const masked = this.maskSensitiveValue(value);
        console.log(`   ✅ Optional: ${varName} = ${masked}`);
      } else {
        console.log(`   ⚠️  Optional missing: ${varName} (using defaults)`);
      }
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 16) {
      console.log(`   ✅ Node.js version: ${nodeVersion}`);
    } else {
      console.log(`   ⚠️  Node.js version ${nodeVersion} (recommend 16+)`);
    }
    
    this.testResults.environment = passed;
    console.log(`   ${passed ? '✅' : '❌'} Environment test: ${passed ? 'PASSED' : 'FAILED'}\n`);
  }

  async testDatabaseConnection() {
    console.log('2. 🗄️  Testing Database Connection...');
    
    try {
      // Test SQLite database
      const sqlite3 = require('sqlite3');
      const { open } = require('sqlite');
      
      const dbPath = process.env.SQLITE_DATABASE_PATH || './data/trading_bot.db';
      
      // Ensure directory exists
      const fs = require('fs').promises;
      const dataDir = path.dirname(dbPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Connect to database
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      
      console.log(`   ✅ SQLite connection: ${dbPath}`);
      
      // Test basic query
      const result = await this.db.get('SELECT sqlite_version() as version');
      console.log(`   ✅ SQLite version: ${result.version}`);
      
      // Test simple table creation
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS integration_test (
          id INTEGER PRIMARY KEY,
          test_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Test insert/select
      await this.db.run(`
        INSERT INTO integration_test (test_data) VALUES ('integration_test_data')
      `);
      
      const testData = await this.db.get(`
        SELECT * FROM integration_test WHERE test_data = 'integration_test_data'
      `);
      
      if (testData) {
        console.log('   ✅ Database read/write operations working');
        
        // Cleanup test data
        await this.db.run(`DELETE FROM integration_test WHERE test_data = 'integration_test_data'`);
      } else {
        throw new Error('Database write/read test failed');
      }
      
      this.testResults.database = true;
      console.log('   ✅ Database test: PASSED\n');
      
    } catch (error) {
      console.log(`   ❌ Database test failed: ${error.message}`);
      this.testResults.database = false;
      console.log('   ❌ Database test: FAILED\n');
    }
  }

  async testTelegramConfiguration() {
    console.log('3. 🤖 Testing Telegram Bot Configuration...');
    
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN not found');
      }
      
      // Test bot token validity
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Invalid bot token: ${data.description}`);
      }
      
      console.log(`   ✅ Bot token valid`);
      console.log(`   🤖 Bot name: ${data.result.first_name}`);
      console.log(`   👤 Username: @${data.result.username}`);
      console.log(`   🆔 Bot ID: ${data.result.id}`);
      
      // Test webhook info (optional)
      try {
        const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const webhookData = await webhookResponse.json();
        
        if (webhookData.ok) {
          if (webhookData.result.url) {
            console.log(`   🔗 Webhook URL: ${webhookData.result.url}`);
          } else {
            console.log('   📡 No webhook configured (polling mode available)');
          }
        }
      } catch (error) {
        console.log('   ⚠️  Could not check webhook info');
      }
      
      this.testResults.telegram = true;
      console.log('   ✅ Telegram test: PASSED\n');
      
    } catch (error) {
      console.log(`   ❌ Telegram test failed: ${error.message}`);
      this.testResults.telegram = false;
      console.log('   ❌ Telegram test: FAILED\n');
    }
  }

  async testAIReportGeneration() {
    console.log('4. 🧠 Testing AI Report Generation...');
    
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      
      if (!openaiKey) {
        throw new Error('OPENAI_API_KEY not found');
      }
      
      console.log('   ✅ OpenAI API key found');
      
      // Test simple AI completion
      const testPrompt = "Generate a brief trading market summary in 50 words or less.";
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a financial market analyst. Provide concise, professional market insights.'
            },
            {
              role: 'user',
              content: testPrompt
            }
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const aiResponse = data.choices[0].message.content.trim();
        console.log('   ✅ OpenAI API connection successful');
        console.log('   🤖 Sample AI response:');
        console.log(`       "${aiResponse.substring(0, 100)}${aiResponse.length > 100 ? '...' : ''}"`);
        
        // Test report generation pattern
        const reportData = {
          timestamp: new Date().toISOString(),
          market_summary: aiResponse,
          system_status: 'operational',
          test_mode: true
        };
        
        console.log('   ✅ Report generation pattern working');
        console.log(`   📊 Report timestamp: ${reportData.timestamp}`);
        
        this.testResults.ai = true;
        console.log('   ✅ AI test: PASSED\n');
        
      } else {
        throw new Error('No response from AI');
      }
      
    } catch (error) {
      console.log(`   ❌ AI test failed: ${error.message}`);
      this.testResults.ai = false;
      console.log('   ❌ AI test: FAILED\n');
    }
  }

  maskSensitiveValue(value) {
    if (!value || value.length < 8) return '****';
    return value.substring(0, 4) + '*'.repeat(Math.max(4, value.length - 8)) + value.substring(value.length - 4);
  }

  printTestSummary() {
    console.log('📋 Integration Test Summary:');
    console.log('════════════════════════════');
    
    for (const [test, passed] of Object.entries(this.testResults)) {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      const testName = test.charAt(0).toUpperCase() + test.slice(1);
      console.log(`   ${testName.padRight ? testName.padRight(12) : testName}: ${status}`);
    }
    
    const passedCount = Object.values(this.testResults).filter(Boolean).length;
    const totalCount = Object.keys(this.testResults).length;
    
    console.log('════════════════════════════');
    console.log(`   Total: ${passedCount}/${totalCount} tests passed\n`);
  }

  allTestsPassed() {
    return Object.values(this.testResults).every(Boolean);
  }

  async cleanup() {
    if (this.db) {
      try {
        await this.db.close();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  // Utility method for testing individual components
  async testComponent(componentName) {
    switch (componentName) {
      case 'env':
        await this.testEnvironmentVariables();
        break;
      case 'db':
        await this.testDatabaseConnection();
        break;
      case 'telegram':
        await this.testTelegramConfiguration();
        break;
      case 'ai':
        await this.testAIReportGeneration();
        break;
      default:
        console.log('Available components: env, db, telegram, ai');
    }
  }
}

// Handle command line arguments for individual component testing
if (require.main === module) {
  const args = process.argv.slice(2);
  const tester = new QuickIntegrationTester();
  
  if (args.length > 0 && args[0] === '--component') {
    // Test specific component
    const component = args[1];
    if (component) {
      console.log(`🧪 Testing component: ${component}\n`);
      tester.testComponent(component).then(() => {
        tester.cleanup();
      }).catch(error => {
        console.error('Component test error:', error);
        tester.cleanup();
        process.exit(1);
      });
    } else {
      console.log('Usage: node quick-integration-test.js --component <env|db|telegram|ai>');
      process.exit(1);
    }
  } else {
    // Run full integration test
    tester.run().catch(error => {
      console.error('Integration test runner error:', error);
      process.exit(1);
    });
  }
}

module.exports = QuickIntegrationTester;