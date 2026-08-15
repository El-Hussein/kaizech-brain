const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:QfVInXbYwLwNIfQWvKqFkQcKjSjZvQcH@junction.proxy.rlwy.net:45958/railway' 
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT id, message_count, is_learned, created_at 
      FROM conversations 
      ORDER BY created_at DESC 
      LIMIT 20;
    `);
    console.log("Recent conversations:");
    console.table(res.rows);
    
    const countRes = await pool.query(`
      SELECT count(*) FROM conversations WHERE is_learned = false;
    `);
    console.log("Total unlearned:", countRes.rows[0].count);
    
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
