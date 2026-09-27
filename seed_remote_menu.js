const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://kaizech:kaizech_secret_2024@localhost:5432/kaizech_brain' 
});

async function seed() {
  console.log("Adding menu_config to mrkoon-auctions tenant in the local database...");
  
  try {
    const res = await pool.query(`
      UPDATE tenants 
      SET menu_config = '{
        "isMenuEnabled": true,
        "welcomeMessage": "Welcome to our store! What would you like to browse?",
        "apiBaseUrl": "https://fakestoreapi.com",
        "cacheTtlMinutes": 5
      }'::jsonb
      WHERE slug = 'mrkoon-auctions';
    `);
    
    console.log(`Done! Updated ${res.rowCount} tenant(s).`);
  } catch (e) {
    console.error("Error updating database:", e.message);
  } finally {
    pool.end();
  }
}

seed();
