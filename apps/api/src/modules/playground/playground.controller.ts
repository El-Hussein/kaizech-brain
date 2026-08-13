import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AgentOrchestratorService } from '@kaizech/agent';
import { TenantsService } from '../tenants/tenants.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext, MessageChannel } from '@kaizech/shared';
import { Response } from 'express';

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
    @Body() body: {
      message: string;
      userId?: string;
      name?: string;
      openaiApiKey?: string;
      groqApiKey?: string;
      aiProvider?: string;
      groqModel?: string;
    },
  ) {
    if (!body.message) {
      throw new BadRequestException('message is required');
    }

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    tenant.settings = {
      ...(tenant.settings || {}),
      ...(body.aiProvider ? { aiProvider: body.aiProvider } : {}),
      ...(body.openaiApiKey ? { openaiApiKey: body.openaiApiKey } : {}),
      ...(body.groqApiKey ? { groqApiKey: body.groqApiKey } : {}),
      ...(body.groqModel ? { groqModel: body.groqModel } : {}),
    };
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

  @Post('chat-stream')
  @ApiOperation({ summary: 'AI Playground — Stream AI Assistant conversation response (SSE)' })
  async chatStream(
    @TenantContext() tenantContext: ITenantContext,
    @Body() body: {
      message: string;
      userId?: string;
      name?: string;
      openaiApiKey?: string;
      groqApiKey?: string;
      aiProvider?: string;
      groqModel?: string;
    },
    @Res() res: Response,
  ) {
    if (!body.message) {
      throw new BadRequestException('message is required');
    }

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    tenant.settings = {
      ...(tenant.settings || {}),
      ...(body.aiProvider ? { aiProvider: body.aiProvider } : {}),
      ...(body.openaiApiKey ? { openaiApiKey: body.openaiApiKey } : {}),
      ...(body.groqApiKey ? { groqApiKey: body.groqApiKey } : {}),
      ...(body.groqModel ? { groqModel: body.groqModel } : {}),
    };
    const userId = body.userId || 'playground-test-user';

    (res as any).setHeader('Content-Type', 'text/event-stream');
    (res as any).setHeader('Cache-Control', 'no-cache');
    (res as any).setHeader('Connection', 'keep-alive');
    (res as any).setHeader('X-Accel-Buffering', 'no');

    const result = await this.agentOrchestrator.processMessageStream(
      {
        tenant,
        channelType: MessageChannel.PLAYGROUND,
        channelUserId: userId,
        userMessage: body.message,
        displayName: body.name || 'Playground Tester',
      },
      (chunk: string) => {
        (res as any).write(`data: ${JSON.stringify({ chunk })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      },
    );

    (res as any).write(`data: ${JSON.stringify({ event: 'DONE', meta: result })}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    (res as any).end();
  }
}
