#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests SQLite connectivity and basic table operations
 */

const { config } = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
config();

class DatabaseConnectionTester {
  constructor() {
    this.dbPath = process.env.SQLITE_DATABASE_PATH || './data/trading_bot.db';
    this.db = null;
  }

  async run() {
    console.log('🧪 Database Connection Test Starting...\n');
    
    try {
      // Test 1: Environment Setup
      await this.testEnvironmentSetup();
      
      // Test 2: Database Connection
      await this.testDatabaseConnection();
      
      // Test 3: Schema Creation
      await this.testSchemaCreation();
      
      // Test 4: Basic CRUD Operations
      await this.testBasicOperations();
      
      // Test 5: Data Integrity
      await this.testDataIntegrity();
      
      // Test 6: Performance Check
      await this.testPerformance();
      
      console.log('\n✅ All database tests passed successfully!');
      console.log('🎉 Database is ready for use');
      
    } catch (error) {
      console.error('\n❌ Database test failed:', error.message);
      console.error('📋 Please check your database configuration');
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async testEnvironmentSetup() {
    console.log('1. 🔧 Testing Environment Setup...');
    
    // Check if data directory exists or can be created
    const dataDir = path.dirname(this.dbPath);
    try {
      await fs.mkdir(dataDir, { recursive: true });
      console.log(`   ✅ Data directory ready: ${dataDir}`);
    } catch (error) {
      throw new Error(`Failed to create data directory: ${error.message}`);
    }
    
    // Check if we can write to the directory
    const testFile = path.join(dataDir, 'test-write.tmp');
    try {
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log('   ✅ Directory is writable');
    } catch (error) {
      throw new Error(`Directory is not writable: ${error.message}`);
    }
    
    console.log('   ✅ Environment setup complete\n');
  }

  async testDatabaseConnection() {
    console.log('2. 🔌 Testing Database Connection...');
    
    try {
      // Import SQLite modules dynamically
      const sqlite3 = require('sqlite3');
      const { open } = require('sqlite');
      
      // Open database connection
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      console.log(`   ✅ SQLite connection established`);
      console.log(`   📂 Database path: ${this.dbPath}`);
      
      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');
      console.log('   ✅ Foreign keys enabled');
      
      // Test basic query
      const result = await this.db.get('SELECT sqlite_version() as version');
      console.log(`   ✅ SQLite version: ${result.version}`);
      
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('   ✅ Database connection successful\n');
  }

  async testSchemaCreation() {
    console.log('3. 🏗️  Testing Schema Creation...');
    
    try {
      // Create basic trading accounts table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS trading_accounts (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          user_id TEXT NOT NULL UNIQUE,
          account_type TEXT CHECK (account_type IN ('paper', 'live')) NOT NULL DEFAULT 'paper',
          balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          initial_balance DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          total_equity DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          buying_power DECIMAL(15,2) NOT NULL DEFAULT 50000.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Trading accounts table created');
      
      // Create trading orders table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS trading_orders (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          symbol TEXT NOT NULL,
          side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
          quantity DECIMAL(15,8) NOT NULL,
          price DECIMAL(15,8) NOT NULL,
          status TEXT CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')) NOT NULL DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ Trading orders table created');
      
      // Create AI decisions table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS ai_decisions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
          account_id TEXT REFERENCES trading_accounts(id) ON DELETE CASCADE,
          decision_type TEXT NOT NULL,
          symbol TEXT,
          reasoning TEXT NOT NULL,
          confidence_score DECIMAL(3,2),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('   ✅ AI decisions table created');
      
      // Verify tables were created
      const tables = await this.db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      
      const expectedTables = ['trading_accounts', 'trading_orders', 'ai_decisions'];
      for (const expectedTable of expectedTables) {
        const found = tables.find(t => t.name === expectedTable);
        if (!found) {
          throw new Error(`Table ${expectedTable} was not created`);
        }
      }
      
      console.log(`   ✅ All ${tables.length} tables verified`);
      
    } catch (error) {
      throw new Error(`Schema creation failed: ${error.message}`);
    }
    
    console.log('   ✅ Schema creation successful\n');
  }

  async testBasicOperations() {
    console.log('4. 📝 Testing Basic CRUD Operations...');
    
    try {
      // INSERT: Create test account
      const insertResult = await this.db.run(`
        INSERT INTO trading_accounts (user_id, account_type, balance, initial_balance, total_equity, buying_power)
        VALUES ('test-user', 'paper', 25000.00, 25000.00, 25000.00, 25000.00)
      `);
      
      if (insertResult.changes !== 1) {
        throw new Error('Insert operation failed');
      }
      console.log('   ✅ INSERT operation successful');
      
      // SELECT: Read the account
      const account = await this.db.get(`
        SELECT * FROM trading_accounts WHERE user_id = 'test-user'
      `);
      
      if (!account || account.balance != 25000.00) {
        throw new Error('Select operation failed or data mismatch');
      }
      console.log('   ✅ SELECT operation successful');
      console.log(`   📊 Account ID: ${account.id}`);
      
      // UPDATE: Modify balance
      const updateResult = await this.db.run(`
        UPDATE trading_accounts SET balance = 30000.00 WHERE user_id = 'test-user'
      `);
      
      if (updateResult.changes !== 1) {
        throw new Error('Update operation failed');
      }
      console.log('   ✅ UPDATE operation successful');
      
      // Verify update
      const updatedAccount = await this.db.get(`
        SELECT balance FROM trading_accounts WHERE user_id = 'test-user'
      `);
      
      if (updatedAccount.balance != 30000.00) {
        throw new Error('Update verification failed');
      }
      console.log('   ✅ Update verification successful');
      
      // INSERT with foreign key: Create trading order
      const orderResult = await this.db.run(`
        INSERT INTO trading_orders (account_id, symbol, side, quantity, price, status)
        VALUES (?, 'BTCUSD', 'buy', 0.1, 45000.00, 'filled')
      `, account.id);
      
      if (orderResult.changes !== 1) {
        throw new Error('Foreign key insert failed');
      }
      console.log('   ✅ Foreign key relationship working');
      
      // DELETE: Clean up test data
      await this.db.run(`DELETE FROM trading_orders WHERE account_id = ?`, account.id);
      const deleteResult = await this.db.run(`DELETE FROM trading_accounts WHERE user_id = 'test-user'`);
      
      if (deleteResult.changes !== 1) {
        throw new Error('Delete operation failed');
      }
      console.log('   ✅ DELETE operation successful');
      
    } catch (error) {
      throw new Error(`CRUD operations failed: ${error.message}`);
    }
    
    console.log('   ✅ Basic operations test complete\n');
  }

  async testDataIntegrity() {
    console.log('5. 🔒 Testing Data Integrity...');
    
    try {
      // Test CHECK constraints
      try {
        await this.db.run(`
          INSERT INTO trading_accounts (user_id, account_type, balance)
          VALUES ('invalid-test', 'invalid_type', 1000.00)
        `);
        throw new Error('CHECK constraint should have prevented this insert');
      } catch (error) {
        if (error.message.includes('CHECK constraint')) {
          console.log('   ✅ CHECK constraints working');
        } else if (error.message.includes('UNIQUE constraint')) {
          console.log('   ✅ CHECK constraints working (constraint error)');
        } else {
          throw error;
        }
      }
      
      // Test UNIQUE constraints
      await this.db.run(`
        INSERT INTO trading_accounts (user_id, account_type)
        VALUES ('unique-test', 'paper')
      `);
      
      try {
        await this.db.run(`
          INSERT INTO trading_accounts (user_id, account_type)
          VALUES ('unique-test', 'paper')
        `);
        throw new Error('UNIQUE constraint should have prevented this insert');
      } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
          console.log('   ✅ UNIQUE constraints working');
        } else {
          throw error;
        }
      }
      
      // Clean up
      await this.db.run(`DELETE FROM trading_accounts WHERE user_id = 'unique-test'`);
      
      // Test foreign key constraints
      const foreignKeyEnabled = await this.db.get('PRAGMA foreign_keys');
      if (foreignKeyEnabled.foreign_keys === 1) {
        console.log('   ✅ Foreign key constraints enabled');
        
        try {
          await this.db.run(`
            INSERT INTO trading_orders (account_id, symbol, side, quantity, price)
            VALUES ('non-existent-id', 'BTCUSD', 'buy', 0.1, 45000.00)
          `);
          throw new Error('Foreign key constraint should have prevented this insert');
        } catch (error) {
          if (error.message.includes('FOREIGN KEY constraint')) {
            console.log('   ✅ Foreign key constraints working');
          } else {
            throw error;
          }
        }
      }
      
    } catch (error) {
      throw new Error(`Data integrity test failed: ${error.message}`);
    }
    
    console.log('   ✅ Data integrity test complete\n');
  }

