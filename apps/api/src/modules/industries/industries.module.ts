import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndustryEntity } from '@kaizech/database';
import { KnowledgeModule } from '@kaizech/knowledge';
import { IndustriesController } from './industries.controller';
import { IndustriesService } from './industries.service';

@Module({
  imports: [TypeOrmModule.forFeature([IndustryEntity]), KnowledgeModule],
  controllers: [IndustriesController],
  providers: [IndustriesService],
  exports: [IndustriesService],
})
export class IndustriesModule {}
