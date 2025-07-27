const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment files...\n');

const criticalFiles = [
  'server.js',
  'package.json',
  'data.json',
  'index.html',
  'script.js',
  'style.css',
  'admin.html',  // CRITICAL for operator control
  'admin.js'     // CRITICAL for operator control
];

const optionalFiles = [
  'package-lock.json',
  'node_modules',
  'test-server.js',
  'TROUBLESHOOTING.md',
  'DEPLOYMENT_CHECKLIST.md'
];

let allCriticalFilesPresent = true;

console.log('📋 Critical Files:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    allCriticalFilesPresent = false;
  }
});

console.log('\n📋 Optional Files:');
optionalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - Not found (optional)`);
  }
});

console.log('\n📊 Summary:');
if (allCriticalFilesPresent) {
  console.log('✅ All critical files are present!');
  console.log('🎉 Your operator backstage should work correctly.');
} else {
  console.log('❌ Some critical files are missing!');
  console.log('🔧 Please transfer the missing files to fix operator backstage.');
}

// Check data.json structure
console.log('\n🔍 Checking data.json structure...');
if (fs.existsSync('data.json')) {
  try {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    if (data.meals && Array.isArray(data.meals)) {
      console.log(`  ✅ Meals array: ${data.meals.length} meals found`);
    } else {
      console.log('  ❌ Meals array missing or invalid');
    }
    
    if (data.orders && Array.isArray(data.orders)) {
      console.log(`  ✅ Orders array: ${data.orders.length} orders found`);
    } else {
      console.log('  ❌ Orders array missing or invalid');
    }
    
    if (data.operator && data.operator.username && data.operator.password) {
      console.log('  ✅ Operator credentials found');
      console.log(`     Username: ${data.operator.username}`);
    } else {
      console.log('  ❌ Operator credentials missing or invalid');
    }
  } catch (error) {
    console.log('  ❌ Error reading data.json:', error.message);
  }
} else {
  console.log('  ❌ data.json not found');
}

console.log('\n🚀 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm start');
console.log('3. Open: http://localhost:3000/admin.html');
console.log('4. Login with: Robotarm / 123456789'); 