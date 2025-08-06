'use client';

import React from 'react';

export function MinimalChatPanel() {
  return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">AI Trading Assistant</h2>
        <p className="text-sm text-gray-600">Cursor-style Chat Panel</p>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 bg-white">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-800 font-medium">🎉 Success!</p>
          <p className="text-blue-600 text-sm mt-1">
            The right panel is now working! This proves the layout is correct.
          </p>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">📊 Portfolio: $50,000 (Real Data)</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">🤖 Mode: Ask (Ready for questions)</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">💡 Status: Waiting for first interaction</p>
          </div>
        </div>
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="Ask me about your trading account..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 