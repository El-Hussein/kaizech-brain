import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeChunkEntity } from '@kaizech/database';
import { VectorSearchService } from './vector-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeChunkEntity])],
  providers: [VectorSearchService],
  exports: [VectorSearchService],
})
export class RAGModule {}
