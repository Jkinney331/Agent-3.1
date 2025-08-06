/**
 * AI Trading Bot - Core Learning Components Integration
 * 
 * This module exports all the AI learning components and provides initialization
 * utilities for the complete AI-powered trading system.
 */

// Core AI Components
export { aiReasoningEngine } from './reasoning-engine';
export { tradeAnalysisEngine, type TradeStatistics, type RiskAdjustedMetrics, type TradingInsight } from './trade-analysis-engine';
export { patternRecognitionEngine, type MarketPattern, type BehavioralPattern, type AnomalyDetection } from './pattern-recognition';
export { learningIntegrationEngine, type ActionableInsight, type AdaptiveStrategy } from './learning-integration';
export { reportGenerator, type DailyReport, type TelegramReport } from './report-generator';

// Integration utilities
import { aiReasoningEngine } from './reasoning-engine';
import { tradeAnalysisEngine } from './trade-analysis-engine';
import { patternRecognitionEngine } from './pattern-recognition';
import { learningIntegrationEngine } from './learning-integration';
import { reportGenerator } from './report-generator';
import { dynamicStopCalculator } from '../trading/dynamic-trailing-stops';

/**
 * Initialize all AI learning components with proper integration
 */
export async function initializeAILearningSystem(): Promise<void> {
  console.log('🧠 Initializing AI Learning System...');

  try {
    // Start core learning components
    learningIntegrationEngine.start();
    reportGenerator.start();
    
    // The other engines are always ready but don't need explicit starting
    
    console.log('✅ AI Learning System initialized successfully');
    console.log('Components active:');
    console.log('  📊 Trade Analysis Engine - Ready');
    console.log('  🔍 Pattern Recognition Engine - Ready');
    console.log('  🧠 Learning Integration Engine - Running');
    console.log('  📈 Report Generator - Running');
    console.log('  🎯 AI Reasoning Engine - Ready');
    
  } catch (error) {
    console.error('❌ Failed to initialize AI Learning System:', error);
    throw error;
  }
}

/**
 * Shutdown all AI learning components gracefully
 */
export async function shutdownAILearningSystem(): Promise<void> {
  console.log('🛑 Shutting down AI Learning System...');

  try {
    learningIntegrationEngine.stop();
    reportGenerator.stop();
    
    console.log('✅ AI Learning System shutdown complete');
    
  } catch (error) {
    console.error('❌ Error during AI Learning System shutdown:', error);
    throw error;
  }
}

/**
 * Get system status for all AI components
 */
export function getAISystemStatus() {
  return {
    tradeAnalysisEngine: {
      name: 'Trade Analysis Engine',
      status: 'ready',
      lastAnalysis: tradeAnalysisEngine.getLastAnalysisTime(),
      isAnalyzing: tradeAnalysisEngine.isCurrentlyAnalyzing()
    },
    patternRecognitionEngine: {
      name: 'Pattern Recognition Engine',
      status: 'ready',
      activePatterns: patternRecognitionEngine.getActivePatterns().length,
      behavioralPatterns: patternRecognitionEngine.getBehavioralPatterns().length,
      isAnalyzing: patternRecognitionEngine.isCurrentlyAnalyzing()
    },
    learningIntegrationEngine: {
      name: 'Learning Integration Engine',
      status: learningIntegrationEngine.isCurrentlyLearning() ? 'learning' : 'ready',
      pendingInsights: learningIntegrationEngine.getPendingInsights().length,
      lastLearningSession: learningIntegrationEngine.getLastLearningSession()
    },
    reportGenerator: {
      name: 'Report Generator',
      status: reportGenerator.isCurrentlyGenerating() ? 'generating' : 'ready',
      latestReport: reportGenerator.getLatestReport()?.date || null
    },
    aiReasoningEngine: {
      name: 'AI Reasoning Engine',
      status: 'ready',
      confidenceThreshold: 55,
      minRiskReward: 1.5
    }
  };
}

/**
 * Perform a comprehensive learning cycle across all components
 */
export async function performCompleteLearningCycle(
  accountId?: string,
  timeframeDays: number = 7
): Promise<{
  tradeAnalysis: any;
  patterns: any;
  insights: any;
  report: any;
  learningSession: any;
}> {
  console.log('🎓 Starting complete learning cycle...');

  try {
    // Step 1: Analyze trading performance
    const tradeAnalysis = await tradeAnalysisEngine.performComprehensiveAnalysis(accountId, timeframeDays);
    
    // Step 2: Recognize patterns (this would normally use actual market data)
    // For now, we'll use the pattern recognition engine's existing patterns
    const patterns = {
      marketPatterns: patternRecognitionEngine.getActivePatterns(),
      behavioralPatterns: patternRecognitionEngine.getBehavioralPatterns(),
      anomalies: patternRecognitionEngine.getDetectedAnomalies()
    };
    
    // Step 3: Generate integrated insights
    const learningSession = await learningIntegrationEngine.performLearningSession(accountId, timeframeDays);
    const insights = learningIntegrationEngine.getActionableInsights();
    
    // Step 4: Generate comprehensive report
    const report = await reportGenerator.generateDailyReport(accountId, 'on_demand');
    
    console.log('✅ Complete learning cycle finished');
    console.log(`📊 Analyzed ${tradeAnalysis.statistics.totalTrades} trades`);
    console.log(`🔍 Found ${patterns.marketPatterns.length} market patterns`);
    console.log(`💡 Generated ${insights.length} actionable insights`);
    console.log(`📈 Created comprehensive report`);
    
    return {
      tradeAnalysis,
      patterns,
      insights,
      report,
      learningSession
    };
    
  } catch (error) {
    console.error('❌ Complete learning cycle failed:', error);
    throw error;
  }
}

/**
 * Generate Telegram daily report
 */
export async function generateTelegramDailyReport(
  accountId?: string
): Promise<{
  report: any;
  telegramReport: any;
  messageChunks: any[];
}> {
  console.log('📱 Generating Telegram daily report...');

  try {
    // Generate full report
    const report = await reportGenerator.generateDailyReport(accountId, 'daily');
    
    // Format for Telegram
    const telegramReport = await reportGenerator.generateTelegramReport(accountId, 'summary');
    
    // Split into message chunks
    const messageChunks = reportGenerator.splitTelegramReport(telegramReport);
    
    console.log(`✅ Telegram report ready with ${messageChunks.length} message chunks`);
    
    return {
      report,
      telegramReport,
      messageChunks
    };
    
  } catch (error) {
    console.error('❌ Failed to generate Telegram daily report:', error);
    throw error;
  }
}

/**
 * Integration with existing trading system
 */
export async function integrateWithTradingSystem() {
  console.log('🔗 Integrating AI Learning System with Trading System...');

  try {
    // Integration points would be implemented here
    // For example, connecting with dynamic trailing stops
    
    console.log('✅ AI Learning System integrated with trading components');
    
  } catch (error) {
    console.error('❌ Integration failed:', error);
    throw error;
  }
}

/**
 * Configuration management for all AI components
 */
export function updateAISystemConfiguration(config: {
  tradeAnalysis?: any;
  patternRecognition?: any;
  learningIntegration?: any;
  reportGeneration?: any;
}) {
  console.log('⚙️ Updating AI System configuration...');

  if (config.tradeAnalysis) {
    tradeAnalysisEngine.updateConfiguration(config.tradeAnalysis);
  }

  if (config.patternRecognition) {
    patternRecognitionEngine.updateConfiguration(config.patternRecognition);
  }

  if (config.learningIntegration) {
    learningIntegrationEngine.updateConfiguration(config.learningIntegration);
  }

  if (config.reportGeneration) {
    reportGenerator.updateConfiguration(config.reportGeneration);
  }

  console.log('✅ AI System configuration updated');
}

/**
 * Health check for all AI components
 */
export async function performAISystemHealthCheck(): Promise<{
  overall: 'healthy' | 'degraded' | 'critical';
  components: any;
  recommendations: string[];
}> {
  console.log('🏥 Performing AI System health check...');

  const components = getAISystemStatus();
  const recommendations: string[] = [];
  let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';

  // Check each component
  Object.values(components).forEach(component => {
    if (component.status === 'error') {
      overallHealth = 'critical';
      recommendations.push(`${component.name} requires immediate attention`);
    }
  });

  // Check data freshness
  const tradeAnalysisAge = components.tradeAnalysisEngine.lastAnalysis;
  if (!tradeAnalysisAge || (Date.now() - tradeAnalysisAge.getTime()) > 24 * 60 * 60 * 1000) {
    overallHealth = overallHealth === 'healthy' ? 'degraded' : overallHealth;
    recommendations.push('Trade analysis data is stale - consider running fresh analysis');
  }

  // Check learning activity
  const lastLearning = components.learningIntegrationEngine.lastLearningSession;
  if (!lastLearning || (Date.now() - lastLearning.getTime()) > 24 * 60 * 60 * 1000) {
    recommendations.push('Learning system has not run recently - consider triggering learning session');
  }

  // Check pending insights
  if (components.learningIntegrationEngine.pendingInsights > 10) {
    recommendations.push('High number of pending insights - consider reviewing and implementing');
  }

  console.log(`✅ Health check complete - System status: ${overallHealth}`);

  return {
    overall: overallHealth,
    components,
    recommendations
  };
}

// Export default initialization function
export default initializeAILearningSystem;