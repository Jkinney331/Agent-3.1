'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Settings,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Brain,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// TypeScript interfaces based on backend structure
interface StopLevelData {
  symbol: string;
  currentPrice: number;
  stopPrice: number;
  originalStopPrice: number;
  trailingDistance: number;
  trailingPercentage: number;
  lastUpdated: Date;
  updateCount: number;
  
  // Analysis data
  atr: number;
  volatility: number;
  aiConfidence: number;
  marketRegime: 'BULL' | 'BEAR' | 'RANGE' | 'VOLATILE';
  
  // Position context
  positionId: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPnL: number;
  currentPnLPercentage: number;
  holdingTime: number;
  
  // Stop history
  stopHistory: StopHistoryEntry[];
}

interface StopHistoryEntry {
  timestamp: Date;
  price: number;
  stopPrice: number;
  reason: string;
  atr: number;
  confidence: number;
  regime: 'BULL' | 'BEAR' | 'RANGE' | 'VOLATILE';
}

interface TrailingStopUpdate {
  symbol: string;
  positionId: string;
  oldStop: number;
  newStop: number;
  reason: string;
  confidence: number;
  timestamp: Date;
}

interface DynamicStopStats {
  activePositions: number;
  totalUpdates: number;
  averageUpdateFrequency: number;
  systemUptime: number;
}

