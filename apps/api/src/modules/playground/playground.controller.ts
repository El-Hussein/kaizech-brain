import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AgentOrchestratorService } from '@kaizech/agent';
import { TenantsService } from '../tenants/tenants.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext, MessageChannel } from '@kaizech/shared';

@ApiTags('Playground')
@ApiSecurity('api-key')
@Controller('playground')
@UseGuards(ApiKeyGuard)
export class PlaygroundController {
  constructor(
    private readonly agentOrchestrator: AgentOrchestratorService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'AI Playground — Test AI Assistant conversation flow' })
  async chat(
    @TenantContext() tenantContext: ITenantContext,
    @Body() body: { message: string; userId?: string; name?: string },
  ) {
    if (!body.message) {
      throw new BadRequestException('message is required');
    }

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    const userId = body.userId || 'playground-test-user';

    const result = await this.agentOrchestrator.processMessage({
      tenant,
      channelType: MessageChannel.PLAYGROUND,
      channelUserId: userId,
      userMessage: body.message,
      displayName: body.name || 'Playground Tester',
    });

    return {
      success: true,
      response: result.response,
      conversationId: result.conversationId,
      toolCallsExecuted: result.toolCallsExecuted,
      knowledgeSourcesUsed: result.knowledgeSourcesUsed,
      tokenUsage: result.tokenUsage,
      responseTimeMs: result.responseTimeMs,
    };
  }
}
