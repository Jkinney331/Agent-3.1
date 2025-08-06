import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

/**
 * SQLite Database Client for Local Development
 * Provides a backup alternative to Supabase for local testing
 */
export class SQLiteClient {
  private static instance: SQLiteClient;
  private db: Database | null = null;
  private dbPath: string;

  private constructor() {
    this.dbPath = process.env.SQLITE_DATABASE_PATH || './data/trading_bot.db';
  }

  public static getInstance(): SQLiteClient {
    if (!SQLiteClient.instance) {
      SQLiteClient.instance = new SQLiteClient();
    }
    return SQLiteClient.instance;
  }

  /**
   * Initialize SQLite database connection
   */
  async connect(): Promise<Database> {
    if (this.db) {
      return this.db;
    }

    try {
      // Ensure the data directory exists
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Open SQLite database
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');
      
      // Enable WAL mode for better concurrency
      await this.db.exec('PRAGMA journal_mode = WAL');
      
      // Optimize SQLite settings
      await this.db.exec(`
        PRAGMA synchronous = NORMAL;
        PRAGMA cache_size = -64000;
        PRAGMA temp_store = MEMORY;
        PRAGMA mmap_size = 268435456;
      `);

      console.log(`✅ SQLite database connected: ${this.dbPath}`);
      return this.db;
    } catch (error) {
      console.error('❌ Failed to connect to SQLite database:', error);
      throw error;
    }
  }

  /**
   * Get the database connection
   */
  async getConnection(): Promise<Database> {
    if (!this.db) {
      return await this.connect();
    }
    return this.db;
  }

  /**
   * Initialize database schema for SQLite
   */
  async initializeSchema(): Promise<void> {
    const db = await this.getConnection();

    try {
      // SQLite-compatible schema (modified from PostgreSQL version)
      await db.exec(`
        -- Trading Accounts
        CREATE TABLE IF NOT EXISTS trading_accounts (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          user_id TEXT NOT NULL UNIQUE,
          account_type TEXT CHECK (account_type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
          balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          initial_balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          total_equity DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          buying_power DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          unrealized_pnl DECIMAL(15,2) DEFAULT 0.00,
          realized_pnl DECIMAL(15,2) DEFAULT 0.00,
          total_trades INTEGER DEFAULT 0,
          winning_trades INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Trading Positions
        CREATE TABLE IF NOT EXISTS trading_positions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          symbol TEXT NOT NULL,
          side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL DEFAULT 'buy',
          quantity DECIMAL(15,8) NOT NULL,
          entry_price DECIMAL(15,8) NOT NULL,
          current_price DECIMAL(15,8),
          market_value DECIMAL(15,2),
          unrealized_pnl DECIMAL(15,2),
          strategy_used TEXT,
          confidence_score DECIMAL(3,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(account_id, symbol)
        );

        -- Trading Orders
        CREATE TABLE IF NOT EXISTS trading_orders (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          order_id TEXT UNIQUE NOT NULL,
          symbol TEXT NOT NULL,
          side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
          quantity DECIMAL(15,8) NOT NULL,
          price DECIMAL(15,8) NOT NULL,
          order_type TEXT CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')) NOT NULL DEFAULT 'market',
          status TEXT CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')) NOT NULL DEFAULT 'filled',
          filled_quantity DECIMAL(15,8) DEFAULT 0,
          filled_price DECIMAL(15,8),
          fees DECIMAL(15,2) DEFAULT 0,
          strategy_used TEXT,
          reasoning TEXT,
          ai_reasoning TEXT,
          confidence_score DECIMAL(3,2),
          realized_pnl DECIMAL(15,2) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          filled_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- AI Decisions
        CREATE TABLE IF NOT EXISTS ai_decisions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          decision_type TEXT NOT NULL,
          symbol TEXT,
          reasoning TEXT NOT NULL,
          market_data TEXT DEFAULT '{}',  -- JSON as TEXT in SQLite
          strategy_selected TEXT,
          confidence_score DECIMAL(3,2),
          action_taken TEXT,
          outcome TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Performance Metrics
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          starting_balance DECIMAL(15,2),
          ending_balance DECIMAL(15,2),
          daily_pnl DECIMAL(15,2),
          daily_return_pct DECIMAL(5,2),
          total_trades INTEGER DEFAULT 0,
          winning_trades INTEGER DEFAULT 0,
          max_drawdown DECIMAL(15,2),
          sharpe_ratio DECIMAL(5,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(account_id, date)
        );

        -- Market Data
        CREATE TABLE IF NOT EXISTS market_data (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          symbol TEXT NOT NULL,
          timeframe TEXT NOT NULL DEFAULT '1h',
          open_price DECIMAL(15,8),
          high_price DECIMAL(15,8),
          low_price DECIMAL(15,8),
          close_price DECIMAL(15,8),
          volume DECIMAL(20,8),
          timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(symbol, timeframe, timestamp)
        );

        -- Portfolio Snapshots
        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          total_value DECIMAL(15,2) NOT NULL,
          cash_balance DECIMAL(15,2) NOT NULL,
          positions_value DECIMAL(15,2) NOT NULL,
          unrealized_pnl DECIMAL(15,2) NOT NULL,
          realized_pnl DECIMAL(15,2) NOT NULL,
          total_return_pct DECIMAL(5,2),
          snapshot_data TEXT DEFAULT '{}',  -- JSON as TEXT in SQLite
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Risk Rules
        CREATE TABLE IF NOT EXISTS risk_rules (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          rule_name TEXT NOT NULL,
          rule_type TEXT CHECK (rule_type IN ('position_size', 'stop_loss', 'take_profit', 'max_drawdown', 'daily_loss')) NOT NULL,
          rule_value DECIMAL(10,4) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_trading_positions_account_symbol ON trading_positions(account_id, symbol);
        CREATE INDEX IF NOT EXISTS idx_trading_orders_account_created ON trading_orders(account_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_trading_orders_symbol ON trading_orders(symbol);
        CREATE INDEX IF NOT EXISTS idx_ai_decisions_account_created ON ai_decisions(account_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_account_date ON performance_metrics(account_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_account_created ON portfolio_snapshots(account_id, created_at DESC);
      `);

      console.log('✅ SQLite schema initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SQLite schema:', error);
      throw error;
    }
  }

