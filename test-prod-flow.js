const http = require('http');
const https = require('https');

const req = https.request({
  hostname: 'kaizech-brain-production.up.railway.app',
  path: '/api/v1/playground/chat', // Use chat instead of stream to easily get the JSON response
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'kb_demo_tenant_key',
    'x-tenant-slug': 'mrkoon-auctions'
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data));
});
req.on('error', console.error);
req.write(JSON.stringify({message: 'list'}));
req.end();
