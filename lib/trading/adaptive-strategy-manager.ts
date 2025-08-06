import { tradingDB } from '@/lib/database/supabase-client'

export interface MarketCondition {
  trend: 'bullish' | 'bearish' | 'sideways'
  volatility: 'low' | 'moderate' | 'high' | 'extreme'
  volume: 'low' | 'normal' | 'high' | 'exceptional'
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
  momentum: 'strong_down' | 'down' | 'flat' | 'up' | 'strong_up'
  liquidity: 'low' | 'normal' | 'high'
  newsImpact: 'none' | 'low' | 'moderate' | 'high' | 'extreme'
}

export interface TradingStrategy {
  id: string
  name: string
  description: string
  suitableConditions: Partial<MarketCondition>[]
  riskLevel: 'low' | 'moderate' | 'high'
  expectedReturn: number
  maxDrawdown: number
  timeHorizon: 'scalping' | 'day' | 'swing' | 'position'
  confidence: number
  lastPerformance: {
    winRate: number
    avgReturn: number
    sharpeRatio: number
    maxDrawdown: number
  }
}

export interface StrategySignal {
  strategy: TradingStrategy
  signal: 'buy' | 'sell' | 'hold'
  strength: number // 0-1
  confidence: number // 0-1
  reasoning: string
  exitConditions: string[]
  stopLoss: number
  takeProfit: number
}

export class AdaptiveStrategyManager {
  private strategies: TradingStrategy[] = []
  private currentMarketCondition: MarketCondition | null = null
  private activeStrategies: Set<string> = new Set()

  constructor() {
    this.initializeStrategies()
  }

  private initializeStrategies() {
    this.strategies = [
      {
        id: 'momentum_breakout',
        name: 'Momentum Breakout',
        description: 'Identifies and trades breakouts with strong momentum confirmation',
        suitableConditions: [
          {
            trend: 'bullish',
            volatility: 'moderate',
            volume: 'high',
            momentum: 'strong_up'
          },
          {
            trend: 'bearish',
            volatility: 'moderate',
            volume: 'high',
            momentum: 'strong_down'
          }
        ],
        riskLevel: 'moderate',
        expectedReturn: 0.15,
        maxDrawdown: 0.08,
        timeHorizon: 'day',
        confidence: 0.85,
        lastPerformance: {
          winRate: 0.65,
          avgReturn: 0.12,
          sharpeRatio: 1.8,
          maxDrawdown: 0.06
        }
      },
      {
        id: 'mean_reversion',
        name: 'Mean Reversion',
        description: 'Trades oversold/overbought conditions in ranging markets',
        suitableConditions: [
          {
            trend: 'sideways',
            volatility: 'low',
            volume: 'normal',
            momentum: 'flat'
          }
        ],
        riskLevel: 'low',
        expectedReturn: 0.08,
        maxDrawdown: 0.04,
        timeHorizon: 'swing',
        confidence: 0.75,
        lastPerformance: {
          winRate: 0.72,
          avgReturn: 0.06,
          sharpeRatio: 1.5,
          maxDrawdown: 0.03
        }
      },
      {
        id: 'trend_following',
        name: 'Trend Following',
        description: 'Follows established trends with proper risk management',
        suitableConditions: [
          {
            trend: 'bullish',
            volatility: 'moderate',
            volume: 'normal',
            momentum: 'up'
          },
          {
            trend: 'bearish',
            volatility: 'moderate',
            volume: 'normal',
            momentum: 'down'
          }
        ],
        riskLevel: 'moderate',
        expectedReturn: 0.12,
        maxDrawdown: 0.06,
        timeHorizon: 'swing',
        confidence: 0.80,
        lastPerformance: {
          winRate: 0.68,
          avgReturn: 0.10,
          sharpeRatio: 1.6,
          maxDrawdown: 0.05
        }
      },
      {
        id: 'scalping',
        name: 'High-Frequency Scalping',
        description: 'Quick in-and-out trades on micro price movements',
        suitableConditions: [
          {
            volatility: 'high',
            volume: 'high',
            liquidity: 'high'
          }
        ],
        riskLevel: 'high',
        expectedReturn: 0.20,
        maxDrawdown: 0.12,
        timeHorizon: 'scalping',
        confidence: 0.70,
        lastPerformance: {
          winRate: 0.58,
          avgReturn: 0.18,
          sharpeRatio: 1.2,
          maxDrawdown: 0.10
        }
      },
      {
        id: 'news_momentum',
        name: 'News-Driven Momentum',
        description: 'Trades on news events and sentiment shifts',
        suitableConditions: [
          {
            newsImpact: 'high',
            sentiment: 'very_positive',
            volume: 'exceptional'
          },
          {
            newsImpact: 'high',
            sentiment: 'very_negative',
            volume: 'exceptional'
          }
        ],
        riskLevel: 'high',
        expectedReturn: 0.25,
        maxDrawdown: 0.15,
        timeHorizon: 'day',
        confidence: 0.78,
        lastPerformance: {
          winRate: 0.62,
          avgReturn: 0.22,
          sharpeRatio: 1.4,
          maxDrawdown: 0.13
        }
      },
      {
        id: 'volatility_arbitrage',
        name: 'Volatility Arbitrage',
        description: 'Exploits volatility discrepancies across timeframes',
        suitableConditions: [
          {
            volatility: 'extreme',
            liquidity: 'high'
          }
        ],
        riskLevel: 'moderate',
        expectedReturn: 0.10,
        maxDrawdown: 0.05,
        timeHorizon: 'day',
        confidence: 0.82,
        lastPerformance: {
          winRate: 0.70,
          avgReturn: 0.08,
          sharpeRatio: 1.9,
          maxDrawdown: 0.04
        }
      }
    ]
  }

