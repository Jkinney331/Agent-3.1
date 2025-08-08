/**
 * Setup script to configure environment for database fallback testing
 * This ensures that invalid Supabase credentials trigger the fallback mechanism
 */

const fs = require('fs')
const path = require('path')

function setupFallbackTest() {
  console.log('⚙️  Setting up Database Fallback Test Environment\n')
  
  const envLocalPath = path.join(process.cwd(), '.env.local')
  const envPath = path.join(process.cwd(), '.env')
  
  // Create a test environment file that will trigger fallback mode
  const testEnvContent = `# Database Fallback Test Configuration
# These invalid values will trigger in-memory storage fallback

# Invalid Supabase configuration (triggers fallback)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database type (will fallback to in-memory)
DATABASE_TYPE=postgresql

# Trading configuration
TRADING_MODE=paper
INITIAL_BALANCE=50000
MAX_POSITIONS=5
RISK_PER_TRADE=0.02
STOP_LOSS_PERCENT=0.05
TAKE_PROFIT_PERCENT=0.10

# Environment settings
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Feature flags for testing
ENABLE_PAPER_TRADING=true
ENABLE_LIVE_TRADING=false
`

  try {
    // Write the test environment file
    fs.writeFileSync(envLocalPath, testEnvContent)
    console.log('✅ Created .env.local with fallback test configuration')
    
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log('ℹ️  Existing .env file found - it will be used as backup')
    }
    
    console.log('\n📋 Test Environment Configuration:')
    console.log('   - Supabase URL: Invalid (triggers fallback)')
    console.log('   - Supabase Keys: Invalid (triggers fallback)')
    console.log('   - Storage Mode: Will use in-memory storage')
    console.log('   - Paper Trading: Enabled')
    console.log('   - Initial Balance: $50,000')
    
    console.log('\n🚀 To run the fallback test:')
    console.log('   1. Start the Next.js server: npm run dev')
    console.log('   2. Run the test script: node scripts/test-database-connection.js')
    console.log('   3. Or test via browser: http://localhost:3000/api/trading/enhanced-paper-trading')
    
    console.log('\n🔄 To restore normal database connection:')
    console.log('   1. Delete .env.local: rm .env.local')
    console.log('   2. Configure proper Supabase credentials in .env.local')
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error.message)
    process.exit(1)
  }
}

function restoreNormalMode() {
  console.log('🔄 Restoring Normal Database Mode\n')
  
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  try {
    if (fs.existsSync(envLocalPath)) {
      fs.unlinkSync(envLocalPath)
      console.log('✅ Removed fallback test .env.local file')
    } else {
      console.log('ℹ️  No .env.local file found to remove')
    }
    
    console.log('\n📋 Next Steps:')
    console.log('   1. Create a new .env.local with proper Supabase credentials')
    console.log('   2. Use the template from .env.example')
    console.log('   3. Get Supabase credentials from your Supabase dashboard')
    
  } catch (error) {
    console.error('❌ Failed to restore normal mode:', error.message)
  }
}

// Command line handling
const command = process.argv[2]

if (command === 'restore') {
  restoreNormalMode()
} else {
  setupFallbackTest()
}

module.exports = { setupFallbackTest, restoreNormalMode }