#!/usr/bin/env node

/**
 * Environment Validation and Configuration Management Script
 * Validates all environment variables and system requirements
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

class EnvironmentValidator {
  constructor() {
    this.validationResults = [];
    this.warnings = [];
    this.errors = [];
    this.suggestions = [];
  }

  /**
   * Run complete environment validation
   */
  async validate() {
    console.log('🔍 Validating AI Trading Bot Environment...\n');
    
    await this.validateNodeEnvironment();
    await this.validateDependencies();
    await this.validateEnvironmentFiles();
    await this.validateRequiredVariables();
    await this.validateOptionalVariables();
    await this.validateDatabaseConfiguration();
    await this.validateTelegramConfiguration();
    await this.validateTradingConfiguration();
    await this.validateExternalServices();
    await this.validateDirectoryStructure();
    await this.validatePermissions();
    
    await this.generateReport();
    this.printSummary();
  }

  /**
   * Validate Node.js environment
   */
  async validateNodeEnvironment() {
    console.log('📦 Validating Node.js environment...');
    
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1));
      
      if (majorVersion >= 20) {
        this.addResult('Node Version', 'PASS', `${nodeVersion} (✓ >=20)`);
      } else if (majorVersion >= 18) {
        this.addResult('Node Version', 'WARN', `${nodeVersion} (recommended: >=20)`);
        this.addWarning('Consider upgrading to Node.js 20+ for optimal performance');
      } else {
        this.addResult('Node Version', 'FAIL', `${nodeVersion} (required: >=18)`);
        this.addError('Node.js 18 or higher is required');
      }

      // Check npm version
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        this.addResult('NPM Version', 'PASS', npmVersion);
      } catch (error) {
        this.addResult('NPM Version', 'FAIL', 'Not found');
        this.addError('NPM is required but not found');
      }

      // Check if running in development mode
      const nodeEnv = process.env.NODE_ENV || 'development';
      this.addResult('NODE_ENV', 'INFO', nodeEnv);

    } catch (error) {
      this.addResult('Node Environment', 'FAIL', error.message);
      this.addError('Failed to validate Node.js environment');
    }
  }

  /**
   * Validate package dependencies
   */
  async validateDependencies() {
    console.log('📚 Validating dependencies...');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Check if node_modules exists
      try {
        await fs.access('./node_modules');
        this.addResult('Dependencies Installed', 'PASS', 'node_modules found');
      } catch {
        this.addResult('Dependencies Installed', 'FAIL', 'node_modules not found');
        this.addError('Run "npm install" to install dependencies');
      }

      // Check critical dependencies
      const criticalDeps = [
        'next', 'react', 'sqlite3', 'sqlite', '@supabase/supabase-js',
        'node-telegram-bot-api', 'telegraf', 'ccxt', 'axios'
      ];

      for (const dep of criticalDeps) {
        if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
          this.addResult(`Dependency: ${dep}`, 'PASS', 'Configured');
        } else {
          this.addResult(`Dependency: ${dep}`, 'WARN', 'Not found');
          this.addWarning(`Consider adding ${dep} if needed for your setup`);
        }
      }

    } catch (error) {
      this.addResult('Dependencies Check', 'FAIL', error.message);
      this.addError('Failed to validate dependencies');
    }
  }

  /**
   * Validate environment files
   */
  async validateEnvironmentFiles() {
    console.log('🔧 Validating environment files...');
    
    const envFiles = [
      { file: '.env.local', required: true },
      { file: '.env.example', required: true },
      { file: '.env', required: false },
      { file: '.env.development', required: false },
      { file: '.env.production', required: false }
    ];

    for (const { file, required } of envFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const lineCount = content.split('\n').filter(line => 
          line.trim() && !line.trim().startsWith('#')
        ).length;
        
        this.addResult(`File: ${file}`, 'PASS', `${lineCount} variables`);
      } catch (error) {
        if (required) {
          this.addResult(`File: ${file}`, 'FAIL', 'Not found');
          this.addError(`Required file ${file} not found. Copy from .env.example`);
        } else {
          this.addResult(`File: ${file}`, 'INFO', 'Optional file not found');
        }
      }
    }
  }

  /**
   * Validate required environment variables
   */
  async validateRequiredVariables() {
    console.log('✅ Validating required variables...');
    
    const requiredVars = [
      {
        name: 'NODE_ENV',
        description: 'Node environment',
        defaultValue: 'development',
        required: false
      }
    ];

    // Database variables (context-dependent)
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      requiredVars.push({
        name: 'SQLITE_DATABASE_PATH',
        description: 'SQLite database file path',
        defaultValue: './data/trading_bot.db',
        required: false
      });
    } else {
      if (!process.env.DATABASE_URL) {
        requiredVars.push(
          {
            name: 'NEXT_PUBLIC_SUPABASE_URL',
            description: 'Supabase project URL',
            required: true
          },
          {
            name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            description: 'Supabase anonymous key',
            required: true
          },
          {
            name: 'SUPABASE_SERVICE_ROLE_KEY',
            description: 'Supabase service role key',
            required: true
          }
        );
      } else {
        requiredVars.push({
          name: 'DATABASE_URL',
          description: 'PostgreSQL connection string',
          required: true
        });
      }
    }

    for (const varConfig of requiredVars) {
      const value = process.env[varConfig.name];
      
      if (value) {
        // Mask sensitive values
        const displayValue = this.maskSensitiveValue(varConfig.name, value);
        this.addResult(`ENV: ${varConfig.name}`, 'PASS', displayValue);
      } else if (varConfig.required) {
        this.addResult(`ENV: ${varConfig.name}`, 'FAIL', 'Not set');
        this.addError(`${varConfig.name} is required: ${varConfig.description}`);
      } else {
        const defaultValue = varConfig.defaultValue || 'Not set';
        this.addResult(`ENV: ${varConfig.name}`, 'WARN', `Using default: ${defaultValue}`);
      }
    }
  }

  /**
   * Validate optional environment variables
   */
  async validateOptionalVariables() {
    console.log('⚙️  Validating optional variables...');
    
    const optionalVars = [
      { name: 'TELEGRAM_BOT_TOKEN', category: 'Telegram', sensitive: true },
      { name: 'TELEGRAM_WEBHOOK_URL', category: 'Telegram' },
      { name: 'TELEGRAM_SECRET_TOKEN', category: 'Telegram', sensitive: true },
      { name: 'BINANCE_API_KEY', category: 'Trading', sensitive: true },
      { name: 'BINANCE_SECRET_KEY', category: 'Trading', sensitive: true },
      { name: 'ALPACA_API_KEY', category: 'Trading', sensitive: true },
      { name: 'ALPACA_SECRET_KEY', category: 'Trading', sensitive: true },
      { name: 'OPENAI_API_KEY', category: 'AI', sensitive: true },
      { name: 'COINGECKO_API_KEY', category: 'Market Data', sensitive: true },
      { name: 'ALPHA_VANTAGE_API_KEY', category: 'Market Data', sensitive: true },
      { name: 'NGROK_AUTH_TOKEN', category: 'Development', sensitive: true },
      { name: 'REDIS_URL', category: 'Caching' },
      { name: 'N8N_BASE_URL', category: 'Automation' }
    ];

    const categories = {};
    
    for (const varConfig of optionalVars) {
      const value = process.env[varConfig.name];
      
      if (!categories[varConfig.category]) {
        categories[varConfig.category] = { configured: 0, total: 0 };
      }
      categories[varConfig.category].total++;
      
      if (value) {
        categories[varConfig.category].configured++;
        const displayValue = varConfig.sensitive ? this.maskSensitiveValue(varConfig.name, value) : value;
        this.addResult(`${varConfig.category}: ${varConfig.name}`, 'PASS', displayValue);
      } else {
        this.addResult(`${varConfig.category}: ${varConfig.name}`, 'INFO', 'Not configured');
      }
    }

    // Summary by category
    for (const [category, stats] of Object.entries(categories)) {
      const percentage = Math.round((stats.configured / stats.total) * 100);
      this.addResult(`${category} Category`, 'INFO', `${stats.configured}/${stats.total} configured (${percentage}%)`);
    }
  }

  /**
   * Validate database configuration
   */
  async validateDatabaseConfiguration() {
    console.log('🗄️  Validating database configuration...');
    
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    this.addResult('Database Type', 'INFO', dbType);

    if (dbType === 'sqlite') {
      const dbPath = process.env.SQLITE_DATABASE_PATH || './data/trading_bot.db';
      
      try {
        // Check if database file exists
        await fs.access(dbPath);
        this.addResult('SQLite Database', 'PASS', `Found at ${dbPath}`);
        
        // Check if data directory exists
        const dataDir = path.dirname(dbPath);
        await fs.access(dataDir);
        this.addResult('Data Directory', 'PASS', dataDir);
        
      } catch (error) {
        this.addResult('SQLite Database', 'WARN', 'Database file not found (will be created)');
        this.addSuggestion('Run "npm run db:setup" to initialize SQLite database');
      }
    } else {
      // PostgreSQL/Supabase validation
      if (process.env.DATABASE_URL) {
        this.addResult('PostgreSQL URL', 'PASS', this.maskSensitiveValue('DATABASE_URL', process.env.DATABASE_URL));
      } else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        this.addResult('Supabase Configuration', 'PASS', 'Configured');
        
        // Test Supabase connection
        try {
          const { createClient } = await import('../lib/database/supabase-client.js');
          const supabase = createClient();
          this.addResult('Supabase Connection', 'INFO', 'Client created (test connection recommended)');
        } catch (error) {
          this.addResult('Supabase Connection', 'WARN', 'Failed to create client');
        }
      } else {
        this.addResult('Database Configuration', 'FAIL', 'No database connection configured');
        this.addError('Either DATABASE_URL or Supabase configuration is required');
      }
    }
  }

  /**
   * Validate Telegram configuration
   */
  async validateTelegramConfiguration() {
    console.log('🤖 Validating Telegram configuration...');
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    
    if (botToken) {
      // Validate token format
      const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
      if (tokenRegex.test(botToken) && botToken.length > 20) {
        this.addResult('Telegram Bot Token', 'PASS', this.maskSensitiveValue('token', botToken));
      } else {
        this.addResult('Telegram Bot Token', 'FAIL', 'Invalid format');
        this.addError('Telegram bot token has invalid format');
      }
    } else {
      this.addResult('Telegram Bot Token', 'WARN', 'Not configured');
      this.addSuggestion('Configure TELEGRAM_BOT_TOKEN to enable Telegram bot');
    }

    if (webhookUrl) {
      try {
        const url = new URL(webhookUrl);
        if (url.protocol === 'https:') {
          this.addResult('Telegram Webhook URL', 'PASS', webhookUrl);
        } else {
          this.addResult('Telegram Webhook URL', 'FAIL', 'Must use HTTPS');
          this.addError('Telegram webhook URL must use HTTPS');
        }
      } catch {
        this.addResult('Telegram Webhook URL', 'FAIL', 'Invalid URL format');
        this.addError('Telegram webhook URL has invalid format');
      }
    } else {
      this.addResult('Telegram Webhook URL', 'INFO', 'Not configured (polling mode)');
    }

    // Check user configuration
    const allowedUsers = process.env.TELEGRAM_ALLOWED_USERS;
    const adminUsers = process.env.TELEGRAM_ADMIN_USERS;
    
    if (allowedUsers) {
      const userIds = allowedUsers.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      this.addResult('Allowed Users', 'PASS', `${userIds.length} users configured`);
    } else {
      this.addResult('Allowed Users', 'WARN', 'No user restrictions (public bot)');
      this.addWarning('Consider setting TELEGRAM_ALLOWED_USERS for security');
    }

    if (adminUsers) {
      const adminIds = adminUsers.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      this.addResult('Admin Users', 'PASS', `${adminIds.length} admins configured`);
    } else {
      this.addResult('Admin Users', 'INFO', 'No admin users configured');
    }
  }

  /**
   * Validate trading configuration
   */
  async validateTradingConfiguration() {
    console.log('💰 Validating trading configuration...');
    
    const tradingMode = process.env.TRADING_MODE || 'paper';
    this.addResult('Trading Mode', 'INFO', tradingMode);

    const initialBalance = parseFloat(process.env.INITIAL_BALANCE || '50000');
    this.addResult('Initial Balance', 'INFO', `$${initialBalance.toLocaleString()}`);

    const riskPerTrade = parseFloat(process.env.RISK_PER_TRADE || '0.02');
    if (riskPerTrade <= 0.05) {
      this.addResult('Risk Per Trade', 'PASS', `${(riskPerTrade * 100).toFixed(1)}%`);
    } else {
      this.addResult('Risk Per Trade', 'WARN', `${(riskPerTrade * 100).toFixed(1)}% (high risk)`);
      this.addWarning('Risk per trade is above 5%, consider reducing for safer trading');
    }

    // Validate exchange API keys for live trading
    if (tradingMode === 'live') {
      const binanceKey = process.env.BINANCE_API_KEY;
      const alpacaKey = process.env.ALPACA_API_KEY;
      
      if (!binanceKey && !alpacaKey) {
        this.addResult('Exchange API Keys', 'FAIL', 'No exchange configured for live trading');
        this.addError('Live trading mode requires exchange API keys');
      } else {
        this.addResult('Exchange API Keys', 'PASS', 'At least one exchange configured');
      }
    } else {
      this.addResult('Paper Trading', 'PASS', 'Safe mode enabled');
    }
  }

  /**
   * Validate external services
   */
  async validateExternalServices() {
    console.log('🌐 Validating external services...');
    
    // n8n
    const n8nUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.addResult('n8n URL', 'INFO', n8nUrl);

    // Redis
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.addResult('Redis', 'PASS', this.maskSensitiveValue('REDIS_URL', redisUrl));
    } else {
      this.addResult('Redis', 'INFO', 'Not configured (optional)');
    }

    // Ngrok (for development)
    const ngrokToken = process.env.NGROK_AUTH_TOKEN;
    if (ngrokToken) {
      this.addResult('Ngrok', 'PASS', 'Configured for webhook testing');
    } else {
      this.addResult('Ngrok', 'INFO', 'Not configured (webhook testing limited)');
      this.addSuggestion('Configure NGROK_AUTH_TOKEN for local webhook testing');
    }
  }

  /**
   * Validate directory structure
   */
  async validateDirectoryStructure() {
    console.log('📁 Validating directory structure...');
    
    const requiredDirs = [
      { path: './app', required: true, description: 'Next.js app directory' },
      { path: './lib', required: true, description: 'Library code' },
      { path: './components', required: true, description: 'React components' },
      { path: './scripts', required: true, description: 'Utility scripts' },
      { path: './database', required: true, description: 'Database schemas' },
      { path: './logs', required: false, description: 'Application logs' },
      { path: './data', required: false, description: 'Data storage' },
      { path: './backups', required: false, description: 'Database backups' },
      { path: './config', required: false, description: 'Configuration files' }
    ];

    for (const dir of requiredDirs) {
      try {
        const stats = await fs.stat(dir.path);
        if (stats.isDirectory()) {
          this.addResult(`Directory: ${dir.path}`, 'PASS', dir.description);
        } else {
          this.addResult(`Directory: ${dir.path}`, 'FAIL', 'Not a directory');
        }
      } catch (error) {
        if (dir.required) {
          this.addResult(`Directory: ${dir.path}`, 'FAIL', 'Not found');
          this.addError(`Required directory ${dir.path} not found`);
        } else {
          this.addResult(`Directory: ${dir.path}`, 'WARN', 'Not found (will be created)');
        }
      }
    }
  }

  /**
   * Validate file permissions
   */
  async validatePermissions() {
    console.log('🔐 Validating permissions...');
    
    const criticalFiles = [
      './package.json',
      './next.config.mjs',
      './tsconfig.json'
    ];

    for (const file of criticalFiles) {
      try {
        await fs.access(file, fs.constants.R_OK);
        this.addResult(`Permissions: ${file}`, 'PASS', 'Readable');
      } catch (error) {
        this.addResult(`Permissions: ${file}`, 'FAIL', 'Not readable');
        this.addError(`Cannot read ${file}: ${error.message}`);
      }
    }

    // Check write access to important directories
    const writableDirs = ['./logs', './data', './backups'];
    
    for (const dir of writableDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        await fs.access(dir, fs.constants.W_OK);
        this.addResult(`Write Access: ${dir}`, 'PASS', 'Writable');
      } catch (error) {
        this.addResult(`Write Access: ${dir}`, 'FAIL', 'Not writable');
        this.addError(`Cannot write to ${dir}: ${error.message}`);
      }
    }
  }

  /**
   * Generate detailed validation report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
      platform: process.platform,
      validation_results: this.validationResults,
      summary: {
        total_checks: this.validationResults.length,
        passed: this.validationResults.filter(r => r.status === 'PASS').length,
        warnings: this.validationResults.filter(r => r.status === 'WARN').length,
        failures: this.validationResults.filter(r => r.status === 'FAIL').length,
        info: this.validationResults.filter(r => r.status === 'INFO').length
      },
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions
    };

    const reportPath = path.join('./logs', `environment-validation-${Date.now()}.json`);
    await fs.mkdir('./logs', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Detailed report saved: ${reportPath}`);
  }

  /**
   * Print validation summary
   */
  printSummary() {
    console.log('\n📊 Validation Summary:');
    console.log('─'.repeat(80));
    
    const passed = this.validationResults.filter(r => r.status === 'PASS').length;
    const warnings = this.validationResults.filter(r => r.status === 'WARN').length;
    const failures = this.validationResults.filter(r => r.status === 'FAIL').length;
    const info = this.validationResults.filter(r => r.status === 'INFO').length;
    const total = this.validationResults.length;
    
    console.log(`   Total Checks: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Failures: ${failures}`);
    console.log(`   ℹ️  Info: ${info}`);
    
    const successRate = ((passed + info) / total * 100).toFixed(1);
    console.log(`   Success Rate: ${successRate}%`);
    
    console.log('─'.repeat(80));
    
    // Show recent results
    console.log('\n🔍 Recent Validation Results:');
    this.validationResults.slice(-15).forEach(result => {
      const icon = this.getStatusIcon(result.status);
      console.log(`   ${icon} ${result.check.padEnd(30)} - ${result.details}`);
    });
    
    if (this.errors.length > 0) {
      console.log('\n❌ Critical Errors:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (this.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      this.suggestions.forEach(suggestion => console.log(`   • ${suggestion}`));
    }
    
    // Final recommendation
    if (failures === 0) {
      console.log('\n🎉 Environment validation passed! You\'re ready to start development.');
      console.log('\n🚀 Next steps:');
      console.log('   • npm run db:setup (initialize database)');
      console.log('   • npm run db:seed (add test data)');
      console.log('   • npm run dev:full (start full development environment)');
    } else {
      console.log('\n⚠️  Environment validation found issues that need attention.');
      console.log('\n🔧 Fix the errors above and run validation again:');
      console.log('   • Check your .env.local file');
      console.log('   • Install missing dependencies');
      console.log('   • Configure required services');
    }
    
    console.log('\n📚 Documentation: Check README.md for detailed setup instructions');
  }

  // Helper methods
  addResult(check, status, details) {
    this.validationResults.push({ check, status, details });
  }

  addError(message) {
    this.errors.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  addSuggestion(message) {
    this.suggestions.push(message);
  }

  getStatusIcon(status) {
    const icons = {
      'PASS': '✅',
      'FAIL': '❌',
      'WARN': '⚠️',
      'INFO': 'ℹ️'
    };
    return icons[status] || '❓';
  }

  maskSensitiveValue(name, value) {
    const sensitivePatterns = [
      'token', 'key', 'secret', 'password', 'auth', 'api'
    ];
    
    const isSensitive = sensitivePatterns.some(pattern => 
      name.toLowerCase().includes(pattern)
    );
    
    if (isSensitive && value.length > 8) {
      return `${value.substring(0, 8)}...`;
    }
    
    return value;
  }
}

// CLI interface
async function main() {
  const validator = new EnvironmentValidator();
  
  try {
    await validator.validate();
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { EnvironmentValidator };