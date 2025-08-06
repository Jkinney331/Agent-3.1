'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  DollarSign,
  Target,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Zap,
  Eye,
  Pause,
  Play,
  RefreshCw,
  Bell,
  Calculator,
  LineChart,
  PieChart,
  TrendingUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RiskMetric {
  id: string;
  name: string;
  current: number;
  maximum: number;
  status: 'safe' | 'warning' | 'danger';
  description: string;
  trend: number;
}

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  value: number;
  unrealizedPnl: number;
  riskScore: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface PortfolioData {
  totalValue: number;
  availableCash: number;
  totalPnL: number;
  todayPnL: number;
  positions: Position[];
}

interface RiskAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function RiskManagementPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: 50000,
    availableCash: 15000,
    totalPnL: 2450.75,
    todayPnL: 125.30,
    positions: []
  });

  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([
    {
      id: 'max-drawdown',
      name: 'Maximum Drawdown',
      current: 3.2,
      maximum: 15.0,
      status: 'safe',
      description: 'Current portfolio drawdown from peak',
      trend: -0.5
    },
    {
      id: 'position-size',
      name: 'Position Concentration',
      current: 8.5,
      maximum: 10.0,
      status: 'warning',
      description: 'Largest single position as % of portfolio',
      trend: 1.2
    },
    {
      id: 'leverage',
      name: 'Portfolio Leverage',
      current: 1.2,
      maximum: 2.0,
      status: 'safe',
      description: 'Current effective leverage ratio',
      trend: 0.1
    },
    {
      id: 'var',
      name: 'Value at Risk',
      current: 2.4,
      maximum: 5.0,
      status: 'safe',
      description: '1-day 95% confidence VaR',
      trend: -0.3
    },
    {
      id: 'volatility',
      name: 'Portfolio Volatility',
      current: 18.5,
      maximum: 25.0,
      status: 'safe',
      description: 'Annualized portfolio volatility',
      trend: 0.2
    }
  ]);

  const [positions, setPositions] = useState<Position[]>([
    {
      symbol: 'BTCUSDT',
      side: 'long',
      size: 0.045,
      value: 3025.50,
      unrealizedPnl: 125.30,
      riskScore: 7.2,
      entryPrice: 65234,
      currentPrice: 67450,
      stopLoss: 63500,
      takeProfit: 72000
    },
    {
      symbol: 'ETHUSDT',
      side: 'long',
      size: 1.2,
      value: 4147.20,
      unrealizedPnl: -89.45,
      riskScore: 6.8,
      entryPrice: 3456,
      currentPrice: 3380,
      stopLoss: 3200,
      takeProfit: 3800
    },
    {
      symbol: 'SOLUSDT',
      side: 'short',
      size: 15.0,
      value: 2475.00,
      unrealizedPnl: 45.60,
      riskScore: 8.1,
      entryPrice: 165,
      currentPrice: 162,
      stopLoss: 175,
      takeProfit: 155
    }
  ]);

  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Position Concentration Risk',
      message: 'BTCUSDT position exceeds 8% of total portfolio value',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Drawdown Recovery',
      message: 'Portfolio drawdown has recovered to below 5% threshold',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      resolved: true
    }
  ]);

  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 15.0,
    maxPositionSize: 10.0,
    maxLeverage: 2.0,
    stopLossEnabled: true,
    takeProfitEnabled: true,
    autoRiskManagement: true,
    riskNotifications: true
  });

  const [portfolioHealth, setPortfolioHealth] = useState({
    overallScore: 8.2,
    riskLevel: 'Moderate',
    diversificationScore: 7.5,
    volatilityScore: 6.8,
    lastUpdated: new Date().toISOString()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch real portfolio data
  const fetchPortfolioData = async () => {
    setIsLoading(true);
    try {
      const [portfolioResponse, positionsResponse] = await Promise.all([
        fetch('/api/test-portfolio'),
        fetch('/api/trading/enhanced-paper-trading?action=orders&limit=10')
      ]);

      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setPortfolioData(prev => ({
          ...prev,
          totalValue: portfolioData.totalValue || prev.totalValue,
          availableCash: portfolioData.availableCash || prev.availableCash,
          totalPnL: portfolioData.totalPnL || prev.totalPnL,
          todayPnL: portfolioData.todayPnL || prev.todayPnL
        }));
      }

      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        // Update positions with real data if available
        // This would need to be adapted based on your actual API response
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate real-time risk metrics
  useEffect(() => {
    const calculateRiskMetrics = () => {
      const totalValue = portfolioData.totalValue;
      const largestPosition = Math.max(...positions.map(p => p.value));
      const positionConcentration = (largestPosition / totalValue) * 100;
      
      // Update position concentration metric
      setRiskMetrics(prev => prev.map(metric => 
        metric.id === 'position-size' 
          ? { ...metric, current: positionConcentration }
          : metric
      ));

      // Calculate portfolio health score
      const newHealthScore = calculatePortfolioHealthScore();
      setPortfolioHealth(prev => ({
        ...prev,
        overallScore: newHealthScore,
        lastUpdated: new Date().toISOString()
      }));
    };

    calculateRiskMetrics();
  }, [portfolioData, positions]);

  const calculatePortfolioHealthScore = () => {
    let score = 10;
    
    // Deduct for high drawdown
    const drawdownMetric = riskMetrics.find(m => m.id === 'max-drawdown');
    if (drawdownMetric && drawdownMetric.current > 10) score -= 2;
    
    // Deduct for high concentration
    const concentrationMetric = riskMetrics.find(m => m.id === 'position-size');
    if (concentrationMetric && concentrationMetric.current > 8) score -= 1;
    
    // Deduct for high leverage
    const leverageMetric = riskMetrics.find(m => m.id === 'leverage');
    if (leverageMetric && leverageMetric.current > 1.5) score -= 1;
    
    return Math.max(0, Math.min(10, score));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'danger': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return XCircle;
      default: return Clock;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'danger': return XCircle;
      case 'info': return CheckCircle;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const resolveAlert = (alertId: string) => {
    setRiskAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              Risk Management Center
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time portfolio monitoring and risk control • Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={fetchPortfolioData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Risk Settings
            </Button>
            <Button className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Risk Report
            </Button>
          </div>
        </div>

        {/* Portfolio Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Live Portfolio Health Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{portfolioHealth.overallScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600">Health Score</div>
                <Badge className={`mt-2 ${
                  portfolioHealth.overallScore >= 8 ? 'bg-green-100 text-green-700' :
                  portfolioHealth.overallScore >= 6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {portfolioHealth.riskLevel}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${portfolioData.totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-xs text-green-600">
                  +${portfolioData.totalPnL.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{portfolioHealth.diversificationScore}/10</div>
                <div className="text-sm text-gray-600">Diversification</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{portfolioHealth.volatilityScore}/10</div>
                <div className="text-sm text-gray-600">Volatility</div>
              </div>
              <div className="text-center">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Auto-Rebalance
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
            <TabsTrigger value="positions">Position Risk</TabsTrigger>
            <TabsTrigger value="alerts">Live Alerts</TabsTrigger>
            <TabsTrigger value="controls">Risk Controls</TabsTrigger>
            <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            {/* Real-time Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riskMetrics.map((metric) => {
                const StatusIcon = getStatusIcon(metric.status);
                const progressPercentage = (metric.current / metric.maximum) * 100;
                
                return (
                  <Card key={metric.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${
                            metric.status === 'safe' ? 'text-green-600' :
                            metric.status === 'warning' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                          {metric.name}
                        </span>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status.toUpperCase()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Current: {metric.current.toFixed(1)}{metric.id === 'leverage' ? '' : '%'}</span>
                          <span>Max: {metric.maximum.toFixed(1)}{metric.id === 'leverage' ? '' : '%'}</span>
                        </div>
                        <Progress 
                          value={progressPercentage} 
                          className={`h-2 ${
                            metric.status === 'danger' ? '[&>div]:bg-red-500' :
                            metric.status === 'warning' ? '[&>div]:bg-yellow-500' :
                            '[&>div]:bg-green-500'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">{metric.description}</p>
                          <div className="flex items-center gap-1">
                            {metric.trend > 0 ? (
                              <TrendingUp className="h-3 w-3 text-red-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-green-500" />
                            )}
                            <span className={`text-xs ${metric.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {Math.abs(metric.trend).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="positions" className="space-y-6">
            {/* Enhanced Position Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Live Position Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {positions.map((position, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                            {position.side.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">{position.symbol}</span>
                          <span className="text-sm text-gray-600">Size: {position.size}</span>
                          <span className="text-sm text-gray-600">
                            Entry: ${position.entryPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${position.value.toLocaleString()}</div>
                          <div className={`text-sm ${position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Current Price</div>
                          <div className="font-medium">${position.currentPrice.toLocaleString()}</div>
                        </div>
                        {position.stopLoss && (
                          <div>
                            <div className="text-gray-600">Stop Loss</div>
                            <div className="font-medium text-red-600">${position.stopLoss.toLocaleString()}</div>
                          </div>
                        )}
                        {position.takeProfit && (
                          <div>
                            <div className="text-gray-600">Take Profit</div>
                            <div className="font-medium text-green-600">${position.takeProfit.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Risk Score:</span>
                          <Badge className={
                            position.riskScore >= 8 ? 'bg-red-100 text-red-700' :
                            position.riskScore >= 6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }>
                            {position.riskScore}/10
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Risk: {((position.value / portfolioData.totalValue) * 100).toFixed(1)}% of portfolio
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Adjust Size
                          </Button>
                          <Button size="sm" variant="outline">
                            Update SL/TP
                          </Button>
                          <Button size="sm" variant="destructive">
                            Close Position
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Live Risk Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Live Risk Alerts
                  </span>
                  <Badge variant="outline">
                    {riskAlerts.filter(a => !a.resolved).length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskAlerts.map((alert) => {
                    const AlertIcon = getAlertIcon(alert.type);
                    return (
                      <div 
                        key={alert.id} 
                        className={`flex items-center gap-3 p-4 border rounded-lg ${getAlertColor(alert.type)} ${
                          alert.resolved ? 'opacity-60' : ''
                        }`}
                      >
                        <AlertIcon className={`h-4 w-4 ${
                          alert.type === 'warning' ? 'text-yellow-600' :
                          alert.type === 'danger' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(alert.timestamp)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {alert.resolved ? (
                            <Badge className="bg-green-100 text-green-700">Resolved</Badge>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolve
                              </Button>
                              <Button size="sm" variant="outline">
                                Snooze
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            {/* Enhanced Risk Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Risk Limits & Thresholds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Maximum Drawdown (%)</Label>
                    <Input 
                      type="number" 
                      value={riskSettings.maxDrawdown}
                      onChange={(e) => setRiskSettings({...riskSettings, maxDrawdown: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Position Size (%)</Label>
                    <Input 
                      type="number" 
                      value={riskSettings.maxPositionSize}
                      onChange={(e) => setRiskSettings({...riskSettings, maxPositionSize: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Leverage</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={riskSettings.maxLeverage}
                      onChange={(e) => setRiskSettings({...riskSettings, maxLeverage: Number(e.target.value)})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Automated Risk Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Stop Loss</div>
                      <div className="text-sm text-gray-600">Automatically close losing positions</div>
                    </div>
                    <Button 
                      variant={riskSettings.stopLossEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRiskSettings({...riskSettings, stopLossEnabled: !riskSettings.stopLossEnabled})}
                    >
                      {riskSettings.stopLossEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Take Profit</div>
                      <div className="text-sm text-gray-600">Automatically lock in profits</div>
                    </div>
                    <Button 
                      variant={riskSettings.takeProfitEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRiskSettings({...riskSettings, takeProfitEnabled: !riskSettings.takeProfitEnabled})}
                    >
                      {riskSettings.takeProfitEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">AI Risk Management</div>
                      <div className="text-sm text-gray-600">AI-powered risk adjustments</div>
                    </div>
                    <Button 
                      variant={riskSettings.autoRiskManagement ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRiskSettings({...riskSettings, autoRiskManagement: !riskSettings.autoRiskManagement})}
                    >
                      {riskSettings.autoRiskManagement ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Risk Notifications</div>
                      <div className="text-sm text-gray-600">Real-time risk alerts</div>
                    </div>
                    <Button 
                      variant={riskSettings.riskNotifications ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRiskSettings({...riskSettings, riskNotifications: !riskSettings.riskNotifications})}
                    >
                      {riskSettings.riskNotifications ? <Bell className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {/* Advanced Risk Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Risk Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800 font-medium mb-2">Portfolio Risk Metrics</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-blue-600">Beta</div>
                          <div className="font-medium">1.23</div>
                        </div>
                        <div>
                          <div className="text-blue-600">Alpha</div>
                          <div className="font-medium">0.08</div>
                        </div>
                        <div>
                          <div className="text-blue-600">Information Ratio</div>
                          <div className="font-medium">0.75</div>
                        </div>
                        <div>
                          <div className="text-blue-600">Treynor Ratio</div>
                          <div className="font-medium">0.142</div>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Optimal Position Size
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Risk Attribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Market Risk</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-16 h-2" />
                        <span className="text-sm font-medium">65%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Concentration Risk</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-16 h-2" />
                        <span className="text-sm font-medium">25%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">Liquidity Risk</span>
                      <div className="flex items-center gap-2">
                        <Progress value={10} className="w-16 h-2" />
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Stress Test Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-red-600 mb-2">Market Crash (-30%)</div>
                    <div className="text-2xl font-bold text-red-600">-$15,000</div>
                    <div className="text-sm text-gray-600">Estimated Loss</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-yellow-600 mb-2">High Volatility (+50%)</div>
                    <div className="text-2xl font-bold text-yellow-600">±$8,500</div>
                    <div className="text-sm text-gray-600">Daily Swing Range</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium text-blue-600 mb-2">Liquidity Crisis</div>
                    <div className="text-2xl font-bold text-blue-600">2.5 days</div>
                    <div className="text-sm text-gray-600">Time to Exit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 