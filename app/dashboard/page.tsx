import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { PortfolioMetrics } from '@/components/dashboard/portfolio-metrics';
import { TradingActivity } from '@/components/dashboard/trading-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import AIAnalysis from '@/components/dashboard/ai-analysis';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { LiveCryptoWidget } from '@/components/crypto/live-crypto-widget';
import { CursorStyleChatPanel } from '@/components/ai-chat/cursor-style-chat-panel';
import { N8NWorkflowStatus } from '@/components/dashboard/n8n-workflow-status';
import { APIConnectionStatus } from '@/components/dashboard/api-connection-status';
import { WorkflowExecutionHistory } from '@/components/dashboard/workflow-execution-history';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="relative h-full">
      {/* Crypto Market Ticker - FIXED HORIZONTAL TICKER */}
      <div className="fixed top-16 left-64 right-96 z-30 bg-white border-b border-gray-200 shadow-sm">
        <LiveCryptoWidget />
      </div>

      {/* Main Dashboard Content - FIXED THREE-COLUMN LAYOUT */}
      <div className="fixed top-24 left-64 right-96 bottom-0 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-4 min-h-full">
          <DashboardHeader />
          
          {/* Enhanced Phase Status - COMPACT */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  ⚡ Phase 3: n8n Workflow Integration Complete
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  AI Trading with n8n automation, real-time workflow monitoring, and enhanced decision analytics
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Link href="/mcp-test" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">
                  Test APIs
                </Link>
                <Link href="/analytics" className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors">
                  AI Analysis
                </Link>
                <Link href="/strategy" className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors">
                  Strategies
                </Link>
                <Link href="/analytics" className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors">
                  Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* PRIORITY: Performance Summary (As per PRD requirements) */}
          <div className="w-full">
            <PortfolioMetrics />
          </div>

          {/* n8n Workflow Status & API Connections - NEW SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="order-1">
              <ErrorBoundary>
                <N8NWorkflowStatus />
              </ErrorBoundary>
            </div>
            <div className="order-2">
              <ErrorBoundary>
                <APIConnectionStatus />
              </ErrorBoundary>
            </div>
          </div>

          {/* Enhanced Trading Activity with AI Decisions - FULL WIDTH */}
          <div className="w-full">
            <ErrorBoundary>
              <TradingActivity />
            </ErrorBoundary>
          </div>

          {/* Workflow Execution History & AI Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 order-1 xl:order-1">
              <ErrorBoundary>
                <WorkflowExecutionHistory />
              </ErrorBoundary>
            </div>
            <div className="xl:col-span-1 order-2 xl:order-2">
              <ErrorBoundary>
                <AIAnalysis />
              </ErrorBoundary>
            </div>
          </div>

          {/* Market Overview - FULL WIDTH */}
          <div className="w-full">
            <MarketOverview />
          </div>

          {/* Bottom padding for scroll space */}
          <div className="h-4"></div>
        </div>
      </div>

      {/* FIXED POSITION: Cursor-Style Chat Panel */}
      <div className="fixed top-16 right-0 w-96 h-[calc(100vh-4rem)] z-40 bg-white border-l border-gray-200 shadow-lg">
        <CursorStyleChatPanel />
      </div>
    </div>
  );
} 