import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { AnalyticsService } from '@kaizech/analytics';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext } from '@kaizech/shared';

@ApiTags('Analytics')
@ApiSecurity('api-key')
@Controller('analytics')
@UseGuards(ApiKeyGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get tenant analytics dashboard metrics' })
  getDashboardMetrics(@TenantContext() tenant: ITenantContext) {
    return this.analyticsService.getTenantMetrics(tenant.tenantId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get agent health status for the tenant' })
  getHealth(@TenantContext() tenant: ITenantContext) {
    return this.analyticsService.getAgentHealth(tenant.tenantId);
  }
}
