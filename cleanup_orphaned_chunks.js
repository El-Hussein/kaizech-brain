const { DataSource } = require('typeorm');
require('dotenv').config();

async function run() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  await dataSource.initialize();
  console.log('Connected to DB');

  // Find chunks where the source no longer exists or is soft-deleted
  const result = await dataSource.query(`
    DELETE FROM knowledge_chunks
    WHERE source_id NOT IN (
      SELECT id FROM knowledge_sources WHERE deleted_at IS NULL
    )
  `);

  console.log('Cleaned up orphaned chunks:', result);
  await dataSource.destroy();
}

run().catch(console.error);
