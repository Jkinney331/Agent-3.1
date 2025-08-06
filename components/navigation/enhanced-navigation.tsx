'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Target,
  BarChart3,
  Brain,
  Settings,
  Bell,
  TrendingUp,
  Shield,
  DollarSign,
  Activity,
  Zap,
  Globe,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Home,
  PieChart,
  Newspaper,
  Wallet,
  LineChart,
  Bot,
  Menu,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  description?: string;
  isNew?: boolean;
  children?: NavigationItem[];
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Main trading overview and metrics'
  },
  {
    id: 'strategy',
    label: 'Strategy',
    href: '/strategy',
    icon: Target,
    badge: '1',
    badgeColor: 'bg-green-500',
    description: 'Create and manage trading strategies',
    isNew: true,
    children: [
      {
        id: 'strategy-builder',
        label: 'Strategy Builder',
        href: '/strategy/builder',
        icon: Bot,
        description: 'Build custom AI strategies'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Market analytics and insights',
    children: []
  },
  {
    id: 'trading',
    label: 'Trading',
    href: '/trading',
    icon: DollarSign,
    badge: 'Live',
    badgeColor: 'bg-blue-500',
    description: 'Execute and monitor trades',
    children: [
      {
        id: 'positions',
        label: 'Positions',
        href: '/trading/positions',
        icon: Wallet,
        description: 'Current trading positions'
      },
      {
        id: 'orders',
        label: 'Orders',
        href: '/trading/orders',
        icon: PieChart,
        description: 'Order management and history'
      },
      {
        id: 'paper-trading',
        label: 'Paper Trading',
        href: '/trading/paper',
        icon: Shield,
        description: 'Risk-free trading simulation'
      }
    ]
  },
  {
    id: 'risk',
    label: 'Risk Management',
    href: '/risk',
    icon: Shield,
    description: 'Monitor and control trading risks',
    children: [
      {
        id: 'risk-dashboard',
        label: 'Risk Dashboard',
        href: '/risk/dashboard',
        icon: BarChart3,
        description: 'Real-time risk metrics'
      },
      {
        id: 'alerts',
        label: 'Risk Alerts',
        href: '/risk/alerts',
        icon: Bell,
        description: 'Risk monitoring and alerts'
      }
    ]
  },
  {
    id: 'news',
    label: 'News & Market',
    href: '/news',
    icon: Newspaper,
    description: 'Latest news and market updates',
    children: [
      {
        id: 'news-feed',
        label: 'News Feed',
        href: '/news/feed',
        icon: Newspaper,
        description: 'Real-time crypto news'
      },
      {
        id: 'market-calendar',
        label: 'Market Calendar',
        href: '/news/calendar',
        icon: Globe,
        description: 'Important market events'
      }
    ]
  }
];

const QUICK_ACTIONS = [
  {
    id: 'quick-buy',
    label: 'Quick Buy',
    icon: TrendingUp,
    color: 'bg-green-600 hover:bg-green-700',
    description: 'Execute instant buy order'
  },
  {
    id: 'quick-sell',
    label: 'Quick Sell',
    icon: TrendingUp,
    color: 'bg-red-600 hover:bg-red-700',
    description: 'Execute instant sell order'
  },
  {
    id: 'emergency-stop',
    label: 'Emergency Stop',
    icon: Shield,
    color: 'bg-orange-600 hover:bg-orange-700',
    description: 'Stop all trading activities'
  },
  {
    id: 'ai-analysis',
    label: 'AI Analysis',
    icon: Brain,
    color: 'bg-purple-600 hover:bg-purple-700',
    description: 'Run deep market analysis'
  }
];

export function EnhancedNavigation() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['analytics', 'strategy']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/') return true;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href);

    return (
      <div key={item.id} className={`${depth > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center group">
          {hasChildren ? (
            <div className="flex items-center w-full">
              <Link 
                href={item.href}
                className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <Badge className={`${item.badgeColor} text-white text-xs ml-auto mr-2`}>
                    {item.badge}
                  </Badge>
                )}
                {item.isNew && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs ml-auto mr-2">
                    NEW
                  </Badge>
                )}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(item.id)}
                className="p-1 h-auto"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </div>
          ) : (
            <Link 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full ${
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge className={`${item.badgeColor} text-white text-xs ml-auto`}>
                  {item.badge}
                </Badge>
              )}
              {item.isNew && (
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs ml-auto">
                  NEW
                </Badge>
              )}
            </Link>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1 border-l border-muted ml-6">
            {item.children!.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen(true)}
          className="bg-white/90 backdrop-blur-sm"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-72 bg-background border-r z-50 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AI Trading Bot</h1>
                <p className="text-xs text-muted-foreground">v4.0 Enhanced</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {NAVIGATION_ITEMS.map(item => renderNavigationItem(item))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className={`${action.color} text-white border-none justify-start`}
                    title={action.description}
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Card */}
            <Card className="mt-6 p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Status</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Strategies:</span>
                    <div className="font-semibold">3 Active</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">P&L:</span>
                    <div className="font-semibold text-green-600">+23.5%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Alerts:</span>
                    <div className="font-semibold">2 New</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uptime:</span>
                    <div className="font-semibold">99.8%</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">AI Agent</div>
                    <div className="text-xs text-muted-foreground">Active Trading</div>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>AI Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Brain className="h-4 w-4 mr-2" />
                    Model Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Support
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div className="lg:ml-72" />
    </>
  );
} 