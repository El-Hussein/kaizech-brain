import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ToolExecutorService } from '@kaizech/tools';
import { TenantsService } from '../tenants/tenants.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext } from '@kaizech/shared';

@ApiTags('Tools')
@ApiSecurity('api-key')
@Controller('tools')
@UseGuards(ApiKeyGuard)
export class ToolsController {
  constructor(
    private readonly toolExecutor: ToolExecutorService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List registered tools for tenant' })
  listTools(@TenantContext() tenant: ITenantContext) {
    return this.toolExecutor.getActiveToolsForTenant(tenant.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Register or update tool manifest' })
  registerTool(
    @TenantContext() tenant: ITenantContext,
    @Body() body: any,
  ) {
    if (!body.name || !body.apiEndpoint) {
      throw new BadRequestException('Tool name and apiEndpoint are required');
    }
    return this.toolExecutor.registerTool(tenant.tenantId, body);
  }

  @Post('test')
  @ApiOperation({ summary: 'Tool Tester — execute tool directly for debugging' })
  async testTool(
    @TenantContext() tenantContext: ITenantContext,
    @Body() body: { toolName: string; parameters: Record<string, any> },
  ) {
    if (!body.toolName) {
      throw new BadRequestException('toolName is required');
    }

    const tenant = await this.tenantsService.findOne(tenantContext.tenantId);
    const startTime = Date.now();
    const result = await this.toolExecutor.executeTool(
      tenant,
      body.toolName,
      body.parameters || {},
    );
    const durationMs = Date.now() - startTime;

    return {
      success: true,
      toolName: body.toolName,
      executionTimeMs: durationMs,
      inputParameters: body.parameters || {},
      response: result,
    };
  }
}
