const https = require('https');

fetch('https://kaizech-brain-production.up.railway.app/api/v1/learnings', {
  headers: {
    'x-tenant-slug': 'mrkoon',
    'x-api-key': 'kb_live_sk_mrkoon'
  }
}).then(res => res.json()).then(data => {
  console.log("Total Learnings:", data.length);
  if(data.length > 0) {
     console.log(data.map(l => l.suggestedRule.substring(0, 50)));
  }
});
