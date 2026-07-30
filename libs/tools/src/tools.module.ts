import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolManifestEntity } from '@kaizech/database';
import { ToolExecutorService } from './tool-executor.service';

@Module({
  imports: [TypeOrmModule.forFeature([ToolManifestEntity])],
  providers: [ToolExecutorService],
  exports: [ToolExecutorService],
})
export class ToolsModule {}
