'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity, 
  BarChart3,
  PieChart,
  RefreshCw,
  Calendar,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Award,
  Percent,
  Timer,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Enhanced TypeScript interfaces for advanced metrics
interface AdvancedPortfolioMetrics {
  overview: {
    totalValue: number;
    totalPnL: number;
    totalPnLPercentage: number;
    dayPnL: number;
    dayPnLPercentage: number;
    weekPnL: number;
    weekPnLPercentage: number;
    monthPnL: number;
    monthPnLPercentage: number;
    initialBalance: number;
    cashBalance: number;
    investedAmount: number;
  };
  
  performance: {
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownDate: Date;
    recoveryFactor: number;
    calmarRatio: number;
  };
  
  risk: {
    currentRisk: number;
    maxRisk: number;
    riskAdjustedReturn: number;
    valueAtRisk: number; // VaR 95%
    expectedShortfall: number; // ES 95%
    beta: number;
    alpha: number;
    volatility: number;
    correlationSPY: number;
    positionSizing: 'AGGRESSIVE' | 'MODERATE' | 'CONSERVATIVE';
  };
  
  health: {
    diversificationScore: number;
    concentrationRisk: number;
    liquidityScore: number;
    portfolioStability: number;
    riskParity: number;
    overallHealthScore: number;
    lastRebalance: Date;
    nextRebalance: Date;
    healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  };
  
  trades: {
    today: number;
    week: number;
    month: number;
    avgHoldingTime: number; // in hours
    avgTradeSize: number;
    largestWin: number;
    largestLoss: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  };
  
