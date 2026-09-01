import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantEntity } from './entities/tenant.entity';
import { ApiKeyEntity } from './entities/api-key.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { KnowledgeSourceEntity } from './entities/knowledge-source.entity';
import { KnowledgeChunkEntity } from './entities/knowledge-chunk.entity';
import { ToolManifestEntity } from './entities/tool-manifest.entity';
import { PromptTemplateEntity } from './entities/prompt-template.entity';
import { TicketEntity } from './entities/ticket.entity';
import { UserProfileEntity } from './entities/user-profile.entity';
import { AnalyticsEventEntity } from './entities/analytics-event.entity';
import { IndustryEntity } from './entities/industry.entity';
import { KnowledgeNodeEntity } from './entities/knowledge-node.entity';
import { KnowledgeEdgeEntity } from './entities/knowledge-edge.entity';
import { AgentLearningEntity } from './entities/agent-learning.entity';
import { ContactRequest } from './entities/contact-request.entity';
import { InterviewQuestionEntity } from './entities/interview-question.entity';
import { BusinessInterviewEntity } from './entities/business-interview.entity';
import { InterviewResponseEntity } from './entities/interview-response.entity';

const entities = [
  TenantEntity,
  ApiKeyEntity,
  ConversationEntity,
  MessageEntity,
  KnowledgeSourceEntity,
  KnowledgeChunkEntity,
  ToolManifestEntity,
  PromptTemplateEntity,
  TicketEntity,
  UserProfileEntity,
  AnalyticsEventEntity,
  IndustryEntity,
  KnowledgeNodeEntity,
  KnowledgeEdgeEntity,
  AgentLearningEntity,
  ContactRequest,
  InterviewQuestionEntity,
  BusinessInterviewEntity,
  InterviewResponseEntity,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'kaizech'),
        password: configService.get('DB_PASSWORD', 'kaizech_secret_2024'),
        database: configService.get('DB_DATABASE', 'kaizech_brain'),
        entities,
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
