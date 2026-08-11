import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentLearningEntity, AgentLearningStatus } from '@kaizech/database';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext } from '@kaizech/shared';
import { LearningsService } from './learnings.service';

@ApiTags('Learnings')
@ApiSecurity('api-key')
@Controller('learnings')
@UseGuards(ApiKeyGuard)
export class LearningsController {
  constructor(
    @InjectRepository(AgentLearningEntity)
    private readonly learningRepo: Repository<AgentLearningEntity>,
    private readonly learningsService: LearningsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List agent learnings by status' })
  async findLearnings(
    @TenantContext() tenant: ITenantContext,
    @Query('status') status?: AgentLearningStatus
  ) {
    const whereClause: any = { tenantId: tenant.tenantId };
    if (status) {
      whereClause.status = status;
    }
    
    return this.learningRepo.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });
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
}
