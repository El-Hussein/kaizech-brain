const https = require('https');
const req = https.request({
  hostname: 'kaizech-brain-production.up.railway.app',
  path: '/api/v1/workflows',
  method: 'GET',
  headers: {
    'x-api-key': 'kb_demo_tenant_key',
    'x-tenant-slug': 'mrkoon-auctions'
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(data));
});
req.on('error', console.error);
req.end();
