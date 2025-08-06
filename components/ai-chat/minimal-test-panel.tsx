'use client';

import React from 'react';

export function MinimalTestPanel() {
  return (
    <div className="w-full h-full bg-green-100 border-l border-gray-200 p-4">
      <h1 className="text-2xl font-bold text-green-800">🎯 TEST PANEL WORKING!</h1>
      <p className="text-green-600 mt-4">If you can see this, the right panel is rendering correctly.</p>
      <div className="mt-8 space-y-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold">Real Account Data:</h3>
          <p>Balance: $50,000 (expected)</p>
          <p>Fake Data: $116k (should be gone)</p>
        </div>
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold">Next Steps:</h3>
          <p>1. Fix portfolio fake data</p>
          <p>2. Add full Cursor-style chat</p>
        </div>
      </div>
    </div>
  );
} 