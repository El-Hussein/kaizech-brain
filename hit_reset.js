const fs = require('fs');
const https = require('https');

const API_KEY = 'kb_live_sk_mrkoon';
const TENANT_SLUG = 'mrkoon';
const API_URL = 'https://kaizech-brain-production.up.railway.app/api/v1/conversations/reset-learned';

async function reset() {
  let success = false;
  let retries = 0;
  while (!success && retries < 15) {
    console.log("Attempting to hit reset endpoint...");
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-tenant-slug': TENANT_SLUG,
          'x-api-key': API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Success! Response:", data);
        success = true;
      } else {
        console.log(`Failed. Status: ${response.status}. Retrying in 10s...`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}. Retrying in 10s...`);
    }
    
    if (!success) {
      await new Promise(r => setTimeout(r, 10000));
      retries++;
    }
  }
}

reset();
