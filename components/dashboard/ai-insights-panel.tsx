'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw, 
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Target,
  Zap,
  Lightbulb,
  Network,
  Search,
  Calendar
} from 'lucide-react';

// TypeScript interfaces for AI insights
interface PatternRecognition {
  id: string;
  pattern: string;
  confidence: number;
  description: string;
  symbol: string;
  timeframe: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  probability: number;
  expectedMove: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  detected: Date;
}

interface MarketRegimeAnalysis {
  current: 'BULL' | 'BEAR' | 'RANGE' | 'VOLATILE';
  confidence: number;
  duration: number; // in hours
  characteristics: string[];
  nextRegimeProb: {
    BULL: number;
    BEAR: number;
    RANGE: number;
    VOLATILE: number;
  };
  signals: string[];
}

interface AITradingInsight {
  id: string;
  type: 'OPPORTUNITY' | 'WARNING' | 'ANALYSIS' | 'PATTERN';
  symbol: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  actionable: boolean;
  reasoning: string[];
  generatedAt: Date;
}

interface AIModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  totalPredictions: number;
  correctPredictions: number;
  profitableTrades: number;
  lastUpdated: Date;
  modelVersion: string;
}

interface LearningProgress {
  totalSamples: number;
  newSamplesToday: number;
  modelRetraining: boolean;
  lastRetraining: Date;
  learningRate: number;
  convergenceStatus: 'CONVERGING' | 'CONVERGED' | 'DIVERGING';
  nextRetraining: Date;
}

