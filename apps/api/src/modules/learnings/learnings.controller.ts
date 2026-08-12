import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AgentLearningEntity, AgentLearningStatus } from '@kaizech/database';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext } from '@kaizech/shared';
import { LearningsService } from './learnings.service';
import { LearningsCronService } from './learnings.cron.service';

@ApiTags('Learnings')
@ApiSecurity('api-key')
@Controller('learnings')
@UseGuards(ApiKeyGuard)
export class LearningsController {
  constructor(
    @InjectRepository(AgentLearningEntity)
    private readonly learningRepo: Repository<AgentLearningEntity>,
    private readonly learningsService: LearningsService,
    private readonly learningsCronService: LearningsCronService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List agent learnings by status' })
  async findLearnings(
    @TenantContext() tenant: ITenantContext,
    @Query('status') status?: AgentLearningStatus
  ) {
    const whereClause: FindOptionsWhere<AgentLearningEntity> = { tenantId: tenant.tenantId };
    if (status) {
      whereClause.status = status;
    }
    
    const learnings = await this.learningRepo.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });

    return learnings.map(l => ({
      id: l.id,
      sourceConversationId: l.conversationId,
      category: l.category,
      suggestedRule: l.learningRule,
      confidenceScore: l.confidenceScore,
      status: l.status.toUpperCase(),
      metadata: { reasoning: l.originalLLMOutput },
      createdAt: l.createdAt,
    }));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a learning rule' })
  async approve(
    @Param('id') id: string,
    @Body() body: { modifiedRule?: string },
  ) {
    return this.learningsService.approveLearning(id, body.modifiedRule);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a learning rule' })
  async reject(@Param('id') id: string) {
    return this.learningsService.rejectLearning(id);
  }

  @Post('trigger-extraction')
  @ApiOperation({ summary: 'Manually trigger learning extraction' })
  async triggerExtraction(@TenantContext() tenant: ITenantContext) {
    // Run it asynchronously so we don't block the HTTP response
    this.learningsCronService.handleLearningExtraction(tenant.tenantId).catch(err => {
      console.error('Error in manual learning extraction:', err);
    });
    return { success: true, message: 'Extraction started in the background.' };
  }
}
