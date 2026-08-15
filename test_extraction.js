const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:QfVInXbYwLwNIfQWvKqFkQcKjSjZvQcH@junction.proxy.rlwy.net:45958/railway' 
});

async function run() {
  const res = await pool.query(`
    SELECT c.id, c.message_count, m.content, m.role, m.created_at
    FROM conversations c
    JOIN messages m ON c.id = m.conversation_id
    WHERE c.message_count >= 2
    ORDER BY c.created_at DESC
    LIMIT 20;
  `);
  
  // group by conversation
  const convs = {};
  res.rows.forEach(r => {
    if(!convs[r.id]) convs[r.id] = [];
    convs[r.id].push(r);
  });
  
  for(const [id, msgs] of Object.entries(convs)) {
    console.log(`\n--- Conversation ${id} ---`);
    msgs.sort((a,b) => a.created_at - b.created_at).forEach(m => {
      console.log(`[${m.role}]: ${m.content.substring(0, 50)}`);
    });
  }
  
  pool.end();
}
run();
