/**
 * Test API route directly
 * Make sure dev server is running on http://localhost:3000
 * Run: node scripts/test-api-route.js
 */

const http = require('http');

const email = process.argv[2] || 'fisha.hafiz@moe.gov.my';

console.log('\n🧪 Testing API Route: /api/auth/get-profile\n');
console.log('📧 Email:', email);
console.log('🌐 Testing against: http://localhost:3000');
console.log('');

async function testAPI() {
  try {
    console.log('📡 Making request to API...');
    
    const postData = JSON.stringify({ email });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/get-profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    console.log('📊 Response status:', response.status);
    console.log('');

    if (response.status === 404) {
      console.error('❌ API ROUTE NOT FOUND (404)!');
      console.error('');
      console.error('Possible causes:');
      console.error('1. Dev server not running - Run: npm run dev');
      console.error('2. Turbopack caching issue - Try: npm run dev (without turbo)');
      console.error('3. Next.js cache issue - Delete .next folder and restart');
      console.error('4. File not in correct location');
      console.error('');
      console.error('Solutions:');
      console.error('1. Stop server (Ctrl+C)');
      console.error('2. Delete .next folder');
      console.error('3. Run: npm run dev (NOT dev:turbo)');
      console.error('4. Try again');
      return;
    }

    const data = JSON.parse(response.data);
    
    console.log('📦 Response data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data.success) {
      console.log('✅ API route working correctly!');
      console.log('   User:', data.user?.name);
      console.log('   Role:', data.user?.role);
      console.log('   Approved:', data.user?.is_approved);
    } else {
      console.log('⚠️  API returned error:', data.message);
      if (data.debug) {
        console.log('   Debug:', data.debug);
      }
    }

    console.log('');
    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('1. Dev server is running: npm run dev');
    console.error('2. Server is on http://localhost:3000');
    console.error('3. No firewall blocking the connection');
    console.error('');
  }
}

testAPI();