  allocation: {
    crypto: number;
    cash: number;
    bySymbol: Array<{
      symbol: string;
      percentage: number;
      value: number;
      risk: number;
      trend: 'UP' | 'DOWN' | 'FLAT';
    }>;
    byRisk: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

interface BenchmarkComparison {
  symbol: string;
  name: string;
  return1D: number;
  return7D: number;
  return30D: number;
  correlation: number;
}

interface PerformanceTimeframe {
  period: '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL';
  pnl: number;
  pnlPercentage: number;
  trades: number;
  winRate: number;
  sharpe: number;
  maxDrawdown: number;
}

export function EnhancedPortfolioMetrics() {
  const [metrics, setMetrics] = useState<AdvancedPortfolioMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison[]>([]);
  const [timeframes, setTimeframes] = useState<PerformanceTimeframe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL'>('30D');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'risk' | 'health' | 'allocation'>('overview');

  useEffect(() => {
    fetchAdvancedMetrics();
    
    // Set up real-time updates
    const interval = setInterval(fetchAdvancedMetrics, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchAdvancedMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock advanced portfolio metrics data
      // In production, these would be real API calls to advanced analytics endpoints

      const mockMetrics: AdvancedPortfolioMetrics = {
        overview: {
          totalValue: 52340,
          totalPnL: 2340,
          totalPnLPercentage: 4.68,
          dayPnL: 180,
          dayPnLPercentage: 0.34,
          weekPnL: 890,
          weekPnLPercentage: 1.73,
          monthPnL: 1560,
          monthPnLPercentage: 3.08,
          initialBalance: 50000,
          cashBalance: 8420,
          investedAmount: 43920
        },
        
        performance: {
          winRate: 67.3,
          totalTrades: 156,
          winningTrades: 105,
          losingTrades: 51,
          averageWin: 280,
          averageLoss: -145,
          profitFactor: 1.93,
          sharpeRatio: 1.42,
          maxDrawdown: -8.7,
          maxDrawdownDate: new Date(Date.now() - 15 * 86400000),
          recoveryFactor: 0.54,
          calmarRatio: 0.65
        },
        
        risk: {
          currentRisk: 15.2,
          maxRisk: 25.0,
          riskAdjustedReturn: 12.4,
          valueAtRisk: -1250, // 95% VaR
          expectedShortfall: -1890, // 95% ES
          beta: 0.87,
          alpha: 0.032,
          volatility: 18.5,
          correlationSPY: 0.45,
          positionSizing: 'MODERATE'
        },
        
        health: {
          diversificationScore: 78,
          concentrationRisk: 22,
          liquidityScore: 92,
          portfolioStability: 85,
          riskParity: 71,
          overallHealthScore: 82,
          lastRebalance: new Date(Date.now() - 7 * 86400000),
          nextRebalance: new Date(Date.now() + 7 * 86400000),
          healthStatus: 'GOOD'
        },
        
        trades: {
          today: 3,
          week: 12,
          month: 45,
          avgHoldingTime: 18.5,
          avgTradeSize: 1250,
          largestWin: 890,
          largestLoss: -420,
          consecutiveWins: 4,
          consecutiveLosses: 0,
          maxConsecutiveWins: 8,
          maxConsecutiveLosses: 3
        },
        
        allocation: {
          crypto: 84.3,
          cash: 15.7,
          bySymbol: [
            { symbol: 'BTC', percentage: 45.2, value: 23678, risk: 12.5, trend: 'UP' },
            { symbol: 'ETH', percentage: 28.7, value: 15015, risk: 15.8, trend: 'UP' },
            { symbol: 'SOL', percentage: 10.4, value: 5443, risk: 22.1, trend: 'DOWN' },
            { symbol: 'CASH', percentage: 15.7, value: 8204, risk: 0, trend: 'FLAT' }
          ],
          byRisk: {
            low: 35.2,
            medium: 42.1,
            high: 22.7
          }
        }
      };

      // Mock benchmark comparison data
      const mockBenchmarks: BenchmarkComparison[] = [
        {
          symbol: 'SPY',
          name: 'S&P 500',
          return1D: 0.15,
          return7D: 1.23,
          return30D: 2.45,
          correlation: 0.45
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          return1D: 0.89,
          return7D: 3.21,
          return30D: 8.76,
          correlation: 0.78
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          return1D: 1.12,
          return7D: 4.56,
          return30D: 12.34,
          correlation: 0.83
        }
      ];

      // Mock performance timeframes
      const mockTimeframes: PerformanceTimeframe[] = [
        { period: '1D', pnl: 180, pnlPercentage: 0.34, trades: 3, winRate: 66.7, sharpe: 1.2, maxDrawdown: -0.8 },
        { period: '7D', pnl: 890, pnlPercentage: 1.73, trades: 12, winRate: 75.0, sharpe: 1.5, maxDrawdown: -2.1 },
        { period: '30D', pnl: 1560, pnlPercentage: 3.08, trades: 45, winRate: 67.3, sharpe: 1.42, maxDrawdown: -5.2 },
        { period: '90D', pnl: 2100, pnlPercentage: 4.32, trades: 128, winRate: 64.8, sharpe: 1.38, maxDrawdown: -7.5 },
        { period: '1Y', pnl: 2340, pnlPercentage: 4.68, trades: 156, winRate: 67.3, sharpe: 1.42, maxDrawdown: -8.7 },
        { period: 'ALL', pnl: 2340, pnlPercentage: 4.68, trades: 156, winRate: 67.3, sharpe: 1.42, maxDrawdown: -8.7 }
      ];

      setMetrics(mockMetrics);
      setBenchmarks(mockBenchmarks);
      setTimeframes(mockTimeframes);

    } catch (err) {
      console.error('Error fetching advanced portfolio metrics:', err);
      setError('Failed to load advanced portfolio metrics');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthStatus = (status: string) => {
    const colors = {
      EXCELLENT: 'text-green-600 bg-green-50 border-green-200',
      GOOD: 'text-blue-600 bg-blue-50 border-blue-200',
      FAIR: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      POOR: 'text-orange-600 bg-orange-50 border-orange-200',
      CRITICAL: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.FAIR;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'DOWN': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const selectedTimeframeData = timeframes.find(t => t.period === selectedTimeframe);

  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Enhanced Portfolio Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Advanced Portfolio Analytics
              <Badge variant="default" className="bg-blue-600">
                Live Data
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAdvancedMetrics}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.overview.totalValue, 'USD')}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                metrics.overview.totalPnLPercentage >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.overview.totalPnLPercentage >= 0 ? '+' : ''}{metrics.overview.totalPnLPercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Total Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.performance.winRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthColor(metrics.health.overallHealthScore).split(' ')[0]}`}>
                {metrics.health.overallHealthScore}
              </div>
              <div className="text-sm text-muted-foreground">Health Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeframe Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.period}
                variant={selectedTimeframe === timeframe.period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe.period)}
              >
                {timeframe.period}
              </Button>
            ))}
          </div>
          
          {selectedTimeframeData && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  selectedTimeframeData.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTimeframeData.pnlPercentage >= 0 ? '+' : ''}{selectedTimeframeData.pnlPercentage.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">Return</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{selectedTimeframeData.trades}</div>
                <div className="text-xs text-muted-foreground">Trades</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{selectedTimeframeData.winRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{selectedTimeframeData.sharpe.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Sharpe</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{selectedTimeframeData.maxDrawdown.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Max DD</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedTimeframeData.pnl, 'USD')}
                </div>
                <div className="text-xs text-muted-foreground">P&L</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {[
              { key: 'overview', label: 'Overview', icon: DollarSign },
              { key: 'performance', label: 'Performance', icon: Target },
              { key: 'risk', label: 'Risk Analysis', icon: Shield },
              { key: 'health', label: 'Portfolio Health', icon: Activity },
              { key: 'allocation', label: 'Allocation', icon: PieChart }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === tab.key
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Initial Balance</div>
                    <div className="text-lg font-semibold">{formatCurrency(metrics.overview.initialBalance, 'USD')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Value</div>
                    <div className="text-lg font-semibold">{formatCurrency(metrics.overview.totalValue, 'USD')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cash Balance</div>
                    <div className="text-lg font-semibold">{formatCurrency(metrics.overview.cashBalance, 'USD')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Invested Amount</div>
                    <div className="text-lg font-semibold">{formatCurrency(metrics.overview.investedAmount, 'USD')}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cash</span>
                    <span className="text-sm font-medium">{metrics.allocation.cash.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.allocation.cash} className="h-2" />
                  <div className="flex justify-between">
                    <span className="text-sm">Crypto</span>
                    <span className="text-sm font-medium">{metrics.allocation.crypto.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.allocation.crypto} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benchmark Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarks.map((benchmark) => (
                  <div key={benchmark.symbol} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium">{benchmark.name}</div>
                      <div className="text-sm text-muted-foreground">Corr: {benchmark.correlation.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">1D</div>
                          <div className={benchmark.return1D >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {benchmark.return1D >= 0 ? '+' : ''}{benchmark.return1D.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">7D</div>
                          <div className={benchmark.return7D >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {benchmark.return7D >= 0 ? '+' : ''}{benchmark.return7D.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">30D</div>
                          <div className={benchmark.return30D >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {benchmark.return30D >= 0 ? '+' : ''}{benchmark.return30D.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Trading Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="text-2xl font-bold text-green-600">{metrics.performance.winRate.toFixed(1)}%</div>
                    <Progress value={metrics.performance.winRate} className="mt-1 h-2" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Trades</div>
                    <div className="text-xl font-semibold">{metrics.performance.totalTrades}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Profit Factor</div>
                    <div className="text-xl font-semibold text-blue-600">{metrics.performance.profitFactor.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-purple-600">{metrics.performance.sharpeRatio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    <div className="text-xl font-semibold text-red-600">{metrics.performance.maxDrawdown.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Recovery Factor</div>
                    <div className="text-xl font-semibold">{metrics.performance.recoveryFactor.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trade Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Winning Trades</div>
                    <div className="text-lg font-semibold text-green-600">{metrics.performance.winningTrades}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Losing Trades</div>
                    <div className="text-lg font-semibold text-red-600">{metrics.performance.losingTrades}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Win</div>
                    <div className="text-lg font-semibold text-green-600">{formatCurrency(metrics.performance.averageWin, 'USD')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Average Loss</div>
                    <div className="text-lg font-semibold text-red-600">{formatCurrency(metrics.performance.averageLoss, 'USD')}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Consecutive Wins</div>
                      <div className="text-lg font-semibold">{metrics.trades.consecutiveWins} <span className="text-sm text-green-600">(Max: {metrics.trades.maxConsecutiveWins})</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Consecutive Losses</div>
                      <div className="text-lg font-semibold">{metrics.trades.consecutiveLosses} <span className="text-sm text-red-600">(Max: {metrics.trades.maxConsecutiveLosses})</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Risk</div>
                    <div className="text-xl font-semibold">{metrics.risk.currentRisk.toFixed(1)}%</div>
                    <Progress value={(metrics.risk.currentRisk / metrics.risk.maxRisk) * 100} className="mt-1 h-2" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">VaR (95%)</div>
                    <div className="text-xl font-semibold text-red-600">{formatCurrency(metrics.risk.valueAtRisk, 'USD')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Shortfall</div>
                    <div className="text-xl font-semibold text-red-600">{formatCurrency(metrics.risk.expectedShortfall, 'USD')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Portfolio Beta</div>
                    <div className="text-xl font-semibold">{metrics.risk.beta.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Position Sizing Strategy</div>
                    <Badge className={getHealthColor(
                      metrics.risk.positionSizing === 'CONSERVATIVE' ? 85 : 
                      metrics.risk.positionSizing === 'MODERATE' ? 70 : 50
                    )}>
                      {metrics.risk.positionSizing}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Portfolio Alpha</div>
                    <div className="text-xl font-semibold text-green-600">{(metrics.risk.alpha * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Volatility</div>
                    <div className="text-xl font-semibold">{metrics.risk.volatility.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Correlation SPY</div>
                    <div className="text-xl font-semibold">{metrics.risk.correlationSPY.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Risk-Adj Return</div>
                    <div className="text-xl font-semibold text-blue-600">{metrics.risk.riskAdjustedReturn.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'health' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Portfolio Health Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getHealthColor(metrics.health.overallHealthScore).split(' ')[0]}`}>
                  {metrics.health.overallHealthScore}/100
                </div>
                <Badge className={getHealthStatus(metrics.health.healthStatus)}>
                  {metrics.health.healthStatus}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Diversification', value: metrics.health.diversificationScore, icon: PieChart },
                  { label: 'Liquidity', value: metrics.health.liquidityScore, icon: Zap },
                  { label: 'Stability', value: metrics.health.portfolioStability, icon: Shield },
                  { label: 'Risk Parity', value: metrics.health.riskParity, icon: Calculator },
                  { label: 'Concentration Risk', value: 100 - metrics.health.concentrationRisk, icon: AlertTriangle, invert: true }
                ].map((metric) => (
                  <div key={metric.label} className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <metric.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <div className="text-2xl font-bold mb-2">{metric.value}</div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Last Rebalance</div>
                  <div className="font-semibold">{metrics.health.lastRebalance.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Next Rebalance</div>
                  <div className="font-semibold">{metrics.health.nextRebalance.toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'allocation' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.allocation.bySymbol.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-bold">{asset.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          Risk: {asset.risk.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{asset.percentage.toFixed(1)}%</span>
                        {getTrendIcon(asset.trend)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(asset.value, 'USD')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Low Risk
                    </span>
                    <span className="text-sm font-medium">{metrics.allocation.byRisk.low.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.allocation.byRisk.low} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Medium Risk
                    </span>
                    <span className="text-sm font-medium">{metrics.allocation.byRisk.medium.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.allocation.byRisk.medium} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      High Risk
                    </span>
                    <span className="text-sm font-medium">{metrics.allocation.byRisk.high.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.allocation.byRisk.high} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}