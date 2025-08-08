'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Target, Activity, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTradingData } from '@/hooks/use-trading-data';

export function PortfolioMetrics() {
  const {
    portfolioData,
    positions,
    marketData,
    connectionStatus,
    latency,
    isLoading,
    error,
    refreshData
  } = useTradingData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Overview
            <Badge 
              variant="outline" 
              className={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}
            >
              {connectionStatus}
            </Badge>
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Overview
            <Badge variant="outline" className="text-red-600">
              Error
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={refreshData}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
          <div className="mt-4 text-center">
            <Button onClick={refreshData} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData) return null;

  const isPositiveDay = portfolioData.dailyPnL >= 0;
  const isPositiveTotal = portfolioData.totalReturn >= 0;

  // Transform positions data for display
  const allocations = positions.map(position => ({
    symbol: position.symbol,
    name: position.symbol.replace('/', ' / '),
    amount: position.quantity,
    value: position.marketValue,
    price: position.currentPrice,
    change24h: position.unrealizedPnLPercent,
    allocation: portfolioData.totalBalance > 0 ? (position.marketValue / portfolioData.totalBalance) * 100 : 0
  })).sort((a, b) => b.allocation - a.allocation);

  return (
    <div className="space-y-4">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioData.totalBalance, 'USD')}
            </div>
            <div className={`flex items-center text-sm ${
              isPositiveDay ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveDay ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {formatCurrency(Math.abs(portfolioData.dailyPnL), 'USD')} ({Math.abs(portfolioData.dailyPnLPercentage).toFixed(2)}%) today
            </div>
            {latency && (
              <div className="text-xs text-muted-foreground mt-1">
                Latency: {latency}ms
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              isPositiveTotal ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveTotal ? '+' : ''}{formatCurrency(portfolioData.totalReturn, 'USD')}
            </div>
            <div className={`text-sm ${
              isPositiveTotal ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveTotal ? '+' : ''}{portfolioData.totalReturnPercentage.toFixed(2)}% all time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allocations.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Active positions
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Available: {formatCurrency(portfolioData.availableBalance, 'USD')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Allocations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolio Allocations
            <Badge 
              variant="outline" 
              className={connectionStatus === 'connected' ? 'text-green-600 ml-auto' : 'text-red-600 ml-auto'}
            >
              {connectionStatus === 'connected' ? 'Live Prices' : 'Disconnected'}
            </Badge>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No Active Positions</p>
              <p className="text-sm">Your portfolio is currently in cash</p>
              <p className="text-sm">Available: {formatCurrency(portfolioData.availableBalance, 'USD')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allocations.map((allocation, index) => (
                <div key={allocation.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">{allocation.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{allocation.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {allocation.amount.toLocaleString()} shares @ {formatCurrency(allocation.price, 'USD')}
                      </div>
                      {marketData[allocation.symbol] && (
                        <div className="text-xs text-blue-600">
                          Last updated: {new Date(marketData[allocation.symbol].timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(allocation.value, 'USD')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {allocation.allocation.toFixed(1)}% allocation
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${
                      allocation.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {allocation.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(allocation.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">
                {formatCurrency(portfolioData.totalBalance, 'USD', 0)}
              </div>
              <div className="text-sm text-muted-foreground">Current Value</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                isPositiveDay ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveDay ? '+' : ''}{portfolioData.dailyPnLPercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">24h Change</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                isPositiveTotal ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveTotal ? '+' : ''}{portfolioData.totalReturnPercentage.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">Total Return</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {allocations.length}
              </div>
              <div className="text-sm text-muted-foreground">Assets</div>
            </div>
          </div>
          {connectionStatus === 'connected' && latency && (
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Connected to Alpaca • Response time: {latency}ms • Last updated: {new Date().toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 