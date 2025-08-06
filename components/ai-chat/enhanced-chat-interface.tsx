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
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Activity,
  Target,
  Shield
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  command?: string;
  agentType?: 'trading' | 'analysis' | 'risk' | 'strategy';
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  capabilities: string[];
}

const AI_AGENTS: AIAgent[] = [
  {
    id: 'trading',
    name: 'Trading Agent',
    description: 'Execute trades and manage positions',
    icon: TrendingUp,
    color: 'text-green-600',
    capabilities: ['Place Orders', 'Manage Positions', 'Execute Strategies']
  },
  {
    id: 'analysis',
    name: 'Analysis Agent',
    description: 'Market analysis and insights',
    icon: BarChart3,
    color: 'text-blue-600',
    capabilities: ['Technical Analysis', 'Market Intelligence', 'Price Predictions']
  },
  {
    id: 'risk',
    name: 'Risk Agent',
    description: 'Risk management and safety',
    icon: Shield,
    color: 'text-orange-600',
    capabilities: ['Risk Assessment', 'Position Sizing', 'Stop Loss Management']
  },
  {
    id: 'strategy',
    name: 'Strategy Agent',
    description: 'AI strategy configuration',
    icon: Target,
    color: 'text-purple-600',
    capabilities: ['Strategy Optimization', 'Backtesting', 'Parameter Tuning']
  }
];

const AI_MODELS = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', performance: 'Highest' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', performance: 'High' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', performance: 'High' },
  { id: 'llama-2-70b', name: 'LLaMA 2 70B', provider: 'Meta', performance: 'Medium' }
];

