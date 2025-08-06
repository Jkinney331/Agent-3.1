#!/usr/bin/env node

/**
 * Local Database Setup Script
 * Sets up either SQLite or PostgreSQL database for local development
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Setting up local database...');
  
  const dbType = process.env.DATABASE_TYPE || 'postgresql';
  
  try {
    if (dbType === 'sqlite') {
      await setupSQLite();
    } else {
      await setupPostgreSQL();
    }
    
    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function setupSQLite() {
  console.log('📱 Setting up SQLite database...');
  
  // Import SQLite client dynamically
  const { SQLiteClient } = await import('../lib/database/sqlite-client.js');
  
  const client = SQLiteClient.getInstance();
  await client.connect();
  await client.initializeSchema();
  await client.createDemoAccount();
  
  console.log('✅ SQLite database initialized');
  
  // Create backup directory
  await fs.mkdir('./backups', { recursive: true });
  console.log('📁 Backup directory created');
}

async function setupPostgreSQL() {
  console.log('🐘 Setting up PostgreSQL database...');
  
  // Check if running in Docker or local PostgreSQL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️  No DATABASE_URL found. Using Supabase configuration...');
    
    // Use Supabase client
    const { createClient } = await import('../lib/database/supabase-client.js');
    const supabase = createClient();
    
    // Test connection
    const { data, error } = await supabase
      .from('trading_accounts')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is OK
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection verified');
    return;
  }
  
  // Set up local PostgreSQL
  const { Client } = await import('pg');
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    console.log('🔗 Connected to PostgreSQL');
    
    // Run schema migration
    const schemaPath = path.join(__dirname, '../database/complete-trading-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    await client.query(schema);
    console.log('✅ Database schema applied');
    
  } finally {
    await client.end();
  }
}

async function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  const dbType = process.env.DATABASE_TYPE || 'postgresql';
  
  if (dbType === 'sqlite') {
    try {
      await import('sqlite3');
      await import('sqlite');
    } catch (error) {
      console.error('❌ SQLite dependencies not found. Run: npm install sqlite3 sqlite');
      process.exit(1);
    }
  } else {
    try {
      await import('pg');
    } catch (error) {
      console.error('❌ PostgreSQL dependencies not found. Run: npm install pg');
      process.exit(1);
    }
  }
  
  console.log('✅ All dependencies found');
}

async function createDirectories() {
  console.log('📁 Creating necessary directories...');
  
  const dirs = [
    './data',
    './logs',
    './backups',
    './config'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
    console.log(`  ✓ ${dir}`);
  }
}

async function validateEnvironment() {
  console.log('🔧 Validating environment configuration...');
  
  const requiredVars = [
    'NODE_ENV'
  ];
  
  const dbType = process.env.DATABASE_TYPE || 'postgresql';
  
  if (dbType === 'sqlite') {
    requiredVars.push('SQLITE_DATABASE_PATH');
  } else {
    if (!process.env.DATABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Either DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set');
    }
  }
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:', missing.join(', '));
    console.log('💡 Copy .env.example to .env.local and configure your settings');
  } else {
    console.log('✅ Environment validation passed');
  }
}

// Main execution
async function main() {
  try {
    await validateEnvironment();
    await checkDependencies();
    await createDirectories();
    await setupDatabase();
    
    console.log('\n🎉 Local database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   • Run: npm run db:seed (to add test data)');
    console.log('   • Run: npm run dev (to start development server)');
    console.log('   • Run: npm run test:local (to test the setup)');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check your .env.local file');
    console.log('   • Ensure database dependencies are installed');
    console.log('   • Check database connection settings');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupDatabase, setupSQLite, setupPostgreSQL };