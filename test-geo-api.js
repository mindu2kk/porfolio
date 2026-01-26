// Test script to verify IP Geolocation API works
// Run: node test-geo-api.js

const testIP = '113.160.14.17'; // Vietnam IP from your screenshot

console.log('🧪 Testing FreeIPAPI (New API)...\n');
console.log('Test IP:', testIP);
console.log('API: https://freeipapi.com/api/json/\n');

fetch(`https://freeipapi.com/api/json/${testIP}`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data && data.countryName) {
      console.log('\n✅ SUCCESS! Location data retrieved:');
      console.log('  Country:', data.countryName);
      console.log('  City:', data.cityName);
      console.log('  Region:', data.regionName);
      console.log('  Timezone:', data.timeZones?.[0] || 'Unknown');
      console.log('  Coordinates:', `${data.latitude}, ${data.longitude}`);
      console.log('  Google Maps:', `https://www.google.com/maps?q=${data.latitude},${data.longitude}`);
      console.log('  Zip Code:', data.zipCode);
      console.log('  Continent:', data.continent);
      console.log('  Currency:', data.currencies?.[0] || 'Unknown');
      console.log('  Language:', data.languages?.[0] || 'Unknown');
      console.log('  ISP:', data.asnOrganization);
      console.log('  Is Proxy:', data.isProxy);
    } else {
      console.log('\n❌ FAILED: Incomplete data');
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
