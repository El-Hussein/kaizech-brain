const fs = require('fs');
const path = require('path');

// Default configurations
const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'kb_live_sk_mrkoon'; // Default demo/admin key
const TENANT_SLUG = process.env.TENANT_SLUG || 'mrkoon';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulator() {
  console.log(`🚀 Starting Kaizech Brain Training Simulator...`);
  console.log(`🔗 Target API: ${API_URL}`);
  console.log(`🏢 Tenant Slug: ${TENANT_SLUG}\n`);

  const datasetPath = path.join(__dirname, 'training_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error('❌ Error: training_dataset.json not found!');
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  let totalInjected = 0;

  for (const group of dataset) {
    console.log(`\n🎭 Activating Persona: [${group.persona.toUpperCase()}]`);

    for (let c = 0; c < group.queries.length; c++) {
      // Unique user ID per *conversation* to ensure continuity
      const userId = `simulated_user_${group.persona}_${Date.now()}_${c}`;
      const randomIp = `203.0.113.${Math.floor(Math.random() * 255)}`;
      
      const conversation = Array.isArray(group.queries[c]) ? group.queries[c] : [group.queries[c]];
      console.log(`\n   💬 Starting Multi-Turn Conversation [${c + 1}] (${conversation.length} messages)`);

      for (let i = 0; i < conversation.length; i++) {
        const query = conversation[i];
        console.log(`      ➔ User: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
        
        try {
          const response = await fetch(`${API_URL}/api/v1/channels/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': TENANT_SLUG,
              'x-api-key': API_KEY,
              'x-forwarded-for': randomIp
            },
            body: JSON.stringify({
              channel: 'web',
              tenantSlug: TENANT_SLUG,
              sessionId: userId, // Keeps the same session ID for multi-turn!
              message: query
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`      ✅ Bot: "${data.reply?.substring(0, 50) || 'OK'}..."`);
            totalInjected++;
          } else {
            const errorText = await response.text();
            console.error(`      ❌ Failed: Status ${response.status} - ${errorText}`);
          }
        } catch (err) {
          console.error(`      ❌ Failed Network Error: ${err.message}`);
        }

        // Small delay between turns
        await delay(2500);
      }
    }
  }

  console.log(`\n🎉 Training Simulation Complete!`);
  console.log(`📈 Total conversations injected: ${totalInjected}`);
  console.log(`💡 Next Step: Log into the Dashboard and click 'Force AI Learning Now' in the Learnings Tab to extract rules from these queries.`);
}

runSimulator();