  async analyzeMarketConditions(symbol: string): Promise<MarketCondition> {
    // This would integrate with your market data APIs
    // For now, we'll simulate market condition analysis
    
    const mockCondition: MarketCondition = {
      trend: 'bullish',
      volatility: 'moderate',
      volume: 'high',
      sentiment: 'positive',
      momentum: 'up',
      liquidity: 'high',
      newsImpact: 'low'
    }

    this.currentMarketCondition = mockCondition

    // Save to database
    await tradingDB.saveMarketAnalysis({
      symbol,
      timeframe: '1h',
      analysis_type: 'combined',
      indicators: {
        rsi: 65,
        macd: 'bullish',
        bollinger: 'expanding',
        volume_sma: 'above'
      },
      signals: mockCondition,
      confidence_score: 0.85,
      recommendation: 'buy'
    })

    return mockCondition
  }

  selectOptimalStrategies(marketCondition: MarketCondition, maxStrategies = 2): TradingStrategy[] {
    const scoredStrategies = this.strategies.map(strategy => ({
      strategy,
      score: this.scoreStrategy(strategy, marketCondition)
    }))

    // Sort by score and take top strategies
    return scoredStrategies
      .sort((a, b) => b.score - a.score)
      .slice(0, maxStrategies)
      .filter(s => s.score > 0.5) // Only use strategies with decent scores
      .map(s => s.strategy)
  }

  private scoreStrategy(strategy: TradingStrategy, marketCondition: MarketCondition): number {
    let totalScore = 0
    let matchingConditions = 0

    // Check each suitable condition against current market
    for (const suitableCondition of strategy.suitableConditions) {
      let conditionScore = 0
      let conditionChecks = 0

      // Score each field that's defined in the suitable condition
      Object.entries(suitableCondition).forEach(([key, value]) => {
        const marketValue = marketCondition[key as keyof MarketCondition]
        if (marketValue === value) {
          conditionScore += 1
        }
        conditionChecks++
      })

      if (conditionChecks > 0) {
        totalScore += conditionScore / conditionChecks
        matchingConditions++
      }
    }

    if (matchingConditions === 0) return 0

    // Average score across all conditions
    const baseScore = totalScore / matchingConditions

    // Apply performance weighting
    const performanceWeight = 
      (strategy.lastPerformance.winRate * 0.4) +
      (strategy.lastPerformance.sharpeRatio / 3 * 0.3) +
      ((1 - strategy.lastPerformance.maxDrawdown) * 0.3)

    // Apply confidence weighting
    const finalScore = baseScore * 0.6 + performanceWeight * 0.3 + strategy.confidence * 0.1

    return Math.min(1, Math.max(0, finalScore))
  }