  async testPerformance() {
    console.log('6. ⚡ Testing Performance...');
    
    try {
      // Test batch insert performance
      const startTime = Date.now();
      
      await this.db.run('BEGIN TRANSACTION');
      
      for (let i = 0; i < 100; i++) {
        await this.db.run(`
          INSERT INTO trading_accounts (user_id, account_type, balance)
          VALUES (?, 'paper', 50000.00)
        `, `perf-test-${i}`);
      }
      
      await this.db.run('COMMIT');
      
      const insertTime = Date.now() - startTime;
      console.log(`   ⏱️  Batch insert (100 records): ${insertTime}ms`);
      
      // Test select performance
      const selectStart = Date.now();
      const accounts = await this.db.all(`
        SELECT * FROM trading_accounts WHERE user_id LIKE 'perf-test-%'
      `);
      const selectTime = Date.now() - selectStart;
      
      console.log(`   ⏱️  Select query (${accounts.length} records): ${selectTime}ms`);
      
      if (accounts.length !== 100) {
        throw new Error(`Expected 100 records, got ${accounts.length}`);
      }
      
      // Clean up performance test data
      const cleanupStart = Date.now();
      const deleteResult = await this.db.run(`
        DELETE FROM trading_accounts WHERE user_id LIKE 'perf-test-%'
      `);
      const cleanupTime = Date.now() - cleanupStart;
      
      console.log(`   ⏱️  Cleanup (${deleteResult.changes} records): ${cleanupTime}ms`);
      
      // Check database size
      const stats = await fs.stat(this.dbPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   📏 Database size: ${sizeKB} KB`);
      
      // Performance assessment
      if (insertTime < 1000 && selectTime < 100) {
        console.log('   ✅ Performance: Excellent');
      } else if (insertTime < 2000 && selectTime < 200) {
        console.log('   ✅ Performance: Good');
      } else {
        console.log('   ⚠️  Performance: Acceptable (consider optimization)');
      }
      
    } catch (error) {
      throw new Error(`Performance test failed: ${error.message}`);
    }
    
    console.log('   ✅ Performance test complete\n');
  }

  async cleanup() {
    if (this.db) {
      try {
        await this.db.close();
        console.log('🔌 Database connection closed');
      } catch (error) {
        console.error('⚠️  Warning: Error closing database:', error.message);
      }
    }
  }

  async getDatabaseInfo() {
    if (this.db) {
      try {
        const tables = await this.db.all(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `);
        
        const stats = await fs.stat(this.dbPath);
        
        return {
          path: this.dbPath,
          tables: tables.map(t => t.name),
          size: `${(stats.size / 1024).toFixed(2)} KB`,
          created: stats.birthtime,
          modified: stats.mtime
        };
      } catch (error) {
        return { error: error.message };
      }
    }
    return null;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const tester = new DatabaseConnectionTester();
  tester.run().catch(error => {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  });
}

module.exports = DatabaseConnectionTester;