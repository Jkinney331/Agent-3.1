#!/usr/bin/env node

/**
 * Simple Telegram Bot Test Script
 * Basic bot that can start and respond to /start command
 * This is for testing connectivity without complex integrations
 */

const { config } = require('dotenv');

// Load environment variables
config();

class SimpleTelegramBot {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.isRunning = false;
    this.lastUpdateId = 0;
  }

  async start() {
    if (!this.botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
      process.exit(1);
    }

    console.log('🚀 Starting Simple Telegram Bot...');
    
    try {
      // Test bot token validity
      await this.testBotToken();
      
      // Start polling
      this.isRunning = true;
      await this.startPolling();
      
    } catch (error) {
      console.error('❌ Failed to start bot:', error.message);
      process.exit(1);
    }
  }

  async testBotToken() {
    console.log('🔑 Testing bot token...');
    
    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Invalid bot token: ${data.description}`);
      }
      
      console.log('✅ Bot token is valid');
      console.log(`🤖 Bot info: ${data.result.first_name} (@${data.result.username})`);
      
    } catch (error) {
      throw new Error(`Bot token test failed: ${error.message}`);
    }
  }

  async startPolling() {
    console.log('📡 Starting polling for updates...');
    console.log('💡 Send /start to the bot to test functionality');
    
    while (this.isRunning) {
      try {
        await this.getUpdates();
        await this.sleep(1000); // Poll every second
      } catch (error) {
        console.error('⚠️ Polling error:', error.message);
        await this.sleep(5000); // Wait 5 seconds before retrying
      }
    }
  }

  async getUpdates() {
    const url = `${this.baseUrl}/getUpdates?offset=${this.lastUpdateId + 1}&limit=10&timeout=30`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Get updates failed: ${data.description}`);
      }
      
      if (data.result && data.result.length > 0) {
        for (const update of data.result) {
          await this.handleUpdate(update);
          this.lastUpdateId = update.update_id;
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to get updates:', error.message);
    }
  }

  async handleUpdate(update) {
    console.log('📨 Received update:', update.update_id);
    
    if (update.message) {
      await this.handleMessage(update.message);
    }
  }

  async handleMessage(message) {
    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from;
    
    console.log(`👤 Message from ${user.first_name} (${user.id}): ${text}`);
    
    // Handle commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].toLowerCase();
      
      switch (command) {
        case '/start':
          await this.handleStartCommand(chatId, user);
          break;
        case '/help':
          await this.handleHelpCommand(chatId);
          break;
        case '/status':
          await this.handleStatusCommand(chatId);
          break;
        case '/test':
          await this.handleTestCommand(chatId);
          break;
        default:
          await this.sendMessage(chatId, `❓ Unknown command: ${command}\n\nType /help for available commands.`);
      }
    } else {
      // Handle regular messages
      await this.sendMessage(chatId, `👋 Hello! I received your message: "${text}"\n\nType /help for available commands.`);
    }
  }

  async handleStartCommand(chatId, user) {
    const welcomeMessage = `🎉 Welcome ${user.first_name}!

🤖 Simple Telegram Bot Test
✅ Bot is running successfully
🔗 Connection established

Available commands:
/start - Show this welcome message
/help - Show help information  
/status - Show bot status
/test - Run connection test

Ready to receive your commands!`;

    await this.sendMessage(chatId, welcomeMessage);
    console.log(`✅ Sent welcome message to ${user.first_name} (${user.id})`);
  }

  async handleHelpCommand(chatId) {
    const helpMessage = `📋 Available Commands:

/start - Initialize bot and show welcome
/help - Show this help message
/status - Display bot status information
/test - Run basic connectivity test

🔧 Test Features:
• Basic message handling
• Command processing  
• Connection verification
• Response testing

Type any message to test basic functionality.`;

    await this.sendMessage(chatId, helpMessage);
  }

  async handleStatusCommand(chatId) {
    const uptime = process.uptime();
    const uptimeFormatted = this.formatUptime(uptime);
    
    const statusMessage = `📊 Bot Status:

🟢 Status: Running
⏱️ Uptime: ${uptimeFormatted}
🔄 Updates processed: ${this.lastUpdateId}
💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
📡 Polling: Active

✅ All systems operational`;

    await this.sendMessage(chatId, statusMessage);
  }

  async handleTestCommand(chatId) {
    await this.sendMessage(chatId, '🧪 Running connection test...');
    
    try {
      // Test bot info
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        const testResult = `✅ Connection Test Successful!

🤖 Bot Name: ${data.result.first_name}
👤 Username: @${data.result.username}
🆔 Bot ID: ${data.result.id}
📊 API Response: OK
⚡ Latency: Good

🔗 All connections working properly!`;

        await this.sendMessage(chatId, testResult);
      } else {
        await this.sendMessage(chatId, '❌ Connection test failed: ' + data.description);
      }
      
    } catch (error) {
      await this.sendMessage(chatId, `❌ Connection test error: ${error.message}`);
    }
  }

  async sendMessage(chatId, text) {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      
      if (!data.ok) {
        console.error('❌ Failed to send message:', data.description);
      }
      
    } catch (error) {
      console.error('❌ Send message error:', error.message);
    }
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping bot...');
    this.isRunning = false;
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the bot
if (require.main === module) {
  const bot = new SimpleTelegramBot();
  bot.start().catch(error => {
    console.error('❌ Bot startup failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleTelegramBot;