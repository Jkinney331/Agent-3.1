'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  Settings, 
  Play, 
  Pause, 
  BarChart3,
  Shield,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'meanReversion' | 'arbitrage' | 'aiAdaptive';
  status: 'active' | 'paused' | 'stopped';
  performance: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    tradesCount: number;
  };
  parameters: {
    riskLevel: number;
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    timeframe: string;
    symbols: string[];
  };
  lastUpdate: Date;
  createdAt: Date;
}

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'AI Adaptive Momentum',
    description: 'Advanced AI-driven momentum strategy with adaptive parameters',
    type: 'aiAdaptive',
    status: 'active',
    performance: {
      totalReturn: 23.5,
      winRate: 68.2,
      sharpeRatio: 1.8,
      maxDrawdown: 8.3,
      tradesCount: 147
    },
    parameters: {
      riskLevel: 3,
      maxPositionSize: 0.15,
      stopLoss: 0.05,
      takeProfit: 0.12,
      timeframe: '4h',
      symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
    },
    lastUpdate: new Date('2025-01-15T10:30:00'),
    createdAt: new Date('2024-12-01T00:00:00')
  },
  {
    id: '2',
    name: 'Mean Reversion Scalper',
    description: 'High-frequency mean reversion strategy for volatile markets',
    type: 'meanReversion',
    status: 'paused',
    performance: {
      totalReturn: 15.7,
      winRate: 72.5,
      sharpeRatio: 1.4,
      maxDrawdown: 6.2,
      tradesCount: 289
    },
    parameters: {
      riskLevel: 2,
      maxPositionSize: 0.08,
      stopLoss: 0.03,
      takeProfit: 0.06,
      timeframe: '15m',
      symbols: ['BTC/USDT', 'ETH/USDT']
    },
    lastUpdate: new Date('2025-01-14T15:45:00'),
    createdAt: new Date('2024-11-15T00:00:00')
  },
  {
    id: '3',
    name: 'Cross-Exchange Arbitrage',
    description: 'Automated arbitrage opportunities across multiple exchanges',
    type: 'arbitrage',
    status: 'active',
    performance: {
      totalReturn: 8.3,
      winRate: 89.1,
      sharpeRatio: 2.3,
      maxDrawdown: 2.1,
      tradesCount: 56
    },
    parameters: {
      riskLevel: 1,
      maxPositionSize: 0.25,
      stopLoss: 0.02,
      takeProfit: 0.04,
      timeframe: '1m',
      symbols: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']
    },
    lastUpdate: new Date('2025-01-15T09:15:00'),
    createdAt: new Date('2024-10-20T00:00:00')
  }
];

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    type: 'momentum' as Strategy['type'],
    riskLevel: 2,
    maxPositionSize: 0.1,
    stopLoss: 0.05,
    takeProfit: 0.1,
    timeframe: '1h',
    symbols: 'BTC/USDT,ETH/USDT'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'momentum': return <TrendingUp className="h-4 w-4" />;
      case 'meanReversion': return <BarChart3 className="h-4 w-4" />;
      case 'arbitrage': return <DollarSign className="h-4 w-4" />;
      case 'aiAdaptive': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const toggleStrategyStatus = async (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => {
      if (strategy.id === strategyId) {
        const newStatus = strategy.status === 'active' ? 'paused' : 'active';
        return { ...strategy, status: newStatus, lastUpdate: new Date() };
      }
      return strategy;
    }));

    // Here you would make an API call to update the strategy status
    try {
      const response = await fetch('/api/trading/strategy/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategyId, action: 'toggle' })
      });
      console.log('Strategy status updated:', response);
    } catch (error) {
      console.error('Failed to update strategy status:', error);
    }
  };

  const createStrategy = async () => {
    const strategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategy.name,
      description: newStrategy.description,
      type: newStrategy.type,
      status: 'paused',
      performance: {
        totalReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        tradesCount: 0
      },
      parameters: {
        riskLevel: newStrategy.riskLevel,
        maxPositionSize: newStrategy.maxPositionSize,
        stopLoss: newStrategy.stopLoss,
        takeProfit: newStrategy.takeProfit,
        timeframe: newStrategy.timeframe,
        symbols: newStrategy.symbols.split(',').map(s => s.trim())
      },
      lastUpdate: new Date(),
      createdAt: new Date()
    };

    setStrategies(prev => [...prev, strategy]);
    setIsCreateModalOpen(false);
    
    // Reset form
    setNewStrategy({
      name: '',
      description: '',
      type: 'momentum',
      riskLevel: 2,
      maxPositionSize: 0.1,
      stopLoss: 0.05,
      takeProfit: 0.1,
      timeframe: '1h',
      symbols: 'BTC/USDT,ETH/USDT'
    });

    // API call to create strategy in N8N
    try {
      const response = await fetch('/api/trading/strategy/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategy)
      });
      console.log('Strategy created:', response);
    } catch (error) {
      console.error('Failed to create strategy:', error);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Strategy Management</h1>
          <p className="text-muted-foreground">Create, optimize, and monitor AI trading strategies</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              ← Dashboard
            </Button>
          </Link>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Trading Strategy</DialogTitle>
                <DialogDescription>
                  Configure parameters for your new AI trading strategy
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Strategy Name</Label>
                    <Input
                      id="name"
                      value={newStrategy.name}
                      onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                      placeholder="e.g., AI Momentum v2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Strategy Type</Label>
                    <Select value={newStrategy.type} onValueChange={(value: Strategy['type']) => setNewStrategy({...newStrategy, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="momentum">Momentum</SelectItem>
                        <SelectItem value="meanReversion">Mean Reversion</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="aiAdaptive">AI Adaptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    placeholder="Describe your strategy..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="riskLevel">Risk Level (1-5)</Label>
                    <Input
                      id="riskLevel"
                      type="number"
                      min="1"
                      max="5"
                      value={newStrategy.riskLevel}
                      onChange={(e) => setNewStrategy({...newStrategy, riskLevel: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPosition">Max Position (%)</Label>
                    <Input
                      id="maxPosition"
                      type="number"
                      step="0.01"
                      value={newStrategy.maxPositionSize}
                      onChange={(e) => setNewStrategy({...newStrategy, maxPositionSize: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select value={newStrategy.timeframe} onValueChange={(value) => setNewStrategy({...newStrategy, timeframe: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1m">1 Minute</SelectItem>
                        <SelectItem value="5m">5 Minutes</SelectItem>
                        <SelectItem value="15m">15 Minutes</SelectItem>
                        <SelectItem value="1h">1 Hour</SelectItem>
                        <SelectItem value="4h">4 Hours</SelectItem>
                        <SelectItem value="1d">1 Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      step="0.01"
                      value={newStrategy.stopLoss}
                      onChange={(e) => setNewStrategy({...newStrategy, stopLoss: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="takeProfit">Take Profit (%)</Label>
                    <Input
                      id="takeProfit"
                      type="number"
                      step="0.01"
                      value={newStrategy.takeProfit}
                      onChange={(e) => setNewStrategy({...newStrategy, takeProfit: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="symbols">Trading Pairs (comma-separated)</Label>
                  <Input
                    id="symbols"
                    value={newStrategy.symbols}
                    onChange={(e) => setNewStrategy({...newStrategy, symbols: e.target.value})}
                    placeholder="BTC/USDT, ETH/USDT, SOL/USDT"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createStrategy} disabled={!newStrategy.name}>
                  Create Strategy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Strategy Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Strategies</p>
                <p className="text-2xl font-bold">{strategies.filter(s => s.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Return</p>
                <p className="text-2xl font-bold text-green-600">
                  +{strategies.reduce((acc, s) => acc + s.performance.totalReturn, 0).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(strategies.reduce((acc, s) => acc + s.performance.winRate, 0) / strategies.length).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">
                  {strategies.reduce((acc, s) => acc + s.performance.tradesCount, 0)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Trading Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-blue-600">
                        {getTypeIcon(strategy.type)}
                      </div>
                      <h3 className="font-semibold text-lg">{strategy.name}</h3>
                      <Badge className={getStatusColor(strategy.status)}>
                        {strategy.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Return:</span>
                        <div className={`font-semibold ${strategy.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {strategy.performance.totalReturn >= 0 ? '+' : ''}{strategy.performance.totalReturn}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Win Rate:</span>
                        <div className="font-semibold">{strategy.performance.winRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sharpe:</span>
                        <div className="font-semibold">{strategy.performance.sharpeRatio}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max DD:</span>
                        <div className="font-semibold text-red-600">{strategy.performance.maxDrawdown}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trades:</span>
                        <div className="font-semibold">{strategy.performance.tradesCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated:</span>
                        <div className="font-semibold">{strategy.lastUpdate.toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStrategyStatus(strategy.id)}
                      className={strategy.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {strategy.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
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