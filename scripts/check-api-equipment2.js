/**
 * Check what the equipment API returns
 */

const http = require('http');

async function checkAPI() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 9002,
      path: '/api/equipment',
      method: 'GET',
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          
          console.log('\n📊 Equipment API Response:\n');
          console.log('Success:', data.success);
          console.log('Count:', data.count);
          console.log('\nEquipment items:');
          console.log('─'.repeat(70));
          
          if (data.data && data.data.length > 0) {
            data.data.forEach((item, index) => {
              console.log(`\n${index + 1}. ${item.name}`);
              console.log(`   ID: ${item.id}`);
              console.log(`   Zone ID: ${item.zoneId || 'MISSING'}`);
              console.log(`   Category: ${item.category}`);
              console.log(`   Status: ${item.status}`);
            });
          } else {
            console.log('\n❌ No equipment found');
          }
          
          console.log('\n' + '─'.repeat(70));
          console.log('\nFull response:');
          console.log(JSON.stringify(data, null, 2));
          resolve();
        } catch (error) {
          console.error('\n❌ Error parsing response:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('\n❌ Error calling API:', error.message);
      console.log('\nMake sure the dev server is running on http://localhost:9002');
      reject(error);
    });
    
    req.end();
  });
}

checkAPI().catch(() => process.exit(1));