export function TrailingStopsMonitor() {
  const [activeStops, setActiveStops] = useState<StopLevelData[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<TrailingStopUpdate[]>([]);
  const [stats, setStats] = useState<DynamicStopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSystemActive, setIsSystemActive] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    fetchTrailingStopsData();
    
    // Set up real-time updates (WebSocket connection would go here)
    const interval = setInterval(fetchTrailingStopsData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchTrailingStopsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In production, these would be real API calls
      // For now, we'll simulate the data based on the backend structure
      
      // Mock active stops data
      const mockActiveStops: StopLevelData[] = [
        {
          symbol: 'BTC/USDT',
          currentPrice: 95420,
          stopPrice: 93500,
          originalStopPrice: 92000,
          trailingDistance: 1920,
          trailingPercentage: 2.01,
          lastUpdated: new Date(Date.now() - 30000),
          updateCount: 12,
          atr: 850,
          volatility: 2.3,
          aiConfidence: 87,
          marketRegime: 'BULL',
          positionId: 'pos_001',
          side: 'LONG',
          entryPrice: 94000,
          currentPnL: 1420,
          currentPnLPercentage: 1.51,
          holdingTime: 3600000, // 1 hour
          stopHistory: [
            {
              timestamp: new Date(Date.now() - 300000),
              price: 95100,
              stopPrice: 93200,
              reason: 'Initial stop set',
              atr: 820,
              confidence: 85,
              regime: 'BULL'
            },
            {
              timestamp: new Date(Date.now() - 60000),
              price: 95350,
              stopPrice: 93400,
              reason: 'Price advancement',
              atr: 840,
              confidence: 86,
              regime: 'BULL'
            }
          ]
        },
        {
          symbol: 'ETH/USDT',
          currentPrice: 3420,
          stopPrice: 3380,
          originalStopPrice: 3350,
          trailingDistance: 40,
          trailingPercentage: 1.17,
          lastUpdated: new Date(Date.now() - 120000),
          updateCount: 8,
          atr: 45,
          volatility: 1.8,
          aiConfidence: 72,
          marketRegime: 'RANGE',
          positionId: 'pos_002',
          side: 'LONG',
          entryPrice: 3400,
          currentPnL: 20,
          currentPnLPercentage: 0.59,
          holdingTime: 1800000, // 30 minutes
          stopHistory: [
            {
              timestamp: new Date(Date.now() - 600000),
              price: 3400,
              stopPrice: 3350,
              reason: 'Initial stop set',
              atr: 42,
              confidence: 70,
              regime: 'RANGE'
            }
          ]
        }
      ];

      // Mock recent updates
      const mockUpdates: TrailingStopUpdate[] = [
        {
          symbol: 'BTC/USDT',
          positionId: 'pos_001',
          oldStop: 93400,
          newStop: 93500,
          reason: 'AI confidence increase triggered tighter stop',
          confidence: 87,
          timestamp: new Date(Date.now() - 30000)
        },
        {
          symbol: 'SOL/USDT',
          positionId: 'pos_003',
          oldStop: 182,
          newStop: 184,
          reason: 'Volatility decrease allowed closer stop',
          confidence: 65,
          timestamp: new Date(Date.now() - 120000)
        }
      ];

      // Mock system stats
      const mockStats: DynamicStopStats = {
        activePositions: mockActiveStops.length,
        totalUpdates: 45,
        averageUpdateFrequency: 30000,
        systemUptime: 7200000 // 2 hours
      };

      setActiveStops(mockActiveStops);
      setRecentUpdates(mockUpdates);
      setStats(mockStats);
      setIsSystemActive(true);

    } catch (err) {
      console.error('Error fetching trailing stops data:', err);
      setError('Failed to load trailing stops data');
    } finally {
      setLoading(false);
    }
  };

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'BULL': return 'text-green-600 bg-green-50 border-green-200';
      case 'BEAR': return 'text-red-600 bg-red-50 border-red-200';
      case 'VOLATILE': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'RANGE': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && activeStops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Dynamic Trailing Stops
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

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Dynamic Trailing Stops
              <Badge 
                variant={isSystemActive ? "default" : "destructive"}
                className={isSystemActive ? "bg-green-600" : ""}
              >
                {isSystemActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTrailingStopsData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {stats && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.activePositions}</div>
                <div className="text-sm text-muted-foreground">Active Positions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalUpdates}</div>
                <div className="text-sm text-muted-foreground">Total Updates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.averageUpdateFrequency / 1000)}s
                </div>
                <div className="text-sm text-muted-foreground">Update Frequency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(stats.systemUptime / 3600000)}h
                </div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Active Stops Monitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Active Trailing Stops ({activeStops.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <div>{error}</div>
            </Alert>
          )}
          
          <div className="space-y-4">
            {activeStops.map((stop) => (
              <div 
                key={stop.positionId} 
                className="p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-lg">{stop.symbol}</div>
                    <Badge variant={stop.side === 'LONG' ? 'default' : 'destructive'}>
                      {stop.side}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={getRegimeColor(stop.marketRegime)}
                    >
                      {stop.marketRegime}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      stop.currentPnLPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stop.currentPnLPercentage >= 0 ? '+' : ''}{stop.currentPnLPercentage.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(stop.currentPnL, 'USD')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Current Price</div>
                    <div className="font-semibold">${stop.currentPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Stop Price</div>
                    <div className="font-semibold text-red-600">${stop.stopPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Trailing %</div>
                    <div className="font-semibold">{stop.trailingPercentage.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Updates</div>
                    <div className="font-semibold">{stop.updateCount}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        AI Confidence
                      </span>
                      <span className={`text-xs font-semibold ${getConfidenceColor(stop.aiConfidence)}`}>
                        {stop.aiConfidence}%
                      </span>
                    </div>
                    <Progress value={stop.aiConfidence} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Volatility
                      </span>
                      <span className="text-xs font-semibold">
                        {stop.volatility.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={Math.min(stop.volatility * 10, 100)} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Holding Time
                      </span>
                      <span className="text-xs font-semibold">
                        {Math.round(stop.holdingTime / 60000)}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {formatTimestamp(stop.lastUpdated)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPosition(
                      selectedPosition === stop.positionId ? null : stop.positionId
                    )}
                  >
                    {selectedPosition === stop.positionId ? 'Hide' : 'Show'} History
                  </Button>
                </div>

                {/* Stop History */}
                {selectedPosition === stop.positionId && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Stop Adjustment History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {stop.stopHistory.slice(-5).reverse().map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">${entry.stopPrice.toLocaleString()}</div>
                            <div className="text-muted-foreground">{entry.reason}</div>
                          </div>
                          <div className="text-right">
                            <div>{formatTimestamp(entry.timestamp)}</div>
                            <div className="text-muted-foreground">
                              Conf: {entry.confidence}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Recent Stop Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUpdates.map((update, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{update.symbol}</div>
                    <div className="text-xs text-muted-foreground">{update.reason}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    ${update.oldStop.toFixed(2)} → ${update.newStop.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(update.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}