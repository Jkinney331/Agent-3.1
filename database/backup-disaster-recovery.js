#!/usr/bin/env node

/**
 * Backup and Disaster Recovery Script for AI Crypto Trading Bot
 * 
 * This script handles:
 * - Automated daily backups
 * - Point-in-time recovery
 * - Data integrity verification
 * - Disaster recovery procedures
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://sjtulkkhxojiitpjhgrt.supabase.co',
  serviceRole: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdHVsa2toeG9qaWl0cGpoZ3J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzkwODE5OCwiZXhwIjoyMDY5NDg0MTk4fQ.iVHnkGkU4qSwIZQakR46Z2WXN76ctwk3zo0w0hmMWWE'
};

// Backup Configuration
const BACKUP_CONFIG = {
  retentionDays: 30,
  backupPath: './backups',
  compressionEnabled: true,
  incrementalBackup: false
};

// Tables to backup
const CRITICAL_TABLES = [
  'trading_accounts',
  'trading_positions', 
  'trading_orders',
  'ai_decisions',
  'performance_metrics',
  'risk_rules'
];

const SUPPLEMENTARY_TABLES = [
  'market_data',
  'portfolio_snapshots'
];

class DatabaseBackupManager {
  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRole);
    this.backupPath = BACKUP_CONFIG.backupPath;
    this.backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async initialize() {
    // Ensure backup directory exists
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
      console.log(`📁 Backup directory ready: ${this.backupPath}`);
    } catch (error) {
      console.error('❌ Failed to create backup directory:', error.message);
      throw error;
    }
  }

  /**
   * Perform full database backup
   */
  async performFullBackup() {
    console.log('🔄 Starting full database backup...');
    
    const backupData = {
      timestamp: this.backupTimestamp,
      version: '1.0',
      type: 'full_backup',
      tables: {}
    };

    try {
      // Backup critical tables first
      for (const table of CRITICAL_TABLES) {
        console.log(`  📊 Backing up ${table}...`);
        backupData.tables[table] = await this.backupTable(table);
      }

      // Backup supplementary tables
      for (const table of SUPPLEMENTARY_TABLES) {
        console.log(`  📈 Backing up ${table} (with limit)...`);
        backupData.tables[table] = await this.backupTable(table, 10000); // Limit large tables
      }

      // Save backup to file
      const backupFilename = `backup-full-${this.backupTimestamp}.json`;
      const backupFilePath = path.join(this.backupPath, backupFilename);
      
      await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Full backup completed: ${backupFilename}`);
      console.log(`📊 Backup summary:`);
      
      for (const [table, data] of Object.entries(backupData.tables)) {
        console.log(`  - ${table}: ${data.length} records`);
      }

      return backupFilePath;
    } catch (error) {
      console.error('❌ Full backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Perform incremental backup (last 24 hours)
   */
  async performIncrementalBackup() {
    console.log('🔄 Starting incremental backup (last 24 hours)...');
    
    const backupData = {
      timestamp: this.backupTimestamp,
      version: '1.0',
      type: 'incremental_backup',
      since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      tables: {}
    };

    try {
      const since = backupData.since;
      
      // Backup only recent changes
      backupData.tables.trading_orders = await this.backupTableSince('trading_orders', 'created_at', since);
      backupData.tables.trading_positions = await this.backupTableSince('trading_positions', 'updated_at', since);
      backupData.tables.ai_decisions = await this.backupTableSince('ai_decisions', 'created_at', since);
      backupData.tables.performance_metrics = await this.backupTableSince('performance_metrics', 'created_at', since);
      backupData.tables.portfolio_snapshots = await this.backupTableSince('portfolio_snapshots', 'created_at', since);

      const backupFilename = `backup-incremental-${this.backupTimestamp}.json`;
      const backupFilePath = path.join(this.backupPath, backupFilename);
      
      await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ Incremental backup completed: ${backupFilename}`);
      console.log(`📊 Changes since ${since}:`);
      
      for (const [table, data] of Object.entries(backupData.tables)) {
        console.log(`  - ${table}: ${data.length} changes`);
      }

      return backupFilePath;
    } catch (error) {
      console.error('❌ Incremental backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Backup a single table
   */
  async backupTable(tableName, limit = null) {
    try {
      let query = this.supabase.from(tableName).select('*');
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to backup ${tableName}: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`❌ Failed to backup table ${tableName}:`, error.message);
      return [];
    }
  }

  /**
   * Backup table records since a specific timestamp
   */
  async backupTableSince(tableName, timestampColumn, since) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .gte(timestampColumn, since)
        .order(timestampColumn, { ascending: false });
      
      if (error) {
        throw new Error(`Failed to backup ${tableName} since ${since}: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error(`❌ Failed to backup table ${tableName} since ${since}:`, error.message);
      return [];
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupFilePath) {
    console.log(`🔍 Verifying backup integrity: ${path.basename(backupFilePath)}`);
    
    try {
      const backupData = JSON.parse(await fs.readFile(backupFilePath, 'utf8'));
      const verification = {
        timestamp: new Date().toISOString(),
        backupFile: path.basename(backupFilePath),
        backupTimestamp: backupData.timestamp,
        verification: 'PASSED',
        issues: [],
        summary: {}
      };

      // Verify structure
      if (!backupData.tables || typeof backupData.tables !== 'object') {
        verification.issues.push('Invalid backup structure: missing tables');
        verification.verification = 'FAILED';
      }

      // Verify each table
      for (const [tableName, tableData] of Object.entries(backupData.tables)) {
        const tableVerification = await this.verifyTableBackup(tableName, tableData);
        verification.summary[tableName] = tableVerification;
        
        if (!tableVerification.valid) {
          verification.issues.push(`Table ${tableName}: ${tableVerification.issues.join(', ')}`);
          verification.verification = 'FAILED';
        }
      }

      console.log(`${verification.verification === 'PASSED' ? '✅' : '❌'} Backup verification ${verification.verification.toLowerCase()}`);
      
      if (verification.issues.length > 0) {
        console.log('🚨 Issues found:');
        verification.issues.forEach(issue => console.log(`  - ${issue}`));
      }

      return verification;
    } catch (error) {
      console.error('❌ Backup verification failed:', error.message);
      return {
        verification: 'FAILED',
        error: error.message
      };
    }
  }

  /**
   * Verify individual table backup
   */
  async verifyTableBackup(tableName, tableData) {
    const verification = {
      tableName,
      recordCount: tableData.length,
      valid: true,
      issues: []
    };

    if (!Array.isArray(tableData)) {
      verification.valid = false;
      verification.issues.push('Data is not an array');
      return verification;
    }

    // Verify data structure for critical tables
    if (CRITICAL_TABLES.includes(tableName)) {
      // Check for required fields based on table
      const requiredFields = this.getRequiredFields(tableName);
      
      for (const record of tableData.slice(0, 10)) { // Sample first 10 records
        for (const field of requiredFields) {
          if (!(field in record)) {
            verification.valid = false;
            verification.issues.push(`Missing required field: ${field}`);
            break;
          }
        }
        if (!verification.valid) break;
      }
    }

    return verification;
  }

  /**
   * Get required fields for table validation
   */
  getRequiredFields(tableName) {
    const requiredFields = {
      trading_accounts: ['id', 'user_id', 'balance', 'account_type'],
      trading_positions: ['id', 'account_id', 'symbol', 'quantity'],
      trading_orders: ['id', 'account_id', 'symbol', 'side', 'quantity', 'price'],
      ai_decisions: ['id', 'account_id', 'decision_type', 'reasoning'],
      performance_metrics: ['id', 'account_id', 'date'],
      risk_rules: ['id', 'account_id', 'rule_name', 'rule_type']
    };

    return requiredFields[tableName] || ['id'];
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupFilePath, options = {}) {
    console.log(`🔄 Starting restore from backup: ${path.basename(backupFilePath)}`);
    
    const { dryRun = false, tablesToRestore = null } = options;
    
    try {
      const backupData = JSON.parse(await fs.readFile(backupFilePath, 'utf8'));
      const restoreReport = {
        timestamp: new Date().toISOString(),
        backupFile: path.basename(backupFilePath),
        dryRun,
        status: 'SUCCESS',
        tables: {}
      };

      if (dryRun) {
        console.log('🧪 DRY RUN MODE - No actual data changes will be made');
      }

      // Restore tables in dependency order
      const restoreOrder = ['trading_accounts', 'trading_positions', 'trading_orders', 'ai_decisions', 'performance_metrics', 'risk_rules', 'portfolio_snapshots'];
      
      for (const tableName of restoreOrder) {
        if (tablesToRestore && !tablesToRestore.includes(tableName)) continue;
        if (!backupData.tables[tableName]) continue;

        const tableData = backupData.tables[tableName];
        console.log(`  🔄 Restoring ${tableName} (${tableData.length} records)...`);

        if (!dryRun) {
          try {
            // For critical tables, we need to handle conflicts carefully
            if (CRITICAL_TABLES.includes(tableName)) {
              restoreReport.tables[tableName] = await this.restoreTableWithConflictResolution(tableName, tableData);
            } else {
              restoreReport.tables[tableName] = await this.restoreTable(tableName, tableData);
            }
          } catch (error) {
            restoreReport.tables[tableName] = { error: error.message, restored: 0 };
            restoreReport.status = 'PARTIAL';
            console.error(`❌ Failed to restore ${tableName}:`, error.message);
          }
        } else {
          restoreReport.tables[tableName] = { dryRun: true, wouldRestore: tableData.length };
          console.log(`  ✅ Would restore ${tableData.length} records to ${tableName}`);
        }
      }

      if (!dryRun) {
        console.log(`✅ Restore completed with status: ${restoreReport.status}`);
      } else {
        console.log('🧪 Dry run completed successfully');
      }

      return restoreReport;
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  /**
   * Restore table with conflict resolution
   */
  async restoreTableWithConflictResolution(tableName, tableData) {
    const result = { restored: 0, skipped: 0, errors: 0 };

    for (const record of tableData) {
      try {
        // Try to insert, if conflict occurs, update instead
        const { error } = await this.supabase
          .from(tableName)
          .upsert(record, { onConflict: 'id' });

        if (error) {
          result.errors++;
          console.warn(`⚠️ Error restoring record in ${tableName}:`, error.message);
        } else {
          result.restored++;
        }
      } catch (error) {
        result.errors++;
        console.warn(`⚠️ Unexpected error restoring record in ${tableName}:`, error.message);
      }
    }

    return result;
  }

  /**
   * Simple table restore
   */
  async restoreTable(tableName, tableData) {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .insert(tableData);

      if (error) {
        throw error;
      }

      return { restored: tableData.length };
    } catch (error) {
      throw new Error(`Failed to restore ${tableName}: ${error.message}`);
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);
      
      let deletedCount = 0;
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`  🗑️ Deleted old backup: ${file}`);
        }
      }
      
      console.log(`✅ Cleanup completed: ${deletedCount} old backups removed`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return 0;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.json'));
      
      const stats = {
        totalBackups: backupFiles.length,
        fullBackups: backupFiles.filter(f => f.includes('full')).length,
        incrementalBackups: backupFiles.filter(f => f.includes('incremental')).length,
        oldestBackup: null,
        newestBackup: null,
        totalSize: 0
      };

      if (backupFiles.length > 0) {
        const fileStats = await Promise.all(
          backupFiles.map(async file => {
            const filePath = path.join(this.backupPath, file);
            const stat = await fs.stat(filePath);
            return { file, mtime: stat.mtime, size: stat.size };
          })
        );

        fileStats.sort((a, b) => a.mtime - b.mtime);
        stats.oldestBackup = fileStats[0].file;
        stats.newestBackup = fileStats[fileStats.length - 1].file;
        stats.totalSize = fileStats.reduce((sum, stat) => sum + stat.size, 0);
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get backup stats:', error.message);
      return { error: error.message };
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const backupManager = new DatabaseBackupManager();
  await backupManager.initialize();

  try {
    switch (command) {
      case 'full-backup':
        await backupManager.performFullBackup();
        break;
        
      case 'incremental-backup':
        await backupManager.performIncrementalBackup();
        break;
        
      case 'verify':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('❌ Please specify backup file to verify');
          process.exit(1);
        }
        await backupManager.verifyBackup(backupFile);
        break;
        
      case 'restore':
        const restoreFile = args[1];
        const dryRun = args.includes('--dry-run');
        if (!restoreFile) {
          console.error('❌ Please specify backup file to restore from');
          process.exit(1);
        }
        await backupManager.restoreFromBackup(restoreFile, { dryRun });
        break;
        
      case 'cleanup':
        await backupManager.cleanupOldBackups();
        break;
        
      case 'stats':
        const stats = await backupManager.getBackupStats();
        console.log('📊 Backup Statistics:');
        console.log(JSON.stringify(stats, null, 2));
        break;
        
      case 'help':
      default:
        console.log(`
🛡️ Database Backup and Recovery Tool

Usage: node backup-disaster-recovery.js <command>

Commands:
  full-backup           Create a complete backup of all data
  incremental-backup    Create backup of changes in last 24 hours
  verify <file>         Verify backup integrity
  restore <file>        Restore from backup (add --dry-run for simulation)
  cleanup               Remove old backups (older than ${BACKUP_CONFIG.retentionDays} days)
  stats                 Show backup statistics
  help                  Show this help message

Examples:
  node backup-disaster-recovery.js full-backup
  node backup-disaster-recovery.js verify ./backups/backup-full-2024-08-08.json
  node backup-disaster-recovery.js restore ./backups/backup-full-2024-08-08.json --dry-run
        `);
        break;
    }
  } catch (error) {
    console.error('💥 Command failed:', error.message);
    process.exit(1);
  }
}

// Export for module usage or run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { DatabaseBackupManager };