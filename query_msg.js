const { DataSource } = require('typeorm');
const { MessageEntity } = require('./libs/database/dist/entities/message.entity.js');
const { ConversationEntity } = require('./libs/database/dist/entities/conversation.entity.js');
const { TenantEntity } = require('./libs/database/dist/entities/tenant.entity.js');
const { BaseEntity } = require('./libs/database/dist/entities/base.entity.js');

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/kaizech',
    entities: [MessageEntity, ConversationEntity, TenantEntity, BaseEntity],
    synchronize: false,
  });
  await ds.initialize();
  const msg = await ds.getRepository(MessageEntity).find({
    where: { role: 'assistant' },
    order: { createdAt: 'DESC' },
    take: 1
  });
  console.log(JSON.stringify(msg, null, 2));
  await ds.destroy();
}
run().catch(console.error);
