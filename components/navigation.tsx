'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 flex items-center">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg">AI Trading Bot</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button 
                variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                size="sm"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/trading">
              <Button 
                variant={pathname === '/trading' ? 'default' : 'ghost'}
                size="sm"
              >
                Trading
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 