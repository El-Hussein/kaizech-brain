const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:QfVInXbYwLwNIfQWvKqFkQcKjSjZvQcH@junction.proxy.rlwy.net:45958/railway',
  ssl: {
    rejectUnauthorized: false,
  }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT * FROM conversations 
      WHERE id::text LIKE '6cb3ff2c%'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
