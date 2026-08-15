import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosRequestConfig } from 'axios';
import { ToolManifestEntity, TenantEntity } from '@kaizech/database';
import { ToolDefinition, ToolExecutionException } from '@kaizech/shared';

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    @InjectRepository(ToolManifestEntity)
    private readonly toolManifestRepository: Repository<ToolManifestEntity>,
  ) {}

  async getActiveToolsForTenant(tenantId: string, page: number = 1, limit: number = 20): Promise<{ data: ToolManifestEntity[], total: number, page: number, limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.toolManifestRepository.findAndCount({
      where: { tenantId, isActive: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async deleteTool(tenantId: string, idOrName: string): Promise<boolean> {
    const tool = await this.toolManifestRepository.findOne({
      where: [
        { id: idOrName, tenantId },
        { name: idOrName, tenantId },
      ],
    });

    if (!tool) {
      return false;
    }

    await this.toolManifestRepository.remove(tool);
    return true;
  }

  async getToolDefinitionsForTenant(tenantId: string): Promise<ToolDefinition[]> {
    // For LLM usage, we fetch a large limit to get all tools
    const toolsResult = await this.getActiveToolsForTenant(tenantId, 1, 1000);
    return toolsResult.data.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || `Execute ${tool.name}`,
        parameters: tool.parameters || { type: 'object', properties: {} },
      },
    }));
  }

  async registerTool(tenantId: string, data: Partial<ToolManifestEntity>): Promise<ToolManifestEntity> {
    const existing = await this.toolManifestRepository.findOne({
      where: { tenantId, name: data.name },
    });

    if (existing) {
      Object.assign(existing, data);
      return this.toolManifestRepository.save(existing);
    }

    const tool = this.toolManifestRepository.create({
      ...data,
      tenantId,
    });
    return this.toolManifestRepository.save(tool);
  }

  async executeTool(
    tenant: TenantEntity,
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    let tool = await this.toolManifestRepository.findOne({
      where: { tenantId: tenant.id, name: toolName, isActive: true },
    });

    if (!tool) {
      throw new NotFoundException(`Tool '${toolName}' not registered or active for tenant.`);
    }

    // Resolve the full URL: tool stores relative path, tenant has the base URL
    let targetUrl: string | null = null;
    const toolEndpoint = tool?.apiEndpoint;

    if (toolEndpoint) {
      if (toolEndpoint.startsWith('http://') || toolEndpoint.startsWith('https://')) {
        // Full URL stored on tool (backward compatibility)
        targetUrl = toolEndpoint;
      } else if (tenant.apiEndpoint) {
        // Relative path — prepend tenant's base URL
        const base = tenant.apiEndpoint.replace(/\/+$/, ''); // strip trailing slashes
        const path = toolEndpoint.startsWith('/') ? toolEndpoint : `/${toolEndpoint}`;
        targetUrl = `${base}${path}`;
      }
    }

    // Fallback to tenant base URL alone if tool has no endpoint
    if (!targetUrl && tenant.apiEndpoint) {
      targetUrl = tenant.apiEndpoint;
    }

    if (!targetUrl) {
      throw new ToolExecutionException(toolName, `No endpoint configured for tool '${toolName}'. Set a base URL in tenant settings or a full URL on the tool.`);
    }

    this.logger.log(`Executing tool '${toolName}' for tenant '${tenant.name}' -> ${targetUrl}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'KaizechBrain-Agent/1.0',
      ...(tool?.headers || {}),
    };

    // Apply Authentication if configured
    if (tool?.authType === 'api_key' && tool.authConfig?.key) {
      const headerName = tool.authConfig.headerName || 'x-api-key';
      headers[headerName] = tool.authConfig.key;
    } else if (tool?.authType === 'bearer' && tool.authConfig?.token) {
      headers['Authorization'] = `Bearer ${tool.authConfig.token}`;
    }

    const httpMethod = (tool?.httpMethod || 'POST').toUpperCase();
    const requestConfig: AxiosRequestConfig = {
      method: httpMethod as any,
      url: targetUrl,
      headers,
      timeout: tool?.timeoutMs || 30000,
    };

    if (requestConfig.method === 'GET') {
      requestConfig.params = { ...args };
    } else {
      requestConfig.data = { ...args };
    }

    try {
      const startTime = Date.now();
      const response = await axios(requestConfig);
      const durationMs = Date.now() - startTime;

      this.logger.log(`Tool '${toolName}' executed successfully in ${durationMs}ms`);
      return response.data;
    } catch (error: any) {
      let errorMsg = error.message || 'Unknown network error';
      if (error.response) {
        const dataStr = typeof error.response.data === 'object'
          ? JSON.stringify(error.response.data)
          : String(error.response.data || '');
        errorMsg = `Status ${error.response.status}: ${dataStr}`;
      }

      this.logger.error(`Tool '${toolName}' execution failed: ${errorMsg}`, error.stack);
      throw new ToolExecutionException(toolName, errorMsg);
    }
  }
}
