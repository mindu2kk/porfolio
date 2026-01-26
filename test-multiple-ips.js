// Test multiple IPs to verify API works globally
// Run: node test-multiple-ips.js

const testIPs = [
  { ip: '113.160.14.17', expected: 'Vietnam' },
  { ip: '8.8.8.8', expected: 'United States' },
  { ip: '1.1.1.1', expected: 'Australia' },
  { ip: '103.28.36.1', expected: 'Singapore' },
];

console.log('🧪 Testing FreeIPAPI with multiple IPs...\n');

async function testIP(ipData) {
  try {
    const response = await fetch(`https://freeipapi.com/api/json/${ipData.ip}`);
    const data = await response.json();
    
    const success = data.countryName === ipData.expected;
    const icon = success ? '✅' : '❌';
    
    console.log(`${icon} IP: ${ipData.ip}`);
    console.log(`   Expected: ${ipData.expected}`);
    console.log(`   Got: ${data.countryName}`);
    console.log(`   City: ${data.cityName}`);
    console.log(`   Timezone: ${data.timeZones?.[0]}`);
    console.log('');
    
    return success;
  } catch (err) {
    console.log(`❌ IP: ${ipData.ip} - Error: ${err.message}\n`);
    return false;
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const ipData of testIPs) {
    const result = await testIP(ipData);
    if (result) passed++;
    else failed++;
  }
  
  console.log('═══════════════════════════════════');
  console.log(`Total: ${testIPs.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════');
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! API is working perfectly!');
  } else {
    console.log('\n⚠️ Some tests failed. Check API status.');
  }
}

runTests();
