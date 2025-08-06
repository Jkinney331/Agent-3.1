import crypto from 'crypto'

interface ApiCredentials {
  apiKey: string
  secretKey: string
}

interface BinanceAccountInfo {
  accountType: string
  balances: Array<{
    asset: string
    free: string
    locked: string
  }>
  permissions: string[]
}

// Demo credentials for testing
const DEMO_CREDENTIALS = {
  apiKey: 'demo_api_key',
  secretKey: 'demo_secret_key'
}

// Mock account info for demo
const DEMO_ACCOUNT_INFO: BinanceAccountInfo = {
  accountType: 'SPOT',
  balances: [
    { asset: 'USDT', free: '25430.50', locked: '0.00' },
    { asset: 'BTC', free: '0.25684', locked: '0.00' },
    { asset: 'ETH', free: '3.4567', locked: '0.00' },
    { asset: 'BNB', free: '12.45', locked: '0.00' },
  ],
  permissions: ['SPOT', 'MARGIN', 'FUTURES']
}

// Binance API base URL
const BINANCE_API_BASE = 'https://api.binance.com'

function isDemoCredentials(credentials: ApiCredentials): boolean {
  console.log('🔍 Checking if demo credentials:', {
    provided: { 
      apiKey: credentials.apiKey, 
      secretKey: credentials.secretKey?.substring(0, 5) + '...' 
    },
    expected: { 
      apiKey: DEMO_CREDENTIALS.apiKey, 
      secretKey: DEMO_CREDENTIALS.secretKey?.substring(0, 5) + '...' 
    },
    apiKeyMatch: credentials.apiKey === DEMO_CREDENTIALS.apiKey,
    secretKeyMatch: credentials.secretKey === DEMO_CREDENTIALS.secretKey
  });

  return credentials.apiKey === DEMO_CREDENTIALS.apiKey && 
         credentials.secretKey === DEMO_CREDENTIALS.secretKey
}

function createSignature(params: string, secretKey: string): string {
  return crypto
    .createHmac('sha256', secretKey)
    .update(params)
    .digest('hex')
}

export async function validateApiCredentials(
  credentials: ApiCredentials
): Promise<boolean> {
  console.log('🔍 Validating credentials:', { 
    apiKey: credentials.apiKey, 
    secretKey: credentials.secretKey?.substring(0, 5) + '...' 
  });

  // Allow demo credentials for testing
  if (isDemoCredentials(credentials)) {
    console.log('✅ Demo credentials detected - authentication successful')
    return true
  }

  console.log('❌ Not demo credentials, trying real API validation')

  try {
    const timestamp = Date.now()
    const params = `timestamp=${timestamp}`
    const signature = createSignature(params, credentials.secretKey)

    const url = `${BINANCE_API_BASE}/api/v3/account?${params}&signature=${signature}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const accountInfo: BinanceAccountInfo = await response.json()
      
      // Verify the account has trading permissions
      return accountInfo.permissions?.includes('SPOT') || 
             accountInfo.permissions?.includes('MARGIN') ||
             accountInfo.permissions?.includes('FUTURES')
    }

    return false
  } catch (error) {
    console.error('API credential validation failed:', error)
    return false
  }
}

export async function getBinanceAccountInfo(
  credentials: ApiCredentials
): Promise<BinanceAccountInfo | null> {
  // Return demo account info for demo credentials
  if (isDemoCredentials(credentials)) {
    console.log('✅ Returning demo account info')
    return DEMO_ACCOUNT_INFO
  }

  try {
    const timestamp = Date.now()
    const params = `timestamp=${timestamp}`
    const signature = createSignature(params, credentials.secretKey)

    const url = `${BINANCE_API_BASE}/api/v3/account?${params}&signature=${signature}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return await response.json()
    }

    throw new Error(`API request failed: ${response.status}`)
  } catch (error) {
    console.error('Failed to fetch account info:', error)
    return null
  }
}

export async function testBinanceConnection(
  credentials: ApiCredentials
): Promise<{
  success: boolean
  latency: number
  error?: string
}> {
  // Mock successful connection for demo credentials
  if (isDemoCredentials(credentials)) {
    return {
      success: true,
      latency: 45, // Mock low latency
      error: undefined,
    }
  }

  const startTime = Date.now()
  
  try {
    const timestamp = Date.now()
    const params = `timestamp=${timestamp}`
    const signature = createSignature(params, credentials.secretKey)

    const url = `${BINANCE_API_BASE}/api/v3/ping`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey,
      },
    })

    const latency = Date.now() - startTime

    return {
      success: response.ok,
      latency,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
} 