const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres:QfVInXbYwLwNIfQWvKqFkQcKjSjZvQcH@junction.proxy.rlwy.net:45958/railway' 
});

async function run() {
  try {
    const resLearnings = await pool.query(`DELETE FROM agent_learnings;`);
    console.log(`Deleted ${resLearnings.rowCount} learnings from agent_learnings.`);
    
    const resConversations = await pool.query(`UPDATE conversations SET is_learned = false;`);
    console.log(`Updated ${resConversations.rowCount} conversations, set is_learned = false.`);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
