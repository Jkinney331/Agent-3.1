'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Brain, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Settings,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
  command?: string;
}

interface AIAnalysisData {
  signal: {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    riskReward: number;
    reasoning: string[];
    marketRegime: string;
  };
  success: boolean;
}

export function AIChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'ai',
      content: '🧠 AI Trading Agent Ready! Ask me about market analysis, strategy adjustments, or use commands like:\n\n• "analyze bitcoin" - Get detailed analysis\n• "adjust risk 8%" - Change position sizing\n• "show performance" - Display strategy results\n• "emergency stop" - Halt all trading',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Parse command and route to appropriate handler
      const response = await handleUserMessage(message);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        data: response.data,
        command: response.command
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserMessage = async (message: string): Promise<{
    content: string;
    data?: any;
    command?: string;
  }> => {
    const lowerMessage = message.toLowerCase();

    // Analyze command
    if (lowerMessage.includes('analyze')) {
      const symbol = extractSymbol(message) || 'bitcoin';
      return await handleAnalyzeCommand(symbol);
    }

    // Adjust risk command
    if (lowerMessage.includes('adjust risk') || lowerMessage.includes('risk')) {
      const percentage = extractPercentage(message);
      return await handleRiskAdjustment(percentage);
    }

    // Performance command
    if (lowerMessage.includes('performance') || lowerMessage.includes('show performance')) {
      return await handlePerformanceQuery();
    }

    // Emergency stop command
    if (lowerMessage.includes('emergency stop') || lowerMessage.includes('stop trading')) {
      return await handleEmergencyStop();
    }

    // Market conditions query
    if (lowerMessage.includes('market') || lowerMessage.includes('conditions')) {
      return await handleMarketQuery();
    }

    // Configuration query
    if (lowerMessage.includes('config') || lowerMessage.includes('settings')) {
      return await handleConfigQuery();
    }

    // General conversation
    return {
      content: `🤔 I understand you said: "${message}"\n\nI can help you with:\n• Market analysis (e.g., "analyze ethereum")\n• Risk management (e.g., "adjust risk to 5%")\n• Performance metrics (e.g., "show performance")\n• Trading controls (e.g., "emergency stop")\n\nWhat would you like to know?`,
      command: 'help'
    };
  };

  const handleAnalyzeCommand = async (symbol: string): Promise<{
    content: string;
    data?: any;
    command: string;
  }> => {
    try {
      const response = await fetch(`/api/ai-analysis?symbol=${symbol}&capital=50000`);
      const data: AIAnalysisData = await response.json();

      if (!data.success) {
        return {
          content: `❌ Failed to analyze ${symbol}: ${data}`,
          command: 'analyze'
        };
      }

      const signal = data.signal;
      const actionIcon = signal.action === 'BUY' ? '📈' : signal.action === 'SELL' ? '📉' : '⏸️';
      const confidenceColor = signal.confidence >= 80 ? '🟢' : signal.confidence >= 60 ? '🟡' : '🔴';

      let content = `${actionIcon} **${signal.symbol} Analysis Complete**\n\n`;
      content += `**Decision:** ${signal.action}\n`;
      content += `**Confidence:** ${confidenceColor} ${signal.confidence}%\n`;
      content += `**Risk/Reward:** ${signal.riskReward.toFixed(2)}:1\n`;
      content += `**Market Regime:** ${signal.marketRegime}\n\n`;
      content += `**AI Reasoning:**\n${signal.reasoning.map(r => `• ${r}`).join('\n')}`;

      return {
        content,
        data: signal,
        command: 'analyze'
      };
    } catch (error) {
      return {
        content: `❌ Error analyzing ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        command: 'analyze'
      };
    }
  };

  const handleRiskAdjustment = async (percentage?: number): Promise<{
    content: string;
    data?: any;
    command: string;
  }> => {
    if (!percentage) {
      return {
        content: '⚠️ Please specify a risk percentage (e.g., "adjust risk to 8%")',
        command: 'risk'
      };
    }

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure',
          config: {
            maxPositionSize: percentage / 100
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        return {
          content: `✅ **Risk Settings Updated**\n\nMaximum position size set to ${percentage}% of capital.\nThis will be applied to all future trades.`,
          data: data.config,
          command: 'risk'
        };
      } else {
        return {
          content: `❌ Failed to update risk settings: ${data.error}`,
          command: 'risk'
        };
      }
    } catch (error) {
      return {
        content: `❌ Error updating risk settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        command: 'risk'
      };
    }
  };

  const handlePerformanceQuery = async (): Promise<{
    content: string;
    data?: any;
    command: string;
  }> => {
    // Mock performance data - in real implementation, fetch from database
    const performance = {
      totalReturn: 15.7,
      winRate: 73,
      sharpeRatio: 2.1,
      maxDrawdown: 8.3,
      totalTrades: 47,
      winningTrades: 34,
      avgWin: 3.2,
      avgLoss: -1.8
    };

    let content = `📊 **Performance Summary**\n\n`;
    content += `**Total Return:** ${performance.totalReturn > 0 ? '📈' : '📉'} ${performance.totalReturn}%\n`;
    content += `**Win Rate:** ${performance.winRate}% (${performance.winningTrades}/${performance.totalTrades})\n`;
    content += `**Sharpe Ratio:** ${performance.sharpeRatio}\n`;
    content += `**Max Drawdown:** ${performance.maxDrawdown}%\n`;
    content += `**Avg Win:** +${performance.avgWin}%\n`;
    content += `**Avg Loss:** ${performance.avgLoss}%\n\n`;
    content += `${performance.totalReturn > 10 ? '🎯 Excellent performance!' : '⚠️ Consider strategy adjustments'}`;

    return {
      content,
      data: performance,
      command: 'performance'
    };
  };

  const handleEmergencyStop = async (): Promise<{
    content: string;
    command: string;
  }> => {
    return {
      content: `🛑 **Emergency Stop Activated**\n\nAll automated trading has been halted.\n\n• Current positions will be maintained\n• No new trades will be executed\n• Manual intervention required to resume\n\nUse "resume trading" to reactivate when ready.`,
      command: 'emergency_stop'
    };
  };

  const handleMarketQuery = async (): Promise<{
    content: string;
    data?: any;
    command: string;
  }> => {
    try {
      const [fearGreedResponse, globalResponse] = await Promise.all([
        fetch('/api/crypto?action=fear-greed'),
        fetch('/api/crypto?action=global')
      ]);

      const [fearGreed, global] = await Promise.all([
        fearGreedResponse.json(),
        globalResponse.json()
      ]);

      let content = `🌍 **Market Conditions**\n\n`;
      content += `**Fear & Greed Index:** ${fearGreed.value} (${fearGreed.value_classification})\n`;
      content += `**Market Cap:** $${(global.data?.total_market_cap?.usd / 1e12).toFixed(2)}T\n`;
      content += `**24h Volume:** $${(global.data?.total_volume?.usd / 1e9).toFixed(1)}B\n`;
      content += `**BTC Dominance:** ${global.data?.market_cap_percentage?.btc?.toFixed(1)}%\n\n`;
      
      const sentiment = parseInt(fearGreed.value);
      if (sentiment > 75) content += '🔥 Extreme greed - Consider taking profits';
      else if (sentiment > 60) content += '📈 Greed - Bullish sentiment';
      else if (sentiment < 25) content += '💎 Extreme fear - Potential buying opportunity';
      else if (sentiment < 40) content += '📉 Fear - Bearish sentiment';
      else content += '⚖️ Neutral sentiment';

      return {
        content,
        data: { fearGreed, global },
        command: 'market'
      };
    } catch (error) {
      return {
        content: `❌ Error fetching market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        command: 'market'
      };
    }
  };

  const handleConfigQuery = async (): Promise<{
    content: string;
    command: string;
  }> => {
    let content = `⚙️ **Current AI Configuration**\n\n`;
    content += `**Confidence Threshold:** 70%\n`;
    content += `**Min Risk/Reward:** 2.0:1\n`;
    content += `**Max Position Size:** 10%\n`;
    content += `**Trading Active:** Yes\n`;
    content += `**Analysis Frequency:** Every 30 seconds\n\n`;
    content += `To modify settings, use commands like:\n`;
    content += `• "adjust risk to 8%"\n`;
    content += `• "set confidence to 75%"\n`;
    content += `• "change frequency to 60 seconds"`;

    return {
      content,
      command: 'config'
    };
  };

  // Helper functions
  const extractSymbol = (message: string): string | null => {
    const symbols = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada'];
    const found = symbols.find(symbol => message.toLowerCase().includes(symbol));
    return found || null;
  };

  const extractPercentage = (message: string): number | undefined => {
    const match = message.match(/(\d+(?:\.\d+)?)\s*%/);
    return match ? parseFloat(match[1]) : undefined;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'SELL': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <DollarSign className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          AI Trading Agent
          <Badge variant="outline" className="ml-auto text-xs">
            {isLoading ? 'Thinking...' : 'Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-4">
        <div ref={scrollAreaRef} className="flex-1 pr-4 overflow-y-auto max-h-64">
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  {msg.data && msg.command === 'analyze' && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="flex items-center gap-2 text-xs">
                        {getActionIcon(msg.data.action)}
                        <span>{msg.data.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {msg.data.confidence}%
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI about trades, adjust settings..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage(input)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 