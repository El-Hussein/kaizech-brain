const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'kaizech',
  password: process.env.DB_PASSWORD || 'kaizech_secret_2024',
  database: process.env.DB_DATABASE || 'kaizech_brain'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query('UPDATE conversations SET is_learned = false;');
    console.log('Reset conversations is_learned to false');
    await client.query('DELETE FROM agent_learnings;');
    console.log('Deleted all agent_learnings rules');
  } catch (err) {
    console.error('Error running query', err);
  } finally {
    await client.end();
  }
}
run();
