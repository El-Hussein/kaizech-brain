import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeSourceEntity, KnowledgeChunkEntity, TenantEntity, KnowledgeNodeEntity, KnowledgeEdgeEntity } from '@kaizech/database';
import { RAGModule } from '@kaizech/rag';
import { AgentModule } from '@kaizech/agent';
import { DocumentParserService } from './document-parser.service';
import { WebsiteCrawlerService } from './website-crawler.service';
import { KnowledgeManagerService } from './knowledge-manager.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeSourceEntity, KnowledgeChunkEntity, TenantEntity, KnowledgeNodeEntity, KnowledgeEdgeEntity]),
    RAGModule,
    AgentModule,
  ],
  providers: [
    DocumentParserService,
    WebsiteCrawlerService,
    KnowledgeManagerService,
  ],
  exports: [
    DocumentParserService,
    WebsiteCrawlerService,
    KnowledgeManagerService,
  ],
})
export class KnowledgeModule {}
