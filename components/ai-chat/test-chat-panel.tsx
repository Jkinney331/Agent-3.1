'use client';

export function TestChatPanel() {
  return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">🧪 Test Chat Panel</h2>
        <p className="text-sm text-gray-600">This should render if components work</p>
      </div>
      <div className="flex-1 p-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-800">✅ Chat panel is working!</p>
          <p className="text-sm text-blue-600 mt-1">
            If you see this, the layout and components are working correctly.
          </p>
        </div>
      </div>
    </div>
  );
} 