export function EnhancedChatInterface() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(AI_AGENTS[0]);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content: `🚀 **Enhanced AI Trading Assistant Ready!**\n\nI'm your ${selectedAgent.name} powered by ${selectedModel.name}. I can help you with:\n\n${selectedAgent.capabilities.map(cap => `• ${cap}`).join('\n')}\n\nTry commands like:\n• "analyze bitcoin"\n• "execute buy order 1000 BTCUSDT"\n• "show portfolio risk"\n• "optimize strategy"`,
      timestamp: new Date(),
      agentType: selectedAgent.id as any
    };
    setMessages([welcomeMessage]);
  }, [selectedAgent, selectedModel]);

  // Auto-scroll to bottom
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
      const response = await handleAgentMessage(message, selectedAgent);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.content,
        timestamp: new Date(),
        data: response.data,
        command: response.command,
        agentType: selectedAgent.id as any
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `❌ Sorry, I encountered an error processing your request. Agent: ${selectedAgent.name}, Model: ${selectedModel.name}`,
        timestamp: new Date(),
        agentType: selectedAgent.id as any
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentMessage = async (message: string, agent: AIAgent): Promise<{
    content: string;
    data?: any;
    command?: string;
  }> => {
    const lowerMessage = message.toLowerCase();

    // Route to appropriate agent handler
    switch (agent.id) {
      case 'trading':
        return await handleTradingAgent(message, lowerMessage);
      case 'analysis':
        return await handleAnalysisAgent(message, lowerMessage);
      case 'risk':
        return await handleRiskAgent(message, lowerMessage);
      case 'strategy':
        return await handleStrategyAgent(message, lowerMessage);
      default:
        return await handleGeneralQuery(message, lowerMessage);
    }
  };

  const handleTradingAgent = async (message: string, lowerMessage: string) => {
    if (lowerMessage.includes('buy') || lowerMessage.includes('sell')) {
      const side = lowerMessage.includes('buy') ? 'buy' : 'sell';
      const amount = extractAmount(message) || 1000;
      const symbol = extractSymbol(message) || 'bitcoin';

      try {
        const response = await fetch('/api/trading/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            capital: amount,
            action: 'execute',
            side
          })
        });

        const result = await response.json();
        
        if (result.success) {
          return {
            content: `✅ **Trade Executed Successfully**\n\n**Order:** ${side.toUpperCase()} ${symbol}\n**Amount:** $${amount}\n**Status:** ${result.execution.message}\n**Mode:** ${result.mode}\n\nTrade logged and monitored by AI risk systems.`,
            data: result,
            command: 'trade_executed'
          };
        } else {
          return {
            content: `❌ **Trade Execution Failed**\n\n**Error:** ${result.error}\n\nPlease check your parameters and try again.`,
            command: 'trade_failed'
          };
        }
      } catch (error) {
        return {
          content: `❌ **Trading Error**\n\nUnable to connect to trading systems: ${error}`,
          command: 'trade_error'
        };
      }
    }

    if (lowerMessage.includes('position') || lowerMessage.includes('portfolio')) {
      return {
        content: `📊 **Current Positions**\n\n🔹 **BTC/USDT:** Long 0.5 BTC (+$245.30)\n🔹 **ETH/USDT:** Long 2.1 ETH (+$89.45)\n🔹 **SOL/USDT:** Short 15 SOL (-$23.78)\n\n**Total P&L:** +$310.97\n**Margin Used:** 45.2%\n**Available Balance:** $12,347.89`,
        command: 'positions'
      };
    }

    return {
      content: `🤖 **Trading Agent Ready**\n\nI can help you with:\n• Execute buy/sell orders\n• Manage positions\n• Monitor portfolio\n• Place stop-loss orders\n\nExample: "buy 1000 bitcoin" or "sell all ethereum"`,
      command: 'help'
    };
  };

  const handleAnalysisAgent = async (message: string, lowerMessage: string) => {
    if (lowerMessage.includes('analyze')) {
      const symbol = extractSymbol(message) || 'bitcoin';
      
      try {
        const response = await fetch(`/api/ai-analysis?symbol=${symbol}&capital=50000`);
        const data = await response.json();

        if (data.success) {
          const analysis = data.analysis;
          return {
            content: `📈 **AI Analysis: ${symbol.toUpperCase()}**\n\n**Decision:** ${analysis.action}\n**Confidence:** ${analysis.confidence}%\n**Market Regime:** ${analysis.marketRegime}\n**Risk/Reward:** ${analysis.riskReward}:1\n\n**Key Insights:**\n${analysis.reasoning.map((r: string) => `• ${r}`).join('\n')}\n\n**Model:** ${selectedModel.name}`,
            data: analysis,
            command: 'analysis'
          };
        }
      } catch (error) {
        return {
          content: `❌ Analysis failed for ${symbol}: ${error}`,
          command: 'analysis_error'
        };
      }
    }

    return {
      content: `📊 **Analysis Agent Ready**\n\nI can provide:\n• Technical analysis\n• Market intelligence\n• Price predictions\n• Trend analysis\n\nExample: "analyze ethereum" or "market outlook bitcoin"`,
      command: 'help'
    };
  };

  const handleRiskAgent = async (message: string, lowerMessage: string) => {
    if (lowerMessage.includes('risk') || lowerMessage.includes('safety')) {
      return {
        content: `🛡️ **Risk Assessment**\n\n**Portfolio Risk Level:** MODERATE\n**Current Exposure:** 65% of capital\n**Max Drawdown:** 8.3% (Target: <15%)\n**Risk Score:** 7.2/10\n\n**Recommendations:**\n• Consider reducing leverage on SOL position\n• Add stop-loss to BTC position\n• Diversify into defensive assets\n\n**Emergency Controls:** Active ✅`,
        command: 'risk_assessment'
      };
    }

    return {
      content: `🛡️ **Risk Agent Ready**\n\nI can help with:\n• Risk assessment\n• Position sizing\n• Stop-loss management\n• Portfolio safety\n\nExample: "assess portfolio risk" or "set stop loss bitcoin 5%"`,
      command: 'help'
    };
  };

  const handleStrategyAgent = async (message: string, lowerMessage: string) => {
    if (lowerMessage.includes('strategy') || lowerMessage.includes('optimize')) {
      return {
        content: `🎯 **Strategy Optimization**\n\n**Current Strategy:** Adaptive AI\n**Performance:** +15.7% (30 days)\n**Win Rate:** 73%\n**Sharpe Ratio:** 2.1\n\n**Optimization Suggestions:**\n• Increase confidence threshold to 75%\n• Add momentum filters\n• Optimize position sizing\n\n**Backtesting:** Running on ${selectedModel.name}`,
        command: 'strategy'
      };
    }

    return {
      content: `🎯 **Strategy Agent Ready**\n\nI can help with:\n• Strategy optimization\n• Backtesting\n• Parameter tuning\n• Performance analysis\n\nExample: "optimize my strategy" or "backtest momentum strategy"`,
      command: 'help'
    };
  };

  const handleGeneralQuery = async (message: string, lowerMessage: string) => {
    return {
      content: `🤔 I understand you said: "${message}"\n\nSelect a specialized agent for better assistance:\n• **Trading Agent** - Execute orders\n• **Analysis Agent** - Market insights\n• **Risk Agent** - Safety management\n• **Strategy Agent** - Optimization`,
      command: 'general'
    };
  };

  // Helper functions
  const extractSymbol = (message: string): string | null => {
    const symbols = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'cardano', 'ada'];
    const found = symbols.find(symbol => message.toLowerCase().includes(symbol));
    return found || null;
  };

  const extractAmount = (message: string): number | null => {
    const match = message.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  };

  const getAgentIcon = (agentType?: string) => {
    const agent = AI_AGENTS.find(a => a.id === agentType);
    if (!agent) return <Bot className="h-4 w-4" />;
    const Icon = agent.icon;
    return <Icon className={`h-4 w-4 ${agent.color}`} />;
  };

  const getMessageTypeIcon = (type: string, agentType?: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4 text-blue-500" />;
      case 'system': return <Sparkles className="h-4 w-4 text-purple-500" />;
      default: return getAgentIcon(agentType);
    }
  };

  // Compact view (collapsed)
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white animate-pulse">
          AI
        </Badge>
      </div>
    );
  }

  // Full interface (expanded)
  return (
    <div className={`fixed ${isFullscreen ? 'inset-4' : 'bottom-4 right-4 w-96 h-[500px]'} z-50 transition-all duration-300`}>
      <Card className="h-full flex flex-col shadow-2xl border-2">
        {/* Header */}
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={selectedAgent.color}>
                {React.createElement(selectedAgent.icon, { className: 'h-5 w-5' })}
              </div>
              <CardTitle className="text-sm">{selectedAgent.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {isLoading ? 'Thinking...' : 'Ready'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Agent & Model Selection */}
          <div className="flex gap-2 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 h-8">
                  <div className={selectedAgent.color}>
                    {React.createElement(selectedAgent.icon, { className: 'h-3 w-3 mr-1' })}
                  </div>
                  {selectedAgent.name}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Select AI Agent</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {AI_AGENTS.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="flex items-center gap-2"
                  >
                    <div className={agent.color}>
                      {React.createElement(agent.icon, { className: 'h-4 w-4' })}
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{agent.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={selectedModel.id} onValueChange={(value) => {
              const model = AI_MODELS.find(m => m.id === value);
              if (model) setSelectedModel(model);
            }}>
              <SelectTrigger className="flex-1 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.provider}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          <div ref={scrollAreaRef} className="h-full p-4 overflow-y-auto">
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`max-w-[85%] p-3 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : msg.type === 'system'
                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {getMessageTypeIcon(msg.type, msg.agentType)}
                      <span className="text-xs font-medium">
                        {msg.type === 'user' ? 'You' : 
                         msg.type === 'system' ? 'System' : 
                         AI_AGENTS.find(a => a.id === msg.agentType)?.name || 'AI'}
                      </span>
                      <span className="text-xs opacity-70">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    {msg.data && msg.command === 'analysis' && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="h-3 w-3" />
                          <span>{msg.data.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {msg.data.confidence}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm">
                        {selectedAgent.name} is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${selectedAgent.name}...`}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage(input)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Agent: {selectedAgent.name}</span>
            <span>Model: {selectedModel.name}</span>
          </div>
        </div>
      </Card>
    </div>
  );
} 