const https = require('https');
const options = {
  hostname: 'kaizech-brain-production.up.railway.app',
  path: '/api/v1/workflows',
  method: 'GET',
  headers: {
    'x-api-key': 'kb_live_sk_e20b3' // Wait, I don't have their full key.
  }
};
