#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Running FMEA Builder Test Suite\n');

const testSuites = [
  {
    name: 'Database Functions',
    pattern: 'database-simple.test.ts',
    description: 'Testing database operations and queries'
  },
  {
    name: 'Export Functions', 
    pattern: 'export.test.ts',
    description: 'Testing PDF and Excel export functionality'
  },
  {
    name: 'API Endpoints',
    pattern: 'api/__tests__/',
    description: 'Testing REST API endpoints'
  },
  {
    name: 'React Components',
    pattern: 'components/__tests__/',
    description: 'Testing React components and UI'
  }
];

let totalPassed = 0;
let totalFailed = 0;

for (const suite of testSuites) {
  console.log(`\n📋 ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log('   ' + '─'.repeat(50));
  
  try {
    const result = execSync(`npm test -- --testPathPattern="${suite.pattern}" --silent`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse results
    const lines = result.split('\n');
    const summaryLine = lines.find(line => line.includes('Test Suites:'));
    
    if (summaryLine) {
      console.log(`   ✅ ${summaryLine.trim()}`);
      
      // Extract numbers
      const passed = summaryLine.match(/(\d+) passed/);
      const failed = summaryLine.match(/(\d+) failed/);
      
      if (passed) totalPassed += parseInt(passed[1]);
      if (failed) totalFailed += parseInt(failed[1]);
    } else {
      console.log('   ✅ Tests completed successfully');
    }
    
  } catch (error) {
    console.log(`   ❌ Tests failed:`);
    console.log(`   ${error.message}`);
    totalFailed++;
  }
}

console.log('\n' + '═'.repeat(60));
console.log('🏁 Test Summary');
console.log('═'.repeat(60));

if (totalFailed === 0) {
  console.log(`✅ All test suites passed!`);
  console.log(`📊 Total test suites: ${testSuites.length}`);
  console.log('🎉 Ready for production!');
} else {
  console.log(`❌ ${totalFailed} test suite(s) failed`);
  console.log(`✅ ${totalPassed} test suite(s) passed`);
  console.log('🔧 Please fix failing tests before deployment');
}

console.log('\n💡 To run individual test suites:');
testSuites.forEach(suite => {
  console.log(`   npm test -- --testPathPattern="${suite.pattern}"`);
});

console.log('\n📖 To run with coverage:');
console.log('   npm run test:coverage');

process.exit(totalFailed > 0 ? 1 : 0);