#!/usr/bin/env node

/**
 * Test runner script for Dynamic Trailing Stops test suite
 * Provides convenient commands for running different test categories
 */

const { execSync } = require('child_process');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(colorize(title, 'cyan'));
  console.log('='.repeat(60) + '\n');
}

function runCommand(command, description) {
  try {
    console.log(colorize(`Running: ${description}`, 'yellow'));
    console.log(colorize(`Command: ${command}`, 'white'));
    console.log();
    
    const output = execSync(command, { stdio: 'inherit', cwd: __dirname });
    console.log(colorize(`✓ ${description} completed successfully`, 'green'));
    return true;
  } catch (error) {
    console.error(colorize(`✗ ${description} failed`, 'red'));
    console.error(colorize(`Exit code: ${error.status}`, 'red'));
    return false;
  }
}

function showUsage() {
  console.log(colorize('Dynamic Trailing Stops Test Runner', 'bright'));
  console.log('\nUsage: node run-tests.js [command]\n');
  console.log('Commands:');
  console.log(colorize('  all', 'green') + '         Run all tests');
  console.log(colorize('  unit', 'green') + '        Run unit tests only');
  console.log(colorize('  integration', 'green') + ' Run integration tests only');
  console.log(colorize('  performance', 'green') + ' Run performance tests only');
  console.log(colorize('  edge-cases', 'green') + '  Run edge case tests only');
  console.log(colorize('  coverage', 'green') + '    Run tests with coverage report');
  console.log(colorize('  watch', 'green') + '       Run tests in watch mode');
  console.log(colorize('  ci', 'green') + '          Run CI pipeline (all tests + coverage)');
  console.log(colorize('  install', 'green') + '     Install test dependencies');
  console.log(colorize('  help', 'green') + '        Show this help message');
  console.log('\nExamples:');
  console.log('  node run-tests.js unit');
  console.log('  node run-tests.js coverage');
  console.log('  node run-tests.js watch\n');
}

function installDependencies() {
  printHeader('Installing Test Dependencies');
  return runCommand('npm install', 'Installing dependencies');
}

function runAllTests() {
  printHeader('Running All Tests');
  return runCommand('npm test', 'All tests');
}

function runUnitTests() {
  printHeader('Running Unit Tests');
  return runCommand('npm test -- tests/unit', 'Unit tests');
}

function runIntegrationTests() {
  printHeader('Running Integration Tests');
  return runCommand('npm run test:integration', 'Integration tests');
}

function runPerformanceTests() {
  printHeader('Running Performance Tests');
  return runCommand('npm run test:performance', 'Performance tests');
}

function runEdgeCaseTests() {
  printHeader('Running Edge Case Tests');
  return runCommand('npm test -- tests/unit/dynamic-trailing-stops-edge-cases.test.ts', 'Edge case tests');
}

function runCoverageTests() {
  printHeader('Running Tests with Coverage');
  const success = runCommand('npm run test:coverage', 'Tests with coverage');
  if (success) {
    console.log(colorize('\n📊 Coverage report generated in coverage/ directory', 'cyan'));
    console.log(colorize('💡 Open coverage/lcov-report/index.html to view detailed report', 'cyan'));
  }
  return success;
}

function runWatchMode() {
  printHeader('Running Tests in Watch Mode');
  console.log(colorize('👀 Watching for file changes... Press Ctrl+C to exit', 'yellow'));
  return runCommand('npm run test:watch', 'Watch mode');
}

function runCIPipeline() {
  printHeader('Running CI Pipeline');
  
  const steps = [
    { cmd: 'npm run test:coverage', desc: 'Tests with coverage' },
    { cmd: 'npm run test:integration', desc: 'Integration tests' },
    { cmd: 'npm run test:performance', desc: 'Performance tests' }
  ];
  
  let allPassed = true;
  
  for (const step of steps) {
    if (!runCommand(step.cmd, step.desc)) {
      allPassed = false;
      break;
    }
  }
  
  if (allPassed) {
    console.log(colorize('\n🎉 All CI pipeline steps passed!', 'green'));
  } else {
    console.log(colorize('\n❌ CI pipeline failed', 'red'));
  }
  
  return allPassed;
}

function checkTestSetup() {
  printHeader('Checking Test Setup');
  
  const requiredFiles = [
    'jest.config.js',
    'jest.integration.config.js',
    'jest.performance.config.js',
    'tests/setup.ts',
    'tests/utils/test-helpers.ts',
    'tests/fixtures/market-data.ts'
  ];
  
  let allFilesExist = true;
  
  console.log('Checking required test files...\n');
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    try {
      require('fs').statSync(filePath);
      console.log(colorize(`✓ ${file}`, 'green'));
    } catch (error) {
      console.log(colorize(`✗ ${file} (missing)`, 'red'));
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    console.log(colorize('\n✅ Test setup is complete!', 'green'));
  } else {
    console.log(colorize('\n❌ Test setup is incomplete', 'red'));
  }
  
  return allFilesExist;
}

function main() {
  const command = process.argv[2] || 'help';
  
  switch (command.toLowerCase()) {
    case 'install':
      installDependencies();
      break;
    case 'all':
      runAllTests();
      break;
    case 'unit':
      runUnitTests();
      break;
    case 'integration':
      runIntegrationTests();
      break;
    case 'performance':
      runPerformanceTests();
      break;
    case 'edge-cases':
      runEdgeCaseTests();
      break;
    case 'coverage':
      runCoverageTests();
      break;
    case 'watch':
      runWatchMode();
      break;
    case 'ci':
      runCIPipeline();
      break;
    case 'check':
      checkTestSetup();
      break;
    case 'help':
    default:
      showUsage();
      break;
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Test runner interrupted. Goodbye!', 'yellow'));
  process.exit(0);
});

// Run main function
main();