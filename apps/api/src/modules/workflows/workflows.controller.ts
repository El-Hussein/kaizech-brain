import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext } from '@kaizech/shared';

@ApiTags('Workflows')
@ApiSecurity('api-key')
@Controller('workflows')
@UseGuards(ApiKeyGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'List all workflows for the tenant' })
  listWorkflows(@TenantContext() tenant: ITenantContext) {
    return this.workflowsService.listWorkflows(tenant.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workflow' })
  getWorkflow(
    @TenantContext() tenant: ITenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.getWorkflow(tenant.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  createWorkflow(
    @TenantContext() tenant: ITenantContext,
    @Body() dto: CreateWorkflowDto,
    @Body('nodes') rawNodes: any[]
  ) {
    if (rawNodes) dto.nodes = rawNodes;
    return this.workflowsService.createWorkflow(tenant.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing workflow' })
  updateWorkflow(
    @TenantContext() tenant: ITenantContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
    @Body('nodes') rawNodes: any[]
  ) {
    if (rawNodes) dto.nodes = rawNodes;
    return this.workflowsService.updateWorkflow(tenant.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow' })
  deleteWorkflow(
    @TenantContext() tenant: ITenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.deleteWorkflow(tenant.tenantId, id);
  }
}
