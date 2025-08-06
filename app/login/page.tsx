"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { Eye, EyeOff, Key, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemoLogin = () => {
    setApiKey('demo_api_key');
    setSecretKey('demo_secret_key');
    setTwoFactorCode('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(apiKey, secretKey, twoFactorCode);
      
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please check your API key and secret.');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Key className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">AI Trading Bot</h1>
          </div>
          <p className="text-muted-foreground">
            Connect your Binance account to start trading
          </p>
        </div>

        {/* Demo Instructions */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div className="text-blue-800 dark:text-blue-200">
            <div className="font-semibold mb-2">Demo Mode Available</div>
            <p className="text-sm mb-3">
              For testing purposes, you can use demo credentials instead of real Binance API keys:
            </p>
            <div className="space-y-1 text-xs font-mono bg-blue-100 dark:bg-blue-900/30 p-2 rounded border">
              <div><strong>API Key:</strong> demo_api_key</div>
              <div><strong>Secret:</strong> demo_secret_key</div>
            </div>
            <Button 
              onClick={handleDemoLogin}
              variant="outline" 
              size="sm" 
              className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              Use Demo Credentials
            </Button>
          </div>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="text-sm font-medium">
              Binance API Key
            </Label>
            <Input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Binance API key"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="secretKey" className="text-sm font-medium">
              Secret Key
            </Label>
            <div className="relative">
              <Input
                id="secretKey"
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter your secret key"
                className="mt-1 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="twoFactor" className="text-sm font-medium">
              2FA Code (Optional)
            </Label>
            <Input
              id="twoFactor"
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="mt-1"
              maxLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect to Binance'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>Your API keys are encrypted and stored locally</p>
          <p className="mt-1">We never send your keys to external servers</p>
        </div>
      </Card>
    </div>
  );
} 