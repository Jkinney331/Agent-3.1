'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Brain,
  Code
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StrategyBlock {
  id: string;
  type: 'indicator' | 'condition' | 'action' | 'filter';
  name: string;
  icon: React.ElementType;
  config: Record<string, any>;
  connections: string[];
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  blocks: StrategyBlock[];
  settings: {
    timeframe: string;
    riskLevel: string;
    maxPositions: number;
    stopLoss: number;
    takeProfit: number;
  };
}

export default function StrategyBuilderPage() {
  const [currentStrategy, setCurrentStrategy] = useState<Strategy>({
    id: 'new-strategy',
    name: 'New Strategy',
    description: '',
    blocks: [],
    settings: {
      timeframe: '1h',
      riskLevel: 'medium',
      maxPositions: 3,
      stopLoss: 2.0,
      takeProfit: 4.0
    }
  });

  const [availableBlocks] = useState<StrategyBlock[]>([
    {
      id: 'rsi',
      type: 'indicator',
      name: 'RSI',
      icon: BarChart3,
      config: { period: 14, overbought: 70, oversold: 30 },
      connections: []
    },
    {
      id: 'macd',
      type: 'indicator',
      name: 'MACD',
      icon: TrendingUp,
      config: { fast: 12, slow: 26, signal: 9 },
      connections: []
    },
    {
      id: 'bollinger',
      type: 'indicator',
      name: 'Bollinger Bands',
      icon: Target,
      config: { period: 20, deviation: 2 },
      connections: []
    },
    {
      id: 'buy-condition',
      type: 'condition',
      name: 'Buy Condition',
      icon: Plus,
      config: { operator: 'and', conditions: [] },
      connections: []
    },
    {
      id: 'sell-condition',
      type: 'condition',
      name: 'Sell Condition',
      icon: Target,
      config: { operator: 'and', conditions: [] },
      connections: []
    },
    {
      id: 'market-buy',
      type: 'action',
      name: 'Market Buy',
      icon: TrendingUp,
      config: { orderType: 'market', quantity: '100%' },
      connections: []
    },
    {
      id: 'market-sell',
      type: 'action',
      name: 'Market Sell',
      icon: TrendingUp,
      config: { orderType: 'market', quantity: '100%' },
      connections: []
    }
  ]);

  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const addBlock = (blockTemplate: StrategyBlock) => {
    const newBlock: StrategyBlock = {
      ...blockTemplate,
      id: `${blockTemplate.id}-${Date.now()}`,
      connections: []
    };
    
    setCurrentStrategy(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
  };

  const removeBlock = (blockId: string) => {
    setCurrentStrategy(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  };

  const saveStrategy = () => {
    console.log('Saving strategy:', currentStrategy);
    // Implementation for saving strategy
  };

  const buildStrategy = () => {
    setIsBuilding(true);
    // Simulate building process
    setTimeout(() => {
      setIsBuilding(false);
      console.log('Strategy built successfully!');
    }, 2000);
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'indicator': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'condition': return 'bg-green-100 text-green-700 border-green-200';
      case 'action': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'filter': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              Strategy Builder
            </h1>
            <p className="text-gray-600 mt-1">Create custom trading strategies with visual building blocks</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={saveStrategy}>
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button 
              className="flex items-center gap-2" 
              onClick={buildStrategy}
              disabled={isBuilding || currentStrategy.blocks.length === 0}
            >
              {isBuilding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Building...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Build Strategy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Strategy Blocks Library */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Building Blocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="indicators" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="indicators">Indicators</TabsTrigger>
                    <TabsTrigger value="logic">Logic</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="indicators" className="space-y-2">
                    {availableBlocks.filter(block => block.type === 'indicator').map((block) => {
                      const IconComponent = block.icon;
                      return (
                        <div
                          key={block.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getBlockTypeColor(block.type)}`}
                          onClick={() => addBlock(block)}
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium text-sm">{block.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                  
                  <TabsContent value="logic" className="space-y-2">
                    {availableBlocks.filter(block => ['condition', 'action', 'filter'].includes(block.type)).map((block) => {
                      const IconComponent = block.icon;
                      return (
                        <div
                          key={block.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getBlockTypeColor(block.type)}`}
                          onClick={() => addBlock(block)}
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="font-medium text-sm">{block.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Canvas */}
          <div className="col-span-6">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Strategy Canvas
                  </div>
                  <Badge variant="outline">{currentStrategy.blocks.length} blocks</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {currentStrategy.blocks.length === 0 ? (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Start Building Your Strategy</h3>
                      <p className="text-gray-500">Drag blocks from the library to create your trading strategy</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 h-full overflow-y-auto">
                    {currentStrategy.blocks.map((block, index) => {
                      const IconComponent = block.icon;
                      return (
                        <div
                          key={block.id}
                          className={`p-4 rounded-lg border ${getBlockTypeColor(block.type)} relative group`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-5 w-5" />
                              <div>
                                <div className="font-medium">{block.name}</div>
                                <div className="text-xs opacity-75">
                                  {block.type.charAt(0).toUpperCase() + block.type.slice(1)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeBlock(block.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Connection indicator */}
                          {index < currentStrategy.blocks.length - 1 && (
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Strategy Settings */}
          <div className="col-span-3">
            <div className="space-y-6">
              {/* Strategy Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Strategy Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Strategy Name</Label>
                    <Input 
                      value={currentStrategy.name}
                      onChange={(e) => setCurrentStrategy(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input 
                      value={currentStrategy.description}
                      onChange={(e) => setCurrentStrategy(prev => ({...prev, description: e.target.value}))}
                      placeholder="Strategy description..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Timeframe</Label>
                    <Select 
                      value={currentStrategy.settings.timeframe}
                      onValueChange={(value) => setCurrentStrategy(prev => ({
                        ...prev, 
                        settings: {...prev.settings, timeframe: value}
                      }))}
                    >
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
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select 
                      value={currentStrategy.settings.riskLevel}
                      onValueChange={(value) => setCurrentStrategy(prev => ({
                        ...prev, 
                        settings: {...prev.settings, riskLevel: value}
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Positions</Label>
                    <Input 
                      type="number"
                      value={currentStrategy.settings.maxPositions}
                      onChange={(e) => setCurrentStrategy(prev => ({
                        ...prev, 
                        settings: {...prev.settings, maxPositions: Number(e.target.value)}
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stop Loss (%)</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={currentStrategy.settings.stopLoss}
                      onChange={(e) => setCurrentStrategy(prev => ({
                        ...prev, 
                        settings: {...prev.settings, stopLoss: Number(e.target.value)}
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Take Profit (%)</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={currentStrategy.settings.takeProfit}
                      onChange={(e) => setCurrentStrategy(prev => ({
                        ...prev, 
                        settings: {...prev.settings, takeProfit: Number(e.target.value)}
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Strategy
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Optimize
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Backtest
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 