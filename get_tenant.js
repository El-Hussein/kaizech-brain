const https = require('https');

fetch('https://kaizech-brain-production.up.railway.app/api/v1/tenant', {
  headers: {
    'x-tenant-slug': 'mrkoon',
    'x-api-key': 'kb_live_sk_mrkoon'
  }
}).then(res => res.json()).then(data => {
  console.log(data);
});
