import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EnhancedNavigation } from '@/components/navigation/enhanced-navigation';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Trading Bot - Professional Cryptocurrency Trading Dashboard",
  description: "Advanced AI-powered cryptocurrency trading bot with comprehensive analytics, strategy management, and real-time execution capabilities.",
  keywords: "cryptocurrency, trading, AI, bot, dashboard, analytics, strategy, bitcoin, ethereum",
  authors: [{ name: "AI Trading Bot Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "AI Trading Bot - Professional Trading Dashboard",
    description: "Advanced AI-powered cryptocurrency trading with real-time analytics",
    type: "website",
    images: [
      {
        url: "http://localhost:3000/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Trading Bot Dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Trading Bot - Professional Trading Dashboard",
    description: "Advanced AI-powered cryptocurrency trading with real-time analytics",
    images: [
      {
        url: "http://localhost:3000/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Trading Bot Dashboard"
      }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI Trading Bot" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <div className="min-h-screen flex">
          {/* Enhanced Navigation Sidebar */}
          <EnhancedNavigation />
          
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-h-screen">
            {/* Enhanced Header Bar */}
            <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="lg:hidden">
                  {/* Mobile header content - handled by navigation */}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                
                {/* Quick Stats */}
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Portfolio</div>
                    <div className="text-sm font-semibold text-green-600">+$12,847</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">24h P&L</div>
                    <div className="text-sm font-semibold text-green-600">+5.2%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                    <div className="text-sm font-semibold">73.5%</div>
                  </div>
                </div>
              </div>
            </header>
            
            {/* Page Content */}
            <div className="flex-1 relative">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>© 2025 AI Trading Bot v4.0</span>
                  <span className="hidden md:inline">Enhanced with Phase 4 Features</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden md:inline">Last Update: {new Date().toLocaleTimeString()}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs">Online</span>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>

        {/* Providers */}
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* Background Effects */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
                <div className="w-full h-full bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-green-50/30 opacity-50"></div>
              </div>
            </div>

            {/* Performance and Error Tracking */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
              // Performance monitoring
              window.addEventListener('load', function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                  console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                }
              });
              
              // Error tracking
              window.addEventListener('error', function(e) {
                console.error('Global Error:', e.error);
              });
              
              // Unhandled promise rejection tracking
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled Promise Rejection:', e.reason);
              });
            `,
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
} 