'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Shield,
  Zap,
  Brain,
  Globe,
  Eye,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface MarketSignal {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  symbol: string;
  signal: string;
  confidence: number;
  timestamp: Date;
  source: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
  source: string;
  symbols: string[];
}

const PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    id: 'total-return',
    name: 'Total Return',
    value: 47250.89,
    change: 2847.32,
    changePercent: 6.4,
    icon: TrendingUp,
    color: 'text-green-600',
    description: '30-day portfolio performance'
  },
  {
    id: 'win-rate',
    name: 'Win Rate',
    value: 73.2,
    change: 1.8,
    changePercent: 2.5,
    icon: Target,
    color: 'text-blue-600',
    description: 'Successful trades percentage'
  },
  {
    id: 'sharpe-ratio',
    name: 'Sharpe Ratio',
    value: 2.14,
    change: 0.07,
    changePercent: 3.4,
    icon: BarChart3,
    color: 'text-purple-600',
    description: 'Risk-adjusted returns'
  },
  {
    id: 'max-drawdown',
    name: 'Max Drawdown',
    value: 8.3,
    change: -1.2,
    changePercent: -12.6,
    icon: Shield,
    color: 'text-orange-600',
    description: 'Maximum portfolio decline'
  },
  {
    id: 'avg-trade-duration',
    name: 'Avg Trade Duration',
    value: 4.7,
    change: -0.3,
    changePercent: -6.0,
    icon: Clock,
    color: 'text-cyan-600',
    description: 'Hours per trade average'
  },
  {
    id: 'monthly-volume',
    name: 'Monthly Volume',
    value: 284750,
    change: 31200,
    changePercent: 12.3,
    icon: DollarSign,
    color: 'text-emerald-600',
    description: 'Total trading volume'
  }
];

const MARKET_SIGNALS: MarketSignal[] = [
  {
    id: '1',
    type: 'bullish',
    strength: 8.5,
    symbol: 'BTC/USDT',
    signal: 'Golden Cross Detected',
    confidence: 87,
    timestamp: new Date('2025-01-15T09:30:00'),
    source: 'Technical Analysis AI'
  },
  {
    id: '2',
    type: 'bearish',
    strength: 6.2,
    symbol: 'ETH/USDT',
    signal: 'RSI Overbought',
    confidence: 73,
    timestamp: new Date('2025-01-15T09:15:00'),
    source: 'Momentum Indicator'
  },
  {
    id: '3',
    type: 'bullish',
    strength: 7.8,
    symbol: 'SOL/USDT',
    signal: 'Volume Surge',
    confidence: 82,
    timestamp: new Date('2025-01-15T08:45:00'),
    source: 'Volume Analysis'
  },
  {
    id: '4',
    type: 'neutral',
    strength: 4.1,
    symbol: 'ADA/USDT',
    signal: 'Consolidation Pattern',
    confidence: 65,
    timestamp: new Date('2025-01-15T08:30:00'),
    source: 'Pattern Recognition'
  }
];

const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    title: 'Major Investment Fund Allocates $500M to Bitcoin',
    summary: 'Institutional adoption continues as major fund announces significant Bitcoin allocation amid regulatory clarity.',
    sentiment: 'positive',
    impact: 'high',
    timestamp: new Date('2025-01-15T10:00:00'),
    source: 'Decrypt',
    symbols: ['BTC/USDT']
  },
  {
    id: '2',
    title: 'Ethereum Layer 2 Solutions Show Record Activity',
    summary: 'L2 networks process unprecedented transaction volumes, reducing costs and improving scalability.',
    sentiment: 'positive',
    impact: 'medium',
    timestamp: new Date('2025-01-15T09:30:00'),
    source: 'CoinTelegraph',
    symbols: ['ETH/USDT']
  },
  {
    id: '3',
    title: 'Regulatory Concerns Impact Altcoin Market',
    summary: 'New regulatory proposals create uncertainty in the altcoin space, affecting trading volumes.',
    sentiment: 'negative',
    impact: 'medium',
    timestamp: new Date('2025-01-15T08:45:00'),
    source: 'CrypoNews',
    symbols: ['SOL/USDT', 'ADA/USDT', 'DOT/USDT']
  }
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const getSignalColor = (type: string, strength: number) => {
    if (type === 'bullish') return `bg-green-${Math.min(Math.floor(strength/2)*100 + 100, 500)} text-white`;
    if (type === 'bearish') return `bg-red-${Math.min(Math.floor(strength/2)*100 + 100, 500)} text-white`;
    return 'bg-gray-100 text-gray-800';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">Comprehensive market intelligence and performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              ← Dashboard
            </Button>
          </Link>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Eye className="h-4 w-4 mr-2" />
            Live View
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Portfolio Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {PERFORMANCE_METRICS.map((metric) => (
            <Card key={metric.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={metric.color}>
                    {React.createElement(metric.icon, { className: 'h-5 w-5' })}
                  </div>
                  <Badge variant={metric.changePercent >= 0 ? 'default' : 'destructive'} className="text-xs">
                    {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{metric.name}</p>
                  <p className="text-lg font-bold">
                    {metric.name.includes('Rate') || metric.name.includes('Drawdown') 
                      ? `${metric.value}%` 
                      : metric.name.includes('Duration')
                      ? `${metric.value}h`
                      : metric.name.includes('Volume')
                      ? `$${(metric.value / 1000).toFixed(0)}K`
                      : metric.value.toLocaleString()
                    }
                  </p>
                  <p className={`text-xs ${metric.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.changePercent >= 0 ? '+' : ''}{metric.change.toFixed(2)} ({metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%)
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Market Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Market Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MARKET_SIGNALS.map((signal) => (
                <div key={signal.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSignalColor(signal.type, signal.strength)} text-xs`}>
                        {signal.type.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-sm">{signal.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {signal.confidence}% confidence
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {signal.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{signal.signal}</p>
                    <p className="text-xs text-muted-foreground">
                      Strength: {signal.strength}/10 • Source: {signal.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Zap className="h-4 w-4 mr-2" />
              View All Signals
            </Button>
          </CardContent>
        </Card>

        {/* Market News & Sentiment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Market News & Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {NEWS_ITEMS.map((news) => (
                <div key={news.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2">{news.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{news.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSentimentColor(news.sentiment)} text-xs`}>
                        {news.sentiment}
                      </Badge>
                      <Badge className={`${getImpactColor(news.impact)} text-xs`}>
                        {news.impact} impact
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{news.source}</span>
                      <span className="text-xs text-muted-foreground">
                        {news.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {news.symbols.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {news.symbols.map((symbol, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Globe className="h-4 w-4 mr-2" />
              View All News
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Liquidity Heatmaps</h3>
            <p className="text-sm text-muted-foreground">Real-time market liquidity</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Strategy Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-green-800">AI Adaptive Momentum</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Return:</span>
                  <span className="font-semibold text-green-600">+23.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Win Rate:</span>
                  <span className="font-semibold">68.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sharpe Ratio:</span>
                  <span className="font-semibold">1.8</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-800">Mean Reversion Scalper</span>
                <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Return:</span>
                  <span className="font-semibold text-green-600">+15.7%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Win Rate:</span>
                  <span className="font-semibold">72.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sharpe Ratio:</span>
                  <span className="font-semibold">1.4</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-800">Cross-Exchange Arbitrage</span>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Return:</span>
                  <span className="font-semibold text-green-600">+8.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Win Rate:</span>
                  <span className="font-semibold">89.1%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sharpe Ratio:</span>
                  <span className="font-semibold">2.3</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 