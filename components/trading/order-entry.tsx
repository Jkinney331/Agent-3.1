'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

interface OrderEntryProps {
  symbol: string;
  orderType: 'market' | 'limit' | 'stop';
  onOrderTypeChange: (type: 'market' | 'limit' | 'stop') => void;
}

export function OrderEntry({ symbol, orderType, onOrderTypeChange }: OrderEntryProps) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('43250.00');
  const [quantity, setQuantity] = useState('0.001');
  const [stopPrice, setStopPrice] = useState('43000.00');
  const [leverage, setLeverage] = useState('1');

  const handleSubmitOrder = () => {
    // Mock order submission
    console.log('Order submitted:', {
      symbol,
      side,
      type: orderType,
      price: orderType !== 'market' ? price : undefined,
      quantity,
      stopPrice: orderType === 'stop' ? stopPrice : undefined,
      leverage
    });
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    return qty * prc;
  };

  return (
    <div className="space-y-4">
      {/* Buy/Sell Tabs */}
      <Tabs value={side} onValueChange={(value) => setSide(value as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <OrderForm
            orderType={orderType}
            onOrderTypeChange={onOrderTypeChange}
            price={price}
            setPrice={setPrice}
            quantity={quantity}
            setQuantity={setQuantity}
            stopPrice={stopPrice}
            setStopPrice={setStopPrice}
            leverage={leverage}
            setLeverage={setLeverage}
            calculateTotal={calculateTotal}
            onSubmit={handleSubmitOrder}
            side="buy"
          />
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <OrderForm
            orderType={orderType}
            onOrderTypeChange={onOrderTypeChange}
            price={price}
            setPrice={setPrice}
            quantity={quantity}
            setQuantity={setQuantity}
            stopPrice={stopPrice}
            setStopPrice={setStopPrice}
            leverage={leverage}
            setLeverage={setLeverage}
            calculateTotal={calculateTotal}
            onSubmit={handleSubmitOrder}
            side="sell"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OrderFormProps {
  orderType: 'market' | 'limit' | 'stop';
  onOrderTypeChange: (type: 'market' | 'limit' | 'stop') => void;
  price: string;
  setPrice: (price: string) => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  stopPrice: string;
  setStopPrice: (stopPrice: string) => void;
  leverage: string;
  setLeverage: (leverage: string) => void;
  calculateTotal: () => number;
  onSubmit: () => void;
  side: 'buy' | 'sell';
}

function OrderForm({
  orderType,
  onOrderTypeChange,
  price,
  setPrice,
  quantity,
  setQuantity,
  stopPrice,
  setStopPrice,
  leverage,
  setLeverage,
  calculateTotal,
  onSubmit,
  side
}: OrderFormProps) {
  return (
    <div className="space-y-4">
      {/* Order Type */}
      <div>
        <Label className="text-sm text-muted-foreground">Order Type</Label>
        <Tabs value={orderType} onValueChange={(value) => onOrderTypeChange(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
            <TabsTrigger value="stop">Stop</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Price (for limit orders) */}
      {orderType === 'limit' && (
        <div>
          <Label htmlFor="price" className="text-sm text-muted-foreground">
            Price (USDT)
          </Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="font-mono"
          />
        </div>
      )}

      {/* Stop Price (for stop orders) */}
      {orderType === 'stop' && (
        <div>
          <Label htmlFor="stopPrice" className="text-sm text-muted-foreground">
            Stop Price (USDT)
          </Label>
          <Input
            id="stopPrice"
            type="number"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            className="font-mono"
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <Label htmlFor="quantity" className="text-sm text-muted-foreground">
          Quantity (BTC)
        </Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="font-mono"
          step="0.00001"
        />
      </div>

      {/* Leverage */}
      <div>
        <Label htmlFor="leverage" className="text-sm text-muted-foreground">
          Leverage
        </Label>
        <Tabs value={leverage} onValueChange={setLeverage}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="1">1x</TabsTrigger>
            <TabsTrigger value="3">3x</TabsTrigger>
            <TabsTrigger value="5">5x</TabsTrigger>
            <TabsTrigger value="10">10x</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Total */}
      {orderType !== 'market' && (
        <div className="border-t pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono">
              {calculateTotal().toFixed(2)} USDT
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        className={`w-full ${
          side === 'buy' 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {orderType.toUpperCase()}
      </Button>

      {/* Available Balance */}
      <div className="text-xs text-muted-foreground text-center">
        Available: 25,430.50 USDT
      </div>
    </div>
  );
} 