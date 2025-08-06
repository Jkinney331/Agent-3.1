import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { PortfolioMetrics } from '@/components/dashboard/portfolio-metrics';
import { TradingActivity } from '@/components/dashboard/trading-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import AIAnalysis from '@/components/dashboard/ai-analysis';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { LiveCryptoWidget } from '@/components/crypto/live-crypto-widget';
import { CursorStyleChatPanel } from '@/components/ai-chat/cursor-style-chat-panel';
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
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-green-800 flex items-center gap-2">
                  🚀 Phase 4: Enhanced Trading Execution Engine Active
                </h3>
                <p className="text-xs text-green-600 mt-1">
                  AI Trading Agent with full execution capabilities, Cursor-style chat, bidirectional workflow integration
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Link href="/mcp-test" className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors">
                  Test APIs
                </Link>
                <Link href="/analytics" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">
                  AI Analysis
                </Link>
                <Link href="/strategy" className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors">
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

          {/* Trading Activity & AI Analysis - PROPERLY STRUCTURED */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TradingActivity />
            </div>
            <div className="xl:col-span-1">
              <AIAnalysis />
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