#!/usr/bin/env node

/**
 * Telegram Bot Testing Script
 * Comprehensive testing setup for local Telegram bot development
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

class TelegramBotTester {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.testUserId = process.env.TEST_USER_ID || '123456789';
    this.webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    this.ngrokUrl = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🤖 Initializing Telegram Bot Tester...\n');
    
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
    }

    // Get ngrok URL if available
    await this.detectNgrokUrl();
    
    console.log('Bot Configuration:');
    console.log(`  Token: ${this.botToken.substring(0, 10)}...`);
    console.log(`  Test User ID: ${this.testUserId}`);
    console.log(`  Webhook URL: ${this.webhookUrl || 'Not set'}`);
    console.log(`  Ngrok URL: ${this.ngrokUrl || 'Not detected'}\n`);
  }

  async detectNgrokUrl() {
    try {
      const response = await axios.get('http://localhost:4040/api/tunnels', {
        timeout: 2000
      });
      
      const tunnel = response.data.tunnels?.find(t => t.proto === 'https');
      if (tunnel) {
        this.ngrokUrl = tunnel.public_url;
        console.log(`🌐 Ngrok tunnel detected: ${this.ngrokUrl}`);
      }
    } catch (error) {
      console.log('ℹ️  Ngrok not running or not accessible');
    }
  }

  async testBotConnection() {
    console.log('🔗 Testing bot connection...');
    
    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getMe`);
      
      if (response.data.ok) {
        const bot = response.data.result;
        console.log(`✅ Bot connected successfully!`);
        console.log(`   Name: ${bot.first_name} (@${bot.username})`);
        console.log(`   ID: ${bot.id}`);
        console.log(`   Can join groups: ${bot.can_join_groups}`);
        console.log(`   Can read messages: ${bot.can_read_all_group_messages}\n`);
        
        this.testResults.push({
          test: 'Bot Connection',
          status: 'PASS',
          details: `Connected as ${bot.first_name}`
        });
        
        return bot;
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      console.log(`❌ Bot connection failed: ${error.message}\n`);
      this.testResults.push({
        test: 'Bot Connection',
        status: 'FAIL',
        details: error.message
      });
      throw error;
    }
  }

  async setupWebhook() {
    console.log('🪝 Setting up webhook...');
    
    const webhookUrl = this.ngrokUrl 
      ? `${this.ngrokUrl}/api/telegram/webhook`
      : this.webhookUrl;
    
    if (!webhookUrl) {
      console.log('⚠️  No webhook URL available. Skipping webhook setup.\n');
      return;
    }

    try {
      // Delete existing webhook first
      await axios.post(`https://api.telegram.org/bot${this.botToken}/deleteWebhook`);
      
      // Set new webhook
      const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        url: webhookUrl,
        secret_token: process.env.TELEGRAM_SECRET_TOKEN,
        max_connections: 10,
        allowed_updates: ['message', 'callback_query', 'inline_query']
      });

      if (response.data.ok) {
        console.log(`✅ Webhook set successfully!`);
        console.log(`   URL: ${webhookUrl}`);
        console.log(`   Secret token: ${process.env.TELEGRAM_SECRET_TOKEN ? 'Set' : 'Not set'}\n`);
        
        this.testResults.push({
          test: 'Webhook Setup',
          status: 'PASS',
          details: `Webhook set to ${webhookUrl}`
        });
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      console.log(`❌ Webhook setup failed: ${error.message}\n`);
      this.testResults.push({
        test: 'Webhook Setup',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testWebhookEndpoint() {
    console.log('🔍 Testing webhook endpoint...');
    
    const webhookUrl = this.ngrokUrl 
      ? `${this.ngrokUrl}/api/telegram/webhook`
      : this.webhookUrl;
    
    if (!webhookUrl) {
      console.log('⚠️  No webhook URL to test\n');
      return;
    }

    try {
      // Test if webhook endpoint is accessible
      const response = await axios.get(webhookUrl.replace('/webhook', '/health'), {
        timeout: 5000
      });
      
      console.log(`✅ Webhook endpoint is accessible`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      
      this.testResults.push({
        test: 'Webhook Endpoint',
        status: 'PASS',
        details: `Endpoint accessible (${response.status})`
      });
    } catch (error) {
      console.log(`❌ Webhook endpoint test failed: ${error.message}\n`);
      this.testResults.push({
        test: 'Webhook Endpoint',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async sendTestMessage() {
    console.log('💬 Sending test message...');
    
    try {
      const testMessage = `🤖 Test message from AI Trading Bot\n\nTime: ${new Date().toISOString()}\nEnvironment: ${process.env.NODE_ENV || 'development'}`;
      
      const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: this.testUserId,
        text: testMessage,
        parse_mode: 'Markdown'
      });

      if (response.data.ok) {
        console.log(`✅ Test message sent successfully!`);
        console.log(`   Message ID: ${response.data.result.message_id}`);
        console.log(`   Chat ID: ${response.data.result.chat.id}\n`);
        
        this.testResults.push({
          test: 'Send Message',
          status: 'PASS',
          details: `Message sent (ID: ${response.data.result.message_id})`
        });
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      console.log(`❌ Failed to send test message: ${error.message}\n`);
      this.testResults.push({
        test: 'Send Message',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testBotCommands() {
    console.log('⌨️  Testing bot commands...');
    
    const commands = [
      { command: 'start', description: 'Start the bot' },
      { command: 'help', description: 'Show help message' },
      { command: 'status', description: 'Show trading status' },
      { command: 'balance', description: 'Show account balance' },
      { command: 'positions', description: 'Show current positions' },
      { command: 'settings', description: 'Show settings' }
    ];

    try {
      const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
        commands: commands
      });

      if (response.data.ok) {
        console.log(`✅ Bot commands configured successfully!`);
        commands.forEach(cmd => {
          console.log(`   /${cmd.command} - ${cmd.description}`);
        });
        console.log();
        
        this.testResults.push({
          test: 'Bot Commands',
          status: 'PASS',
          details: `${commands.length} commands configured`
        });
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      console.log(`❌ Failed to set bot commands: ${error.message}\n`);
      this.testResults.push({
        test: 'Bot Commands',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testInlineKeyboard() {
    console.log('⌨️  Testing inline keyboard...');
    
    try {
      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Portfolio', callback_data: 'portfolio' },
            { text: '📈 Trading', callback_data: 'trading' }
          ],
          [
            { text: '⚙️ Settings', callback_data: 'settings' },
            { text: '❓ Help', callback_data: 'help' }
          ],
          [
            { text: '🔄 Refresh', callback_data: 'refresh' }
          ]
        ]
      };

      const response = await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: this.testUserId,
        text: '🎛️ *Test Inline Keyboard*\n\nClick any button below to test the bot\'s interactive features:',
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      if (response.data.ok) {
        console.log(`✅ Inline keyboard sent successfully!`);
        console.log(`   Message ID: ${response.data.result.message_id}\n`);
        
        this.testResults.push({
          test: 'Inline Keyboard',
          status: 'PASS',
          details: 'Interactive keyboard sent'
        });
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      console.log(`❌ Failed to send inline keyboard: ${error.message}\n`);
      this.testResults.push({
        test: 'Inline Keyboard',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async simulateWebhookMessage() {
    console.log('📨 Simulating webhook message...');
    
    const webhookUrl = this.ngrokUrl 
      ? `${this.ngrokUrl}/api/telegram/webhook`
      : 'http://localhost:3000/api/telegram/webhook';

    const simulatedUpdate = {
      update_id: Date.now(),
      message: {
        message_id: Date.now() + 1,
        from: {
          id: parseInt(this.testUserId),
          is_bot: false,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser'
        },
        chat: {
          id: parseInt(this.testUserId),
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start'
      }
    };

    try {
      const response = await axios.post(webhookUrl, simulatedUpdate, {
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_SECRET_TOKEN || ''
        },
        timeout: 10000
      });

      console.log(`✅ Webhook simulation successful!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
      
      this.testResults.push({
        test: 'Webhook Simulation',
        status: 'PASS',
        details: `Simulated /start command (${response.status})`
      });
    } catch (error) {
      console.log(`❌ Webhook simulation failed: ${error.message}\n`);
      this.testResults.push({
        test: 'Webhook Simulation',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async getWebhookInfo() {
    console.log('ℹ️  Getting webhook info...');
    
    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`);
      
      if (response.data.ok) {
        const info = response.data.result;
        console.log(`✅ Webhook info retrieved:`);
        console.log(`   URL: ${info.url || 'Not set'}`);
        console.log(`   Has custom certificate: ${info.has_custom_certificate}`);
        console.log(`   Pending updates: ${info.pending_update_count}`);
        console.log(`   Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000) : 'None'}`);
        console.log(`   Last error message: ${info.last_error_message || 'None'}`);
        console.log(`   Max connections: ${info.max_connections}`);
        console.log(`   Allowed updates: ${info.allowed_updates?.join(', ') || 'All'}\n`);
        
        this.testResults.push({
          test: 'Webhook Info',
          status: 'PASS',
          details: `URL: ${info.url || 'Not set'}, Pending: ${info.pending_update_count}`
        });
      } else {
        throw new Error(response.data.description);
      }
    } catch (error) {
      console.log(`❌ Failed to get webhook info: ${error.message}\n`);
      this.testResults.push({
        test: 'Webhook Info',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testRateLimiting() {
    console.log('⚡ Testing rate limiting...');
    
    try {
      const startTime = Date.now();
      const promises = [];
      
      // Send 5 messages rapidly
      for (let i = 0; i < 5; i++) {
        promises.push(
          axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            chat_id: this.testUserId,
            text: `Rate limit test message ${i + 1}/5`
          })
        );
      }

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Rate limiting test completed:`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Successful: ${successful}/5`);
      console.log(`   Failed: ${failed}/5\n`);
      
      this.testResults.push({
        test: 'Rate Limiting',
        status: failed > 0 ? 'PARTIAL' : 'PASS',
        details: `${successful}/5 messages sent in ${duration}ms`
      });
    } catch (error) {
      console.log(`❌ Rate limiting test failed: ${error.message}\n`);
      this.testResults.push({
        test: 'Rate Limiting',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async runCompleteTest() {
    console.log('🧪 Running complete Telegram bot test suite...\n');
    
    try {
      await this.initialize();
      await this.testBotConnection();
      await this.setupWebhook();
      await this.testWebhookEndpoint();
      await this.testBotCommands();
      await this.sendTestMessage();
      await this.testInlineKeyboard();
      await this.getWebhookInfo();
      await this.simulateWebhookMessage();
      await this.testRateLimiting();
      
      // Generate test report
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async generateTestReport() {
    console.log('📋 Generating test report...\n');
    
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const failedTests = this.testResults.filter(t => t.status === 'FAIL').length;
    const partialTests = this.testResults.filter(t => t.status === 'PARTIAL').length;
    const totalTests = this.testResults.length;
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        partial: partialTests,
        success_rate: ((passedTests + partialTests) / totalTests * 100).toFixed(1)
      },
      environment: {
        node_env: process.env.NODE_ENV,
        bot_token_configured: !!this.botToken,
        webhook_url: this.webhookUrl,
        ngrok_url: this.ngrokUrl,
        test_user_id: this.testUserId
      },
      test_results: this.testResults
    };

    // Save report to file
    const reportPath = path.join('./logs', `telegram-test-report-${Date.now()}.json`);
    await fs.mkdir('./logs', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('📊 Test Summary:');
    console.log('─'.repeat(50));
    this.testResults.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`   ${status} ${test.test.padEnd(20)} - ${test.details}`);
    });
    console.log('─'.repeat(50));
    console.log(`   Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests} | Partial: ${partialTests}`);
    console.log(`   Success Rate: ${report.summary.success_rate}%`);
    console.log(`   Report saved: ${reportPath}\n`);
    
    if (failedTests === 0) {
      console.log('🎉 All tests passed! Your Telegram bot is ready for development.\n');
    } else {
      console.log('⚠️  Some tests failed. Check the issues above and your configuration.\n');
    }

    // Provide next steps
    this.printNextSteps();
  }

  printNextSteps() {
    console.log('🚀 Next Steps:');
    console.log('─'.repeat(50));
    
    if (!this.ngrokUrl && !this.webhookUrl) {
      console.log('   1. Install and setup ngrok for webhook testing:');
      console.log('      • Install: npm install -g ngrok');
      console.log('      • Get auth token: https://dashboard.ngrok.com/get-started/your-authtoken');
      console.log('      • Set NGROK_AUTH_TOKEN in .env.local');
      console.log('      • Run: ngrok http 3000');
    }
    
    if (!process.env.TELEGRAM_SECRET_TOKEN) {
      console.log('   2. Set TELEGRAM_SECRET_TOKEN in .env.local for webhook security');
    }
    
    console.log('   3. Start your development environment:');
    console.log('      • npm run dev (start Next.js app)');
    console.log('      • npm run ngrok:start (start ngrok tunnel)');
    console.log('      • Test bot commands in Telegram');
    
    console.log('   4. Monitor your bot:');
    console.log('      • Check logs in ./logs/ directory');
    console.log('      • Use /status command to check bot health');
    console.log('      • Monitor webhook at /api/telegram/webhook');
    
    console.log('\n💡 Tips:');
    console.log('   • Use @BotFather to configure bot settings');
    console.log('   • Test with multiple users if possible');
    console.log('   • Monitor rate limits and error handling');
    console.log('   • Use inline keyboards for better UX\n');
  }
}

// CLI interface
async function main() {
  const tester = new TelegramBotTester();
  
  const command = process.argv[2] || 'full';
  
  try {
    switch (command) {
      case 'full':
        await tester.runCompleteTest();
        break;
        
      case 'connection':
        await tester.initialize();
        await tester.testBotConnection();
        break;
        
      case 'webhook':
        await tester.initialize();
        await tester.setupWebhook();
        await tester.getWebhookInfo();
        break;
        
      case 'message':
        await tester.initialize();
        await tester.sendTestMessage();
        break;
        
      case 'simulate':
        await tester.initialize();
        await tester.simulateWebhookMessage();
        break;
        
      default:
        console.log('Usage: node test-telegram-bot.js [command]');
        console.log('Commands:');
        console.log('  full       - Run complete test suite (default)');
        console.log('  connection - Test bot connection only');
        console.log('  webhook    - Test webhook setup only');
        console.log('  message    - Send test message only');
        console.log('  simulate   - Simulate webhook message only');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TelegramBotTester };