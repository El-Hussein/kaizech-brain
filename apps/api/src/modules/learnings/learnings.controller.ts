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

  @Get('stats')
  @ApiOperation({ summary: 'Get counts of learnings by status' })
  async getLearningsStats(@TenantContext() tenant: ITenantContext) {
    const qb = this.learningRepo.createQueryBuilder('learning')
      .select('learning.status', 'status')
      .addSelect('COUNT(learning.id)', 'count')
      .where('learning.tenantId = :tenantId', { tenantId: tenant.tenantId })
      .groupBy('learning.status');
    
    const results = await qb.getRawMany();
    const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const row of results) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = parseInt(row.count, 10);
      }
    }
    return stats;
  }

  @Get()
  @ApiOperation({ summary: 'List agent learnings by status' })
  async findLearnings(
    @TenantContext() tenant: ITenantContext,
    @Query('status') status?: AgentLearningStatus,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<AgentLearningEntity> = { tenantId: tenant.tenantId };
    if (status) {
      whereClause.status = status;
    }
    
    const [learnings, total] = await this.learningRepo.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = learnings.map(l => {
      let metadata = { reasoning: 'No reasoning provided by AI.', transcript: '' };
      if (l.originalLLMOutput) {
        try {
          const parsed = JSON.parse(l.originalLLMOutput);
          metadata = {
            reasoning: parsed.inferredFeedback || parsed.reasoning || 'No reasoning provided by AI.',
            transcript: parsed.transcript || '',
          };
        } catch (e) {
          metadata.reasoning = l.originalLLMOutput;
        }
      }

      return {
        id: l.id,
        sourceConversationId: l.conversationId,
        category: l.category,
        suggestedRule: l.learningRule,
        confidenceScore: l.confidenceScore,
        status: l.status.toUpperCase(),
        metadata,
        createdAt: l.createdAt,
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
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
