const API_KEY = 'kb_live_sk_mrkoon'; // Replace with a local API key if different
const TENANT_SLUG = 'mrkoon';
const LOCAL_API_URL = 'http://localhost:3000/api/v1/channels/chat';

async function testDecisionTree() {
  const sessionId = 'test-user-' + Math.random().toString(36).substring(7);

  console.log("==========================================");
  console.log("1. Sending 'menu' to trigger Decision Tree");
  console.log("==========================================");
  let res = await fetch(LOCAL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': TENANT_SLUG, 'x-api-key': API_KEY },
    body: JSON.stringify({ message: 'menu', sessionId, channel: 'api' })
  });
  let data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));

  console.log("\n==========================================");
  console.log("2. Simulating clicking a Category Button ('CAT_jewelery')");
  console.log("==========================================");
  // fakestoreapi.com/products/category/jewelery
  res = await fetch(LOCAL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': TENANT_SLUG, 'x-api-key': API_KEY },
    body: JSON.stringify({ message: '', payload: 'CAT_products/category/jewelery', sessionId, channel: 'api' })
  });
  data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));

  console.log("\n==========================================");
  console.log("3. Simulating clicking a Product Button ('PROD_7')");
  console.log("==========================================");
  res = await fetch(LOCAL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': TENANT_SLUG, 'x-api-key': API_KEY },
    body: JSON.stringify({ message: '', payload: 'PROD_products/7', sessionId, channel: 'api' })
  });
  data = await res.json();
  console.log("Response:", JSON.stringify(data, null, 2));

  console.log("\n==========================================");
  console.log("4. Sending natural language to test AI Fallback");
  console.log("==========================================");
  res = await fetch(LOCAL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-slug': TENANT_SLUG, 'x-api-key': API_KEY },
    body: JSON.stringify({ message: 'I need a refund for my last order', sessionId, channel: 'api' })
  });
  data = await res.json();
  console.log("Response:", data.reply || "AI fallback triggered (Check agent response).");
}

testDecisionTree();
