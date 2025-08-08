/**
 * Simple test to verify database connection and fallback mechanisms
 * This script makes a direct HTTP request to test the API endpoints
 */

const http = require('http')
const https = require('https')

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 || options.protocol === 'https:' ? https : http
    const req = protocol.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData)
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })
    
    req.on('error', (err) => {
      reject(err)
    })
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection and Fallback\n')
  
  const baseUrl = 'localhost'
  const port = 3000
  
  try {
    // Test the enhanced paper trading endpoint
    console.log('📡 Testing enhanced paper trading endpoint...')
    
    const testPayload = {
      userId: 'test-user-database-fallback',
      action: 'initialize'
    }
    
    const options = {
      hostname: baseUrl,
      port: port,
      path: '/api/trading/enhanced-paper-trading',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(testPayload))
      }
    }
    
    const response = await makeRequest(options, testPayload)
    
    if (response.status === 200) {
      console.log('✅ API endpoint is working')
      console.log('📊 Response data:', response.data)
      
      if (response.data.account) {
        console.log(`   Account ID: ${response.data.account.id}`)
        console.log(`   Balance: $${response.data.account.balance}`)
        console.log(`   Storage mode: ${response.data.storageMode || 'unknown'}`)
      }
    } else {
      console.log(`❌ API endpoint failed with status: ${response.status}`)
      console.log('Error:', response.data)
    }
    
    // Test a simple trade execution
    console.log('\n🔄 Testing trade execution...')
    
    const tradePayload = {
      userId: 'test-user-database-fallback',
      action: 'execute_order',
      order: {
        symbol: 'AAPL',
        side: 'buy',
        quantity: 1,
        strategy: 'Database Fallback Test',
        reasoning: 'Testing database connection and fallback mechanisms',
        confidence: 0.8
      }
    }
    
    const tradeOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(tradePayload))
      }
    }
    
    const tradeResponse = await makeRequest(tradeOptions, tradePayload)
    
    if (tradeResponse.status === 200) {
      console.log('✅ Trade execution test completed')
      console.log('📊 Trade result:', tradeResponse.data)
    } else {
      console.log(`❌ Trade execution failed with status: ${tradeResponse.status}`)
      console.log('Error:', tradeResponse.data)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Note: Make sure the Next.js development server is running with:')
      console.log('   npm run dev')
      console.log('   or')
      console.log('   yarn dev')
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n🏁 Database connection test completed')
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error)
    })
}

module.exports = { testDatabaseConnection }