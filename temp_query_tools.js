const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:QfVInXbYwLwNIfQWvKqFkQcKjSjZvQcH@junction.proxy.rlwy.net:45958/railway' 
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT api_endpoint, name, parameters FROM tools WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mrkoon' LIMIT 1);
      FROM conversations 
      ORDER BY created_at DESC 
      LIMIT 20;
    `);
    console.log("Recent conversations:");
    console.table(res.rows);
    
    const countRes = await pool.query(`
      SELECT api_endpoint, name, parameters FROM tools WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'mrkoon' LIMIT 1);
    `);
    console.log("Total unlearned:", countRes.rows[0].count);
    
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
