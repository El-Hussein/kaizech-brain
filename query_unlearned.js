const https = require('https');
const url = require('url');

const API_KEY = 'kb_live_sk_mrkoon';
const TENANT_SLUG = 'mrkoon';
const API_URL = 'https://kaizech-brain-production.up.railway.app/api/v1/conversations/stats';

fetch(API_URL, {
  headers: {
    'x-tenant-slug': TENANT_SLUG,
    'x-api-key': API_KEY
  }
}).then(res => res.json()).then(data => {
  console.log("Stats:", data);
});
