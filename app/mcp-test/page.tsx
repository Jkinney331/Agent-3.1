'use client';

import React, { useState, useEffect } from 'react';

interface TestResult {
  test: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  responseTime?: number;
}

export default function MCPTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const tests = [
    {
      name: '🪙 Bitcoin Price (CoinGecko)',
      endpoint: '/api/crypto?action=price&symbol=bitcoin',
      description: 'Real-time Bitcoin price from CoinGecko API'
    },
    {
      name: '📈 Trending Coins (CoinGecko)',
      endpoint: '/api/crypto?action=trending',
      description: 'Top 15 trending cryptocurrencies'
    },
    {
      name: '😨 Fear & Greed Index',
      endpoint: '/api/crypto?action=fear-greed',
      description: 'Market sentiment indicator (0-100)'
    },
    {
      name: '🚀 Top Gainers (24h)',
      endpoint: '/api/crypto?action=gainers&limit=10',
      description: 'Top performing cryptocurrencies in 24h'
    },
    {
      name: '💰 Ethereum Price',
      endpoint: '/api/crypto?action=price&symbol=ethereum',
      description: 'Real-time Ethereum price data'
    },
    {
      name: '🌐 Global Market Data',
      endpoint: '/api/crypto?action=global',
      description: 'Total market cap and volume statistics'
    },
    {
      name: '📊 Solana Price',
      endpoint: '/api/crypto?action=price&symbol=solana',
      description: 'Real-time Solana price information'
    },
    {
      name: '📈 Stock Quote (Alpha Vantage)',
      endpoint: '/api/alpha-vantage?action=stock-quote&symbol=TSLA',
      description: 'Tesla stock quote from Alpha Vantage'
    },
    {
      name: '🔸 Binance BTC Price',
      endpoint: '/api/crypto?action=binance-price&symbol=BTCUSDT',
      description: 'Real-time Bitcoin price from Binance exchange'
    },
    {
      name: '📊 Binance 24hr Stats',
      endpoint: '/api/crypto?action=binance-24hr&symbol=BTCUSDT',
      description: 'Binance 24-hour price statistics'
    },
    {
      name: '🦬 Alpaca Account Info',
      endpoint: '/api/trading/positions?action=account',
      description: 'Alpaca trading account information'
    },
    {
      name: '📈 Alpaca Positions',
      endpoint: '/api/trading/positions?action=positions',
      description: 'Current trading positions in Alpaca'
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setResults([]);

    const testResults: TestResult[] = [];

    for (const test of tests) {
      const startTime = Date.now();
      const testResult: TestResult = {
        test: test.name,
        status: 'loading'
      };
      
      setResults(prev => [...prev, testResult]);

      try {
        const response = await fetch(test.endpoint);
        const data = await response.json();
        const responseTime = Date.now() - startTime;

        if (response.ok) {
          testResult.status = 'success';
          testResult.data = data;
          testResult.responseTime = responseTime;
        } else {
          testResult.status = 'error';
          testResult.error = data.error || 'Unknown error';
          testResult.responseTime = responseTime;
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        testResult.status = 'error';
        testResult.error = error instanceof Error ? error.message : 'Network error';
        testResult.responseTime = responseTime;
      }

      setResults(prev => prev.map((r, i) => i === testResults.length ? testResult : r));
      testResults.push(testResult);

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);
    setOverallStatus('completed');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>;
      case 'success': return <span className="text-green-500 text-xl">✅</span>;
      case 'error': return <span className="text-red-500 text-xl">❌</span>;
      default: return <span className="text-gray-400 text-xl">⏳</span>;
    }
  };

  const formatData = (data: any, testName: string) => {
    if (!data) return 'No data';

    try {
      if (testName.includes('Price')) {
        return `$${data.price?.toLocaleString()} (${data.change24h?.toFixed(2)}% 24h)`;
      } else if (testName.includes('Fear & Greed')) {
        return `${data.value}/100 (${data.value_classification})`;
      } else if (testName.includes('Trending')) {
        return `${data.length} trending coins`;
      } else if (testName.includes('Gainers')) {
        return `${data.length} gainers found`;
      } else if (testName.includes('Global')) {
        return `$${(data.data?.total_market_cap?.usd / 1e12)?.toFixed(2)}T market cap`;
      } else if (testName.includes('Stock Quote')) {
        return `$${data['05. price']} (${data['09. change']}%)`;
      }
      
      if (Array.isArray(data)) {
        return `Array with ${data.length} items`;
      }
      
      return Object.keys(data).length > 3 ? 'Complex object ✓' : JSON.stringify(data).slice(0, 100);
    } catch {
      return 'Data received ✓';
    }
  };

  const successfulTests = results.filter(r => r.status === 'success').length;
  const failedTests = results.filter(r => r.status === 'error').length;
  const avgResponseTime = results.filter(r => r.responseTime).reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.filter(r => r.responseTime).length;

  useEffect(() => {
    // Auto-run tests on page load
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Integration Test Suite
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Testing real-time cryptocurrency and financial data APIs
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                <div className="text-sm text-gray-500">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{successfulTests}</div>
                <div className="text-sm text-gray-500">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {avgResponseTime ? `${avgResponseTime.toFixed(0)}ms` : '-'}
                </div>
                <div className="text-sm text-gray-500">Avg Response</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="text-center mb-8">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => {
            const result = results[index];
            return (
              <div key={test.name} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result?.status || 'idle')}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                        <p className="text-sm text-gray-500">{test.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result?.responseTime && (
                        <div className="text-sm text-gray-500">{result.responseTime}ms</div>
                      )}
                      <div className="text-xs text-gray-400">{test.endpoint}</div>
                    </div>
                  </div>
                  
                  {result?.status === 'success' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-1">Response:</div>
                      <div className="text-sm text-green-700">{formatData(result.data, test.name)}</div>
                    </div>
                  )}
                  
                  {result?.status === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-red-800 mb-1">Error:</div>
                      <div className="text-sm text-red-700">{result.error}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Message */}
        {overallStatus === 'completed' && successfulTests === tests.length && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-green-600 text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">All Tests Passed!</h2>
            <p className="text-green-700">
              Your MCP integration is working perfectly. All {successfulTests} API endpoints are responding correctly.
            </p>
            <div className="mt-4">
              <a href="/dashboard" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Go to Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 