  async generateSignals(symbol: string, accountId: string): Promise<StrategySignal[]> {
    if (!this.currentMarketCondition) {
      this.currentMarketCondition = await this.analyzeMarketConditions(symbol)
    }

    const optimalStrategies = this.selectOptimalStrategies(this.currentMarketCondition)
    const signals: StrategySignal[] = []

    for (const strategy of optimalStrategies) {
      const signal = await this.generateStrategySignal(strategy, symbol, this.currentMarketCondition)
      if (signal) {
        signals.push(signal)

        // Log AI decision
        await tradingDB.logAIDecision({
          account_id: accountId,
          decision_type: signal.signal,
          symbol,
          reasoning: signal.reasoning,
          confidence_score: signal.confidence,
          market_conditions: this.currentMarketCondition,
          data_analyzed: {
            strategy: strategy.name,
            signal_strength: signal.strength,
            exit_conditions: signal.exitConditions
          },
          strategy_selected: strategy.name
        })
      }
    }

    return signals
  }

  private async generateStrategySignal(
    strategy: TradingStrategy, 
    symbol: string, 
    marketCondition: MarketCondition
  ): Promise<StrategySignal | null> {
    // This would contain the actual strategy logic
    // For now, we'll simulate signal generation
    
    const mockPrice = 50000 // BTC price example
    
    switch (strategy.id) {
      case 'momentum_breakout':
        return {
          strategy,
          signal: marketCondition.momentum === 'strong_up' ? 'buy' : 'sell',
          strength: 0.8,
          confidence: 0.85,
          reasoning: `Strong ${marketCondition.momentum} momentum detected with high volume confirmation. Breakout pattern forming above key resistance.`,
          exitConditions: ['RSI overbought', 'Volume decline', 'Trend reversal'],
          stopLoss: mockPrice * (marketCondition.momentum === 'strong_up' ? 0.95 : 1.05),
          takeProfit: mockPrice * (marketCondition.momentum === 'strong_up' ? 1.08 : 0.92)
        }

      case 'mean_reversion':
        if (marketCondition.trend === 'sideways') {
          return {
            strategy,
            signal: 'buy', // Assuming oversold condition
            strength: 0.6,
            confidence: 0.75,
            reasoning: 'Price in oversold territory within established range. Mean reversion opportunity identified.',
            exitConditions: ['Return to mean', 'Range break', 'Momentum shift'],
            stopLoss: mockPrice * 0.97,
            takeProfit: mockPrice * 1.04
          }
        }
        break

      case 'trend_following':
        if (marketCondition.trend !== 'sideways') {
          return {
            strategy,
            signal: marketCondition.trend === 'bullish' ? 'buy' : 'sell',
            strength: 0.7,
            confidence: 0.80,
            reasoning: `Strong ${marketCondition.trend} trend confirmed. Following trend with proper risk management.`,
            exitConditions: ['Trend weakening', 'Support/resistance break', 'Volume divergence'],
            stopLoss: mockPrice * (marketCondition.trend === 'bullish' ? 0.94 : 1.06),
            takeProfit: mockPrice * (marketCondition.trend === 'bullish' ? 1.12 : 0.88)
          }
        }
        break

      case 'news_momentum':
        if (marketCondition.newsImpact === 'high') {
          return {
            strategy,
            signal: marketCondition.sentiment === 'very_positive' ? 'buy' : 'sell',
            strength: 0.9,
            confidence: 0.78,
            reasoning: `High-impact news event with ${marketCondition.sentiment} sentiment. Momentum building in ${marketCondition.sentiment === 'very_positive' ? 'upward' : 'downward'} direction.`,
            exitConditions: ['News impact fading', 'Sentiment reversal', 'Volume normalization'],
            stopLoss: mockPrice * (marketCondition.sentiment === 'very_positive' ? 0.92 : 1.08),
            takeProfit: mockPrice * (marketCondition.sentiment === 'very_positive' ? 1.15 : 0.85)
          }
        }
        break
    }

    return null
  }

