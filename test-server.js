const fetch = require('node-fetch');

async function testServer() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing server endpoints...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server availability...');
    const response = await fetch(`${baseUrl}/api/meals`);
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const meals = await response.json();
      console.log(`   Meals found: ${meals.length}`);
    }
    
    // Test 2: Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Robotarm', password: '123456789' })
    });
    console.log(`   Status: ${loginResponse.status}`);
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log(`   Login successful: ${!!loginData.token}`);
      return loginData.token;
    } else {
      const errorData = await loginResponse.json();
      console.log(`   Login failed: ${errorData.error}`);
    }
    
  } catch (error) {
    console.error('Error testing server:', error.message);
    console.log('\nMake sure the server is running with: npm start');
  }
}

testServer(); 