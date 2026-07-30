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

  async getActiveToolsForTenant(tenantId: string): Promise<ToolManifestEntity[]> {
    let tools = await this.toolManifestRepository.find({
      where: { tenantId, isActive: true },
    });

    // Auto-seed default getUserInfo tool if no tools exist for tenant
    if (tools.length === 0) {
      try {
        const defaultTool = this.toolManifestRepository.create({
          tenantId,
          name: 'getUserInfo',
          description: 'Fetch user profile details, active account status, role, verification, and ticket size',
          apiEndpoint: 'https://api-stg.markoontest.online/api/chatbot/getUserInfo',
          httpMethod: 'POST',
          isActive: true,
          parameters: {
            type: 'object',
            properties: {
              user_id: { type: 'integer', description: 'The unique ID of the user (e.g. 42)' },
              phone: { type: 'string', description: 'User mobile phone number (e.g. 01023239809)' },
              email: { type: 'string', description: 'User email address' },
            },
          },
        });
        const saved = await this.toolManifestRepository.save(defaultTool);
        tools = [saved];
      } catch (err: any) {
        this.logger.warn(`Could not auto-seed default getUserInfo tool: ${err.message}`);
      }
    }

    return tools;
  }

  async getToolDefinitionsForTenant(tenantId: string): Promise<ToolDefinition[]> {
    const tools = await this.getActiveToolsForTenant(tenantId);
    return tools.map((tool) => ({
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

    // Fallback default for getUserInfo if not found in database
    if (!tool && toolName === 'getUserInfo') {
      try {
        tool = await this.registerTool(tenant.id, {
          name: 'getUserInfo',
          description: 'Fetch user profile details, active account status, role, verification, and ticket size',
          apiEndpoint: 'https://api-stg.markoontest.online/api/chatbot/getUserInfo',
          httpMethod: 'POST',
          isActive: true,
          parameters: {
            type: 'object',
            properties: {
              user_id: { type: 'integer', description: 'The unique ID of the user (e.g. 42)' },
              phone: { type: 'string', description: 'User mobile phone number (e.g. 01023239809)' },
              email: { type: 'string', description: 'User email address' },
            },
          },
        });
      } catch {
        // Continue if save fails
      }
    }

    if (!tool && toolName !== 'getUserInfo') {
      throw new NotFoundException(`Tool '${toolName}' not registered or active for tenant.`);
    }

    const targetUrl = tool?.apiEndpoint || tenant.apiEndpoint || (toolName === 'getUserInfo' ? 'https://api-stg.markoontest.online/api/chatbot/getUserInfo' : null);
    if (!targetUrl) {
      throw new ToolExecutionException(toolName, `No endpoint configured for tool '${toolName}'.`);
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