  /**
   * Create demo trading account
   */
  async createDemoAccount(): Promise<void> {
    const db = await this.getConnection();

    try {
      await db.run(`
        INSERT OR REPLACE INTO trading_accounts 
        (user_id, account_type, balance, initial_balance, total_equity, buying_power)
        VALUES ('demo-user', 'paper', 50000.00, 50000.00, 50000.00, 50000.00)
      `);

      // Get the account ID for risk rules
      const account = await db.get(`
        SELECT id FROM trading_accounts WHERE user_id = 'demo-user'
      `);

      if (account) {
        // Insert default risk rules
        await db.run(`
          INSERT OR REPLACE INTO risk_rules (account_id, rule_name, rule_type, rule_value)
          VALUES (?, 'Max Position Size', 'position_size', 0.02)
        `, account.id);

        await db.run(`
          INSERT OR REPLACE INTO risk_rules (account_id, rule_name, rule_type, rule_value)
          VALUES (?, 'Stop Loss', 'stop_loss', 0.05)
        `, account.id);

        await db.run(`
          INSERT OR REPLACE INTO risk_rules (account_id, rule_name, rule_type, rule_value)
          VALUES (?, 'Take Profit', 'take_profit', 0.10)
        `, account.id);
      }

      console.log('✅ Demo trading account created successfully');
    } catch (error) {
      console.error('❌ Failed to create demo account:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query
   */
  async query(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getConnection();
    return await db.all(sql, params);
  }

  /**
   * Execute raw SQL command (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getConnection();
    return await db.run(sql, params);
  }

  /**
   * Get single record
   */
  async get(sql: string, params: any[] = []): Promise<any> {
    const db = await this.getConnection();
    return await db.get(sql, params);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('✅ SQLite database connection closed');
    }
  }

  /**
   * Backup database
   */
  async backup(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalBackupPath = backupPath || `./backups/sqlite_backup_${timestamp}.db`;
    
    try {
      await fs.mkdir(path.dirname(finalBackupPath), { recursive: true });
      await fs.copyFile(this.dbPath, finalBackupPath);
      console.log(`✅ Database backed up to: ${finalBackupPath}`);
      return finalBackupPath;
    } catch (error) {
      console.error('❌ Failed to backup database:', error);
      throw error;
    }
  }

  /**
   * Get database info
   */
  async getInfo(): Promise<any> {
    const db = await this.getConnection();
    
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const fileStats = await fs.stat(this.dbPath).catch(() => null);
    
    return {
      path: this.dbPath,
      tables: tables.map(t => t.name),
      size: fileStats ? `${(fileStats.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      created: fileStats?.birthtime,
      modified: fileStats?.mtime
    };
  }
}

/**
 * Database factory to choose between SQLite and PostgreSQL
 */
export class DatabaseFactory {
  static async createClient() {
    const dbType = process.env.DATABASE_TYPE || 'postgresql';
    
    if (dbType === 'sqlite') {
      const sqlite = SQLiteClient.getInstance();
      await sqlite.connect();
      await sqlite.initializeSchema();
      await sqlite.createDemoAccount();
      return sqlite;
    } else {
      // Return Supabase client
      const { createClient } = await import('./supabase-client');
      return createClient();
    }
  }
}

export default SQLiteClient;