export function AIInsightsPanel() {
  const [patterns, setPatterns] = useState<PatternRecognition[]>([]);
  const [regimeAnalysis, setRegimeAnalysis] = useState<MarketRegimeAnalysis | null>(null);
  const [insights, setInsights] = useState<AITradingInsight[]>([]);
  const [performance, setPerformance] = useState<AIModelPerformance | null>(null);
  const [learning, setLearning] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'patterns' | 'regime' | 'insights' | 'performance'>('insights');

  useEffect(() => {
    fetchAIInsightsData();
    
    // Set up real-time updates
    const interval = setInterval(fetchAIInsightsData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchAIInsightsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data based on the AI reasoning engine structure
      // In production, these would be real API calls to /api/ai-analysis

      // Mock pattern recognition data
      const mockPatterns: PatternRecognition[] = [
        {
          id: 'pattern_001',
          pattern: 'Double Bottom',
          confidence: 89,
          description: 'Strong reversal pattern detected with volume confirmation',
          symbol: 'BTC/USDT',
          timeframe: '4H',
          strength: 'STRONG',
          probability: 78,
          expectedMove: 3.2,
          riskLevel: 'MEDIUM',
          detected: new Date(Date.now() - 600000)
        },
        {
          id: 'pattern_002',
          pattern: 'Ascending Triangle',
          confidence: 72,
          description: 'Bullish continuation pattern forming near resistance',
          symbol: 'ETH/USDT',
          timeframe: '1D',
          strength: 'MODERATE',
          probability: 65,
          expectedMove: 5.1,
          riskLevel: 'LOW',
          detected: new Date(Date.now() - 1200000)
        },
        {
          id: 'pattern_003',
          pattern: 'Head and Shoulders',
          confidence: 95,
          description: 'Bearish reversal pattern with clear neckline break',
          symbol: 'SOL/USDT',
          timeframe: '1H',
          strength: 'STRONG',
          probability: 82,
          expectedMove: -4.8,
          riskLevel: 'HIGH',
          detected: new Date(Date.now() - 300000)
        }
      ];

      // Mock market regime analysis
      const mockRegime: MarketRegimeAnalysis = {
        current: 'BULL',
        confidence: 84,
        duration: 72, // 3 days
        characteristics: [
          'Strong upward momentum',
          'Higher highs and higher lows',
          'Volume increasing on rallies',
          'RSI above 50 consistently'
        ],
        nextRegimeProb: {
          BULL: 65,
          RANGE: 25,
          VOLATILE: 8,
          BEAR: 2
        },
        signals: [
          'Moving averages aligned bullishly',
          'Institutional buying detected',
          'On-chain metrics positive',
          'Fear & Greed index improving'
        ]
      };

      // Mock AI insights
      const mockInsights: AITradingInsight[] = [
        {
          id: 'insight_001',
          type: 'OPPORTUNITY',
          symbol: 'BTC/USDT',
          title: 'Strong Accumulation Signal Detected',
          description: 'Whale wallets showing significant accumulation pattern with 89% confidence',
          confidence: 89,
          impact: 'HIGH',
          timeframe: '1D',
          actionable: true,
          reasoning: [
            'On-chain analysis shows 12% increase in whale holdings',
            'Exchange outflows accelerating',
            'Technical indicators confirming uptrend',
            'Institutional sentiment turning positive'
          ],
          generatedAt: new Date(Date.now() - 180000)
        },
        {
          id: 'insight_002',
          type: 'WARNING',
          symbol: 'ETH/USDT',
          title: 'Potential Overheating Detected',
          description: 'Multiple overbought indicators suggest potential correction incoming',
          confidence: 76,
          impact: 'MEDIUM',
          timeframe: '4H',
          actionable: true,
          reasoning: [
            'RSI divergence on higher timeframes',
            'Volume declining on recent rallies',
            'Funding rates extremely positive',
            'Social sentiment at euphoric levels'
          ],
          generatedAt: new Date(Date.now() - 420000)
        },
        {
          id: 'insight_003',
          type: 'ANALYSIS',
          symbol: 'SOL/USDT',
          title: 'Consolidation Phase Analysis',
          description: 'Price action suggesting healthy consolidation before next move',
          confidence: 67,
          impact: 'LOW',
          timeframe: '1H',
          actionable: false,
          reasoning: [
            'Price finding support at key levels',
            'Volume profile showing accumulation',
            'Options flow neutral to slightly bullish',
            'Network activity maintaining strength'
          ],
          generatedAt: new Date(Date.now() - 600000)
        }
      ];

      // Mock AI performance metrics
      const mockPerformance: AIModelPerformance = {
        accuracy: 78.5,
        precision: 82.1,
        recall: 74.3,
        f1Score: 78.0,
        totalPredictions: 1247,
        correctPredictions: 979,
        profitableTrades: 156,
        lastUpdated: new Date(Date.now() - 300000),
        modelVersion: 'v2.3.1'
      };

      // Mock learning progress
      const mockLearning: LearningProgress = {
        totalSamples: 45230,
        newSamplesToday: 1247,
        modelRetraining: false,
        lastRetraining: new Date(Date.now() - 86400000), // 1 day ago
        learningRate: 0.001,
        convergenceStatus: 'CONVERGED',
        nextRetraining: new Date(Date.now() + 7 * 86400000) // 7 days from now
      };

      setPatterns(mockPatterns);
      setRegimeAnalysis(mockRegime);
      setInsights(mockInsights);
      setPerformance(mockPerformance);
      setLearning(mockLearning);

    } catch (err) {
      console.error('Error fetching AI insights data:', err);
      setError('Failed to load AI insights data');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return <Target className="h-4 w-4 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'ANALYSIS': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'PATTERN': return <Network className="h-4 w-4 text-purple-600" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-blue-600';
    return 'text-yellow-600';
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

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights Panel
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
      {/* AI System Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              AI Analysis Engine
              <Badge variant="default" className="bg-purple-600">
                Active
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAIInsightsData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {performance && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{performance.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{performance.totalPredictions}</div>
                <div className="text-sm text-muted-foreground">Predictions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{performance.profitableTrades}</div>
                <div className="text-sm text-muted-foreground">Profitable Trades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{performance.modelVersion}</div>
                <div className="text-sm text-muted-foreground">Model Version</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {[
              { key: 'insights', label: 'AI Insights', icon: Lightbulb },
              { key: 'patterns', label: 'Pattern Recognition', icon: Search },
              { key: 'regime', label: 'Market Regime', icon: BarChart3 },
              { key: 'performance', label: 'Performance', icon: Target }
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
      {selectedTab === 'insights' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Real-time AI Insights ({insights.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div 
                  key={insight.id} 
                  className="p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <div className="font-semibold text-sm">{insight.title}</div>
                        <div className="text-xs text-muted-foreground">{insight.symbol} • {insight.timeframe}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={insight.impact === 'HIGH' ? 'destructive' : insight.impact === 'MEDIUM' ? 'default' : 'secondary'}
                      >
                        {insight.impact}
                      </Badge>
                      <div className={`text-sm font-semibold ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}%
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

                  <div className="space-y-1 mb-3">
                    <div className="text-xs font-medium text-muted-foreground">AI Reasoning:</div>
                    {insight.reasoning.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Generated: {formatTimestamp(insight.generatedAt)}
                    </div>
                    {insight.actionable && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Actionable
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'patterns' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Pattern Recognition ({patterns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patterns.map((pattern) => (
                <div 
                  key={pattern.id} 
                  className="p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Network className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{pattern.pattern}</div>
                        <div className="text-sm text-muted-foreground">{pattern.symbol} • {pattern.timeframe}</div>
                      </div>
                    </div>
                    <Badge variant={pattern.strength === 'STRONG' ? 'default' : pattern.strength === 'MODERATE' ? 'secondary' : 'outline'}>
                      {pattern.strength}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{pattern.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                      <div className={`font-semibold ${getConfidenceColor(pattern.confidence)}`}>
                        {pattern.confidence}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Probability</div>
                      <div className="font-semibold">{pattern.probability}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Expected Move</div>
                      <div className={`font-semibold ${pattern.expectedMove >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pattern.expectedMove >= 0 ? '+' : ''}{pattern.expectedMove}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Risk Level</div>
                      <Badge variant={pattern.riskLevel === 'HIGH' ? 'destructive' : pattern.riskLevel === 'MEDIUM' ? 'default' : 'secondary'}>
                        {pattern.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Detected: {formatTimestamp(pattern.detected)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'regime' && regimeAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Market Regime Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Current Regime */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-white to-gray-50 border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`px-3 py-1 ${getRegimeColor(regimeAnalysis.current)}`}>
                      {regimeAnalysis.current} MARKET
                    </Badge>
                    <div className={`font-semibold ${getConfidenceColor(regimeAnalysis.confidence)}`}>
                      {regimeAnalysis.confidence}% confidence
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Duration: {Math.round(regimeAnalysis.duration)}h
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Market Characteristics</h4>
                    <div className="space-y-1">
                      {regimeAnalysis.characteristics.map((char, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span>{char}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Signals</h4>
                    <div className="space-y-1">
                      {regimeAnalysis.signals.map((signal, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Zap className="h-3 w-3 text-blue-600" />
                          <span>{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Regime Probabilities */}
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-3">Next Regime Probabilities</h4>
                <div className="space-y-3">
                  {Object.entries(regimeAnalysis.nextRegimeProb).map(([regime, prob]) => (
                    <div key={regime} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{regime}</span>
                        <span className="text-sm font-semibold">{prob}%</span>
                      </div>
                      <Progress value={prob} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'performance' && performance && learning && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Model Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-green-600">{performance.accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">Accuracy</div>
                  <Progress value={performance.accuracy} className="mt-2" />
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-blue-600">{performance.precision.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">Precision</div>
                  <Progress value={performance.precision} className="mt-2" />
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-purple-600">{performance.recall.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">Recall</div>
                  <Progress value={performance.recall} className="mt-2" />
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-orange-600">{performance.f1Score.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">F1 Score</div>
                  <Progress value={performance.f1Score} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Training Samples</span>
                    <span className="font-semibold">{learning.totalSamples.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">New Samples Today</span>
                    <span className="font-semibold text-green-600">+{learning.newSamplesToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Learning Rate</span>
                    <span className="font-semibold">{learning.learningRate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Convergence Status</span>
                    <Badge variant={learning.convergenceStatus === 'CONVERGED' ? 'default' : 'secondary'}>
                      {learning.convergenceStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model Retraining</span>
                    <Badge variant={learning.modelRetraining ? 'default' : 'secondary'}>
                      {learning.modelRetraining ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Retraining</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(learning.lastRetraining)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next Retraining</span>
                    <span className="text-xs text-muted-foreground">
                      {learning.nextRetraining.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}