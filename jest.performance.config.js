/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/performance'],
  testMatch: [
    '**/performance/**/*.+(ts|tsx|js)',
    '**/*.performance.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  testTimeout: 60000, // Longer timeout for performance tests
  verbose: true,
  clearMocks: false, // Keep mocks for performance consistency
  restoreMocks: false,
  // Run tests serially for accurate performance measurements
  maxWorkers: 1,
};

module.exports = config;