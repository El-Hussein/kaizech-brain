const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:QfVInXbYwLwNIfQWvKqFkQcKjSjZvQcH@junction.proxy.rlwy.net:45958/railway' });
async function run() {
  try {
    const res = await pool.query(`
      SELECT id, status, learning_rule FROM agent_learnings;
    `);
    console.log("Learnings:", res.rows);
  } catch(e) {
    console.error(e);
  } finally { pool.end(); }
}
run();
