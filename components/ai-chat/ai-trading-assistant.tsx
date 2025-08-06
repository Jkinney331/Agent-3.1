'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react'

interface AIThought {
  id: string
  stage: string
  thought: string
  confidence: number
  data: any
  timestamp: Date
  status: 'thinking' | 'complete' | 'error'
}

interface TradingDecision {
  id: string
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  strategy: string
  confidence: number
  reasoning: string
  marketConditions: any
  timestamp: Date
  status: 'pending' | 'executed' | 'rejected'
}

interface N8NWorkflowStep {
  id: string
  workflowId: string
  stepName: string
  status: 'pending' | 'running' | 'success' | 'error'
  data: any
  error?: string
  timestamp: Date
}

export default function AITradingAssistant() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiThoughts, setAIThoughts] = useState<AIThought[]>([])
  const [currentDecision, setCurrentDecision] = useState<TradingDecision | null>(null)
  const [workflowSteps, setWorkflowSteps] = useState<N8NWorkflowStep[]>([])
  const [tradingMode, setTradingMode] = useState<'manual' | 'auto'>('manual')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, aiThoughts])

  // Simulate AI thinking process
  const simulateAIThinking = async (userInput: string) => {
    setIsProcessing(true)
    setAIThoughts([])
    setWorkflowSteps([])

    const thinkingStages = [
      {
        stage: 'Data Collection',
        thought: 'Gathering market data from multiple sources...',
        confidence: 0.9
      },
      {
        stage: 'Technical Analysis',
        thought: 'Analyzing price patterns, volume, and technical indicators...',
        confidence: 0.85
      },
      {
        stage: 'Sentiment Analysis',
        thought: 'Processing social media sentiment and news impact...',
        confidence: 0.75
      },
      {
        stage: 'Risk Assessment',
        thought: 'Evaluating portfolio risk and position sizing...',
        confidence: 0.95
      },
      {
        stage: 'Strategy Selection',
        thought: 'Choosing optimal strategy based on market conditions...',
        confidence: 0.88
      },
      {
        stage: 'Decision Making',
        thought: 'Finalizing trade decision with confidence scoring...',
        confidence: 0.92
      }
    ]

    // Simulate N8N workflow steps
    const workflowSteps = [
      { stepName: 'Market Data Retrieval', workflowId: 'market-intelligence' },
      { stepName: 'Technical Indicator Calculation', workflowId: 'market-intelligence' },
      { stepName: 'Risk Management Check', workflowId: 'risk-management' },
      { stepName: 'Strategy Evaluation', workflowId: 'master-orchestrator' },
      { stepName: 'Trade Execution Preparation', workflowId: 'master-orchestrator' }
    ]

    // Add workflow steps
    for (let i = 0; i < workflowSteps.length; i++) {
      const step: N8NWorkflowStep = {
        id: `step-${i}`,
        workflowId: workflowSteps[i].workflowId,
        stepName: workflowSteps[i].stepName,
        status: 'running',
        data: {},
        timestamp: new Date()
      }
      
      setWorkflowSteps(prev => [...prev, step])
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Update to success
      setWorkflowSteps(prev => 
        prev.map(s => 
          s.id === step.id 
            ? { ...s, status: 'success', data: { result: 'completed' } }
            : s
        )
      )
    }

    // Add thinking stages
    for (let i = 0; i < thinkingStages.length; i++) {
      const thought: AIThought = {
        id: `thought-${i}`,
        stage: thinkingStages[i].stage,
        thought: thinkingStages[i].thought,
        confidence: thinkingStages[i].confidence,
        data: { stage: i + 1, total: thinkingStages.length },
        timestamp: new Date(),
        status: 'thinking'
      }

      setAIThoughts(prev => [...prev, thought])
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mark as complete
      setAIThoughts(prev => 
        prev.map(t => 
          t.id === thought.id 
            ? { ...t, status: 'complete' }
            : t
        )
      )
    }

    // Generate a trading decision
    const decision: TradingDecision = {
      id: `decision-${Date.now()}`,
      symbol: 'BTC/USD',
      action: 'buy',
      strategy: 'Momentum + Sentiment Convergence',
      confidence: 0.87,
      reasoning: 'Strong bullish momentum confirmed by technical indicators. Positive sentiment shift detected in social media. Risk/reward ratio favors entry at current levels.',
      marketConditions: {
        trend: 'bullish',
        volatility: 'moderate',
        volume: 'high',
        sentiment: 'positive'
      },
      timestamp: new Date(),
      status: 'pending'
    }

    setCurrentDecision(decision)
    setIsProcessing(false)

    // Add AI response to messages
    const aiResponse = {
      id: Date.now(),
      type: 'ai',
      content: `Based on my analysis, I recommend a ${decision.action.toUpperCase()} position on ${decision.symbol} using ${decision.strategy} strategy with ${(decision.confidence * 100).toFixed(1)}% confidence.`,
      decision,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, aiResponse])
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Process AI response
    await simulateAIThinking(input)
  }

  const executeDecision = async () => {
    if (!currentDecision) return

    setCurrentDecision(prev => prev ? { ...prev, status: 'executed' } : null)
    
    // Add execution message
    const executionMessage = {
      id: Date.now(),
      type: 'system',
      content: `✅ Trade executed: ${currentDecision.action.toUpperCase()} ${currentDecision.symbol}`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, executionMessage])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'thinking':
      case 'running':
        return <Clock className="h-4 w-4 animate-spin" />
      case 'complete':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thinking':
      case 'running':
        return 'bg-blue-500'
      case 'complete':
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Main Chat Interface */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Trading Assistant
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={tradingMode === 'auto' ? 'default' : 'secondary'}>
                  {tradingMode.toUpperCase()} Mode
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTradingMode(tradingMode === 'auto' ? 'manual' : 'auto')}
                >
                  Switch to {tradingMode === 'auto' ? 'Manual' : 'Auto'}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.type === 'system'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.decision && (
                      <div className="mt-2 p-2 bg-white/10 rounded text-sm">
                        <p><strong>Strategy:</strong> {message.decision.strategy}</p>
                        <p><strong>Confidence:</strong> {(message.decision.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about market analysis or trading decisions..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isProcessing}
              />
              <Button onClick={handleSendMessage} disabled={isProcessing}>
                {isProcessing ? 'Thinking...' : 'Send'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Thought Process & Workflow */}
      <div className="space-y-6">
        <Tabs defaultValue="thoughts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="thoughts">AI Thoughts</TabsTrigger>
            <TabsTrigger value="workflow">Trading Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="thoughts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Reasoning Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiThoughts.map((thought) => (
                  <div key={thought.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(thought.status)}
                        <span className="text-sm font-medium">{thought.stage}</span>
                      </div>
                      <Badge variant="outline">
                        {(thought.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{thought.thought}</p>
                    <Progress 
                      value={thought.confidence * 100} 
                      className="h-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trading Workflow Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workflowSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(step.status)}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.stepName}</p>
                      <p className="text-xs text-gray-500">{step.workflowId}</p>
                    </div>
                    {getStatusIcon(step.status)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Current Decision */}
        {currentDecision && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  {currentDecision.action.toUpperCase()} {currentDecision.symbol}
                </span>
                <Badge 
                  variant={currentDecision.status === 'executed' ? 'default' : 'secondary'}
                >
                  {currentDecision.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm"><strong>Strategy:</strong> {currentDecision.strategy}</p>
                <p className="text-sm"><strong>Confidence:</strong> {(currentDecision.confidence * 100).toFixed(1)}%</p>
                <p className="text-sm text-gray-600">{currentDecision.reasoning}</p>
              </div>

              {currentDecision.status === 'pending' && (
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This decision is pending approval. Review the analysis before executing.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button onClick={executeDecision} className="flex-1">
                      Execute Trade
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentDecision(null)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 