  async evaluateStrategyPerformance(strategyId: string, symbol: string): Promise<void> {
    // This would analyze recent trades using this strategy
    // Update the strategy's performance metrics
    const strategy = this.strategies.find(s => s.id === strategyId)
    if (!strategy) return

    // Simulate performance update
    strategy.lastPerformance = {
      winRate: 0.68 + Math.random() * 0.1 - 0.05,
      avgReturn: 0.10 + Math.random() * 0.06 - 0.03,
      sharpeRatio: 1.5 + Math.random() * 0.6 - 0.3,
      maxDrawdown: 0.05 + Math.random() * 0.04
    }

    // Update confidence based on recent performance
    strategy.confidence = Math.min(1, Math.max(0.3, 
      strategy.lastPerformance.winRate * 0.5 + 
      (strategy.lastPerformance.sharpeRatio / 3) * 0.3 + 
      (1 - strategy.lastPerformance.maxDrawdown) * 0.2
    ))
  }

  shouldSwitchStrategy(currentStrategyId: string, marketCondition: MarketCondition): boolean {
    const currentStrategy = this.strategies.find(s => s.id === currentStrategyId)
    if (!currentStrategy) return true

    const currentScore = this.scoreStrategy(currentStrategy, marketCondition)
    const optimalStrategies = this.selectOptimalStrategies(marketCondition, 1)
    
    if (optimalStrategies.length === 0) return false
    
    const optimalScore = this.scoreStrategy(optimalStrategies[0], marketCondition)
    
    // Switch if optimal strategy is significantly better (threshold: 0.2)
    return optimalScore - currentScore > 0.2
  }

  getStrategyExplanation(strategy: TradingStrategy, marketCondition: MarketCondition): string {
    const score = this.scoreStrategy(strategy, marketCondition)
    const matchReason = this.getMatchReason(strategy, marketCondition)
    
    return `Selected ${strategy.name} (${strategy.description}) with confidence score ${(score * 100).toFixed(1)}%. ${matchReason} Expected return: ${(strategy.expectedReturn * 100).toFixed(1)}% with max drawdown of ${(strategy.maxDrawdown * 100).toFixed(1)}%.`
  }

  private getMatchReason(strategy: TradingStrategy, marketCondition: MarketCondition): string {
    const matches: string[] = []
    
    for (const condition of strategy.suitableConditions) {
      const conditionMatches: string[] = []
      
      Object.entries(condition).forEach(([key, value]) => {
        if (marketCondition[key as keyof MarketCondition] === value) {
          conditionMatches.push(`${key}: ${value}`)
        }
      })
      
      if (conditionMatches.length > 0) {
        matches.push(`Market shows ${conditionMatches.join(', ')}`)
      }
    }
    
    return matches.length > 0 ? matches[0] : 'General market compatibility'
  }

  getActiveStrategies(): TradingStrategy[] {
    return this.strategies.filter(s => this.activeStrategies.has(s.id))
  }

  activateStrategy(strategyId: string): void {
    this.activeStrategies.add(strategyId)
  }

  deactivateStrategy(strategyId: string): void {
    this.activeStrategies.delete(strategyId)
  }

  getAllStrategies(): TradingStrategy[] {
    return [...this.strategies]
  }

  getCurrentMarketCondition(): MarketCondition | null {
    return this.currentMarketCondition
  }
}

export const adaptiveStrategyManager = new AdaptiveStrategyManager() 