const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/kaizech_brain' });
async function run() {
  const res = await pool.query("SELECT message_count, COUNT(*) FROM conversations GROUP BY message_count ORDER BY message_count;");
  console.log(res.rows);
  pool.end();
}
run();
