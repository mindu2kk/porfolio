// Test script to verify IP Geolocation API works
// Run: node test-geo-api.js

const testIP = '113.160.14.17'; // Vietnam IP from your screenshot

console.log('🧪 Testing IP Geolocation API...\n');
console.log('Test IP:', testIP);
console.log('API: http://ip-api.com/json/\n');

fetch(`http://ip-api.com/json/${testIP}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.status === 'success') {
      console.log('\n✅ SUCCESS! Location data retrieved:');
      console.log('  Country:', data.country);
      console.log('  City:', data.city);
      console.log('  Region:', data.regionName);
      console.log('  Timezone:', data.timezone);
      console.log('  Coordinates:', `${data.lat}, ${data.lon}`);
      console.log('  Google Maps:', `https://www.google.com/maps?q=${data.lat},${data.lon}`);
    } else {
      console.log('\n❌ FAILED:', data.message);
    }
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
