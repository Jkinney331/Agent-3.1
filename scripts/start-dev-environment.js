#!/usr/bin/env node

/**
 * Development Environment Startup Script
 * Manages all services needed for local development with proper process management
 */

const { spawn, fork } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

class DevEnvironmentManager {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
    this.startupChecks = [];
    this.logDir = './logs';
  }

  async initialize() {
    console.log('🚀 Initializing AI Trading Bot Development Environment...\n');
    
    // Create necessary directories
    await this.createDirectories();
    
    // Run pre-startup checks
    await this.runStartupChecks();
    
    // Setup graceful shutdown handlers
    this.setupShutdownHandlers();
    
    console.log('✅ Environment initialized successfully!\n');
  }

  async createDirectories() {
    const dirs = ['./logs', './data', './backups', './config'];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async runStartupChecks() {
    console.log('🔍 Running startup checks...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  ✓ Node.js version: ${nodeVersion}`);
    
    if (parseInt(nodeVersion.slice(1)) < 18) {
      throw new Error('Node.js 18 or higher is required');
    }

    // Check environment configuration
    const requiredEnvVars = ['NODE_ENV'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.log(`  ⚠️  Missing environment variables: ${missing.join(', ')}`);
      console.log('     Using defaults for development');
    } else {
      console.log('  ✓ Environment variables configured');
    }

    // Check database configuration
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    console.log(`  ✓ Database type: ${dbType}`);

    // Check if database is accessible
    try {
      if (dbType === 'sqlite') {
        const { SQLiteClient } = await import('../lib/database/sqlite-client.js');
        const client = SQLiteClient.getInstance();
        await client.connect();
        console.log('  ✓ SQLite database accessible');
      } else {
        // Check PostgreSQL/Supabase connection
        if (process.env.DATABASE_URL) {
          console.log('  ✓ PostgreSQL connection string found');
        } else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.log('  ✓ Supabase configuration found');
        } else {
          console.log('  ⚠️  No database connection configured');
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Database check failed: ${error.message}`);
    }

    console.log('✅ Startup checks completed\n');
  }

  async startService(name, command, args = [], options = {}) {
    console.log(`🔄 Starting ${name}...`);
    
    const logFile = path.join(this.logDir, `${name}.log`);
    const errorLogFile = path.join(this.logDir, `${name}.error.log`);
    
    // Create log streams
    const logStream = await fs.open(logFile, 'a');
    const errorLogStream = await fs.open(errorLogFile, 'a');

    const serviceOptions = {
      stdio: ['ignore', logStream.fd, errorLogStream.fd],
      detached: false,
      ...options
    };

    let child;
    
    if (command.endsWith('.js')) {
      // Use fork for Node.js scripts
      child = fork(command, args, {
        ...serviceOptions,
        silent: true
      });
    } else {
      // Use spawn for other commands
      child = spawn(command, args, serviceOptions);
    }

    // Store process reference
    this.processes.set(name, {
      process: child,
      logStream,
      errorLogStream,
      startTime: Date.now()
    });

    // Handle process events
    child.on('error', (error) => {
      console.error(`❌ ${name} failed to start:`, error.message);
    });

    child.on('exit', (code, signal) => {
      if (!this.isShuttingDown) {
        if (code === 0) {
          console.log(`ℹ️  ${name} exited normally`);
        } else {
          console.error(`❌ ${name} crashed with code ${code} or signal ${signal}`);
          
          // Auto-restart critical services
          if (options.autoRestart && !this.isShuttingDown) {
            console.log(`🔄 Auto-restarting ${name} in 5 seconds...`);
            setTimeout(() => {
              if (!this.isShuttingDown) {
                this.startService(name, command, args, options);
              }
            }, 5000);
          }
        }
      }
    });

    // Give process time to start
    await this.sleep(1000);
    
    if (child.exitCode === null) {
      console.log(`✅ ${name} started successfully (PID: ${child.pid})`);
    } else {
      console.error(`❌ ${name} failed to start`);
    }

    return child;
  }

  async startDatabaseServices() {
    console.log('📁 Starting database services...\n');
    
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      // SQLite doesn't need external services, just setup
      try {
        const { setupDatabase } = await import('./setup-local-database.js');
        await setupDatabase();
        console.log('✅ SQLite database ready\n');
      } catch (error) {
        console.error('❌ SQLite setup failed:', error.message);
      }
    } else {
      // Check if Docker services should be started
      if (process.env.USE_DOCKER_DB === 'true') {
        await this.startService(
          'postgres',
          'docker-compose',
          ['up', '-d', 'postgres'],
          { autoRestart: false }
        );
        
        await this.sleep(5000); // Wait for PostgreSQL to be ready
        
        // Run database setup
        try {
          const { setupDatabase } = await import('./setup-local-database.js');
          await setupDatabase();
          console.log('✅ PostgreSQL database ready\n');
        } catch (error) {
          console.error('❌ PostgreSQL setup failed:', error.message);
        }
      } else {
        console.log('ℹ️  Using external database (Supabase or local PostgreSQL)\n');
      }
    }
  }

  async startMCPServices() {
    console.log('🔌 Starting MCP servers...\n');
    
    const mcpServers = [
      {
        name: 'crypto-mcp',
        script: './lib/mcp/crypto-server.js',
        port: 3010
      },
      {
        name: 'alpha-vantage-mcp',
        script: './lib/mcp/alpha-vantage-server.js',
        port: 3011
      },
      {
        name: 'trading-execution-mcp',
        script: './lib/mcp/trading-execution-server.js',
        port: 3012
      }
    ];

    for (const server of mcpServers) {
      if (await this.fileExists(server.script)) {
        await this.startService(
          server.name,
          server.script,
          [],
          { autoRestart: true }
        );
      } else {
        console.log(`⚠️  ${server.name} script not found, skipping...`);
      }
    }

    console.log('✅ MCP services started\n');
  }

  async startTelegramBot() {
    console.log('🤖 Starting Telegram bot...\n');
    
    const botScript = './lib/telegram/bot-server.ts';
    
    if (await this.fileExists(botScript)) {
      // Check if Telegram configuration is available
      if (process.env.TELEGRAM_BOT_TOKEN) {
        await this.startService(
          'telegram-bot',
          'npx',
          ['tsx', botScript],
          { autoRestart: true }
        );
        console.log('✅ Telegram bot started\n');
      } else {
        console.log('⚠️  Telegram bot token not configured, skipping bot startup\n');
      }
    } else {
      console.log('⚠️  Telegram bot script not found, skipping...\n');
    }
  }

  async startNgrok() {
    if (process.env.NGROK_AUTH_TOKEN && process.env.ENABLE_NGROK === 'true') {
      console.log('🌐 Starting ngrok tunnel...\n');
      
      await this.startService(
        'ngrok',
        'ngrok',
        ['http', '3000', '--authtoken', process.env.NGROK_AUTH_TOKEN],
        { autoRestart: false }
      );
      
      // Wait a bit for ngrok to start
      await this.sleep(3000);
      
      try {
        // Get ngrok public URL
        const response = await fetch('http://localhost:4040/api/tunnels');
        const data = await response.json();
        const tunnel = data.tunnels?.find(t => t.proto === 'https');
        
        if (tunnel) {
          console.log(`🌐 Ngrok tunnel available at: ${tunnel.public_url}`);
          console.log(`   Use this URL for Telegram webhook: ${tunnel.public_url}/api/telegram/webhook\n`);
        }
      } catch (error) {
        console.log('⚠️  Could not retrieve ngrok URL, check manually at http://localhost:4040\n');
      }
    }
  }

  async startMainApplication() {
    console.log('🎯 Starting main application...\n');
    
    // Start Next.js development server
    await this.startService(
      'nextjs',
      'npm',
      ['run', 'dev'],
      { 
        autoRestart: true,
        env: { ...process.env, FORCE_COLOR: '1' }
      }
    );

    console.log('✅ Main application started\n');
  }

  async startMonitoring() {
    if (process.env.ENABLE_MONITORING === 'true') {
      console.log('📊 Starting monitoring services...\n');
      
      await this.startService(
        'monitoring',
        'docker-compose',
        ['--profile', 'monitoring', 'up', '-d'],
        { autoRestart: false }
      );
      
      console.log('✅ Monitoring services started\n');
      console.log('   • Prometheus: http://localhost:9090');
      console.log('   • Grafana: http://localhost:3001 (admin/grafana_password)\n');
    }
  }

  async startFullEnvironment() {
    try {
      await this.initialize();
      
      // Start services in order
      await this.startDatabaseServices();
      await this.startMCPServices();
      await this.startTelegramBot();
      await this.startNgrok();
      await this.startMonitoring();
      await this.startMainApplication();
      
      this.printStartupSummary();
      
      // Keep the process running
      console.log('🎉 Development environment is ready!');
      console.log('Press Ctrl+C to shut down all services\n');
      
      // Monitor processes
      this.startHealthMonitoring();
      
    } catch (error) {
      console.error('❌ Failed to start development environment:', error.message);
      await this.shutdown();
      process.exit(1);
    }
  }

  printStartupSummary() {
    console.log('📋 Service Summary:');
    console.log('─'.repeat(50));
    
    for (const [name, info] of this.processes) {
      const uptime = Math.floor((Date.now() - info.startTime) / 1000);
      const status = info.process.exitCode === null ? '🟢 Running' : '🔴 Stopped';
      console.log(`   ${status} ${name.padEnd(20)} (${uptime}s)`);
    }
    
    console.log('─'.repeat(50));
    console.log('\n🌐 Available URLs:');
    console.log('   • Application: http://localhost:3000');
    console.log('   • Database Admin: Check Docker logs for pgAdmin');
    console.log('   • n8n Workflows: http://localhost:5678');
    console.log('   • Ngrok Tunnel: http://localhost:4040 (if enabled)');
    console.log('   • Monitoring: http://localhost:9090 (if enabled)\n');
    
    console.log('📁 Log Files:');
    console.log('   • Service logs: ./logs/');
    console.log('   • Application logs: Check console or ./logs/nextjs.log\n');
  }

  startHealthMonitoring() {
    setInterval(() => {
      if (this.isShuttingDown) return;
      
      const deadProcesses = [];
      
      for (const [name, info] of this.processes) {
        if (info.process.exitCode !== null) {
          deadProcesses.push(name);
        }
      }
      
      if (deadProcesses.length > 0) {
        console.log(`⚠️  Dead processes detected: ${deadProcesses.join(', ')}`);
      }
      
    }, 30000); // Check every 30 seconds
  }

  setupShutdownHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
        this.shutdown();
      });
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    });
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log('\n🛑 Shutting down development environment...');
    
    const shutdownPromises = [];
    
    for (const [name, info] of this.processes) {
      if (info.process.exitCode === null) {
        console.log(`   Stopping ${name}...`);
        
        shutdownPromises.push(
          new Promise((resolve) => {
            info.process.on('exit', resolve);
            info.process.kill('SIGTERM');
            
            // Force kill after 10 seconds
            setTimeout(() => {
              if (info.process.exitCode === null) {
                info.process.kill('SIGKILL');
              }
              resolve();
            }, 10000);
          })
        );
      }
      
      // Close log streams
      if (info.logStream) await info.logStream.close();
      if (info.errorLogStream) await info.errorLogStream.close();
    }
    
    await Promise.all(shutdownPromises);
    
    console.log('✅ All services stopped');
    console.log('👋 Development environment shut down complete');
    
    process.exit(0);
  }

  // Utility methods
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// CLI interface
async function main() {
  const manager = new DevEnvironmentManager();
  
  const command = process.argv[2] || 'full';
  
  switch (command) {
    case 'full':
      await manager.startFullEnvironment();
      break;
      
    case 'db':
      await manager.initialize();
      await manager.startDatabaseServices();
      break;
      
    case 'mcp':
      await manager.initialize();
      await manager.startMCPServices();
      break;
      
    case 'bot':
      await manager.initialize();
      await manager.startTelegramBot();
      break;
      
    case 'app':
      await manager.initialize();
      await manager.startMainApplication();
      break;
      
    default:
      console.log('Usage: node start-dev-environment.js [full|db|mcp|bot|app]');
      console.log('  full: Start complete development environment (default)');
      console.log('  db:   Start database services only');
      console.log('  mcp:  Start MCP servers only');
      console.log('  bot:  Start Telegram bot only');
      console.log('  app:  Start main application only');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Failed to start development environment:', error);
    process.exit(1);
  });
}

module.exports = { DevEnvironmentManager };