import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PromptBuilderService } from '@kaizech/prompts';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext } from '@kaizech/shared';

@ApiTags('Prompts')
@ApiSecurity('api-key')
@Controller('prompts')
@UseGuards(ApiKeyGuard)
export class PromptsController {
  constructor(private readonly promptBuilder: PromptBuilderService) {}

  @Get()
  @ApiOperation({ summary: 'Get active prompt template for tenant' })
  getTemplate(@TenantContext() tenant: ITenantContext) {
    return this.promptBuilder.getActiveTemplate(tenant.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update system prompt template' })
  updateTemplate(
    @TenantContext() tenant: ITenantContext,
    @Body() body: any,
  ) {
    return this.promptBuilder.createOrUpdateTemplate(tenant.tenantId, body);
  }
}
