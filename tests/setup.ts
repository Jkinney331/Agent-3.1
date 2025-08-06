/**
 * Global test setup file
 * This file runs before each test file
 */

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock console methods for cleaner test output
const originalConsole = console;

global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Reset console for specific tests that need it
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock timers
jest.useFakeTimers();

// Global test utilities
global.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Date for consistent testing
const mockDate = new Date('2025-01-15T